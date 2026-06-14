// Tailoring step: given a job and the candidate's base CV JSON, ask Claude to
// rewrite the CV for this specific role and draft a grounded cover letter.
//
// SDK-binding decision (IMPORTANT):
//   The installed @anthropic-ai/sdk is v0.68.0. That version does NOT expose the
//   newer structured-outputs surface (`output_config.format` / `messages.parse`
//   / `parsed_output`) nor adaptive thinking (`thinking: {type: "adaptive"}`).
//   I verified this by inspecting node_modules/@anthropic-ai/sdk: the only
//   thinking configs are ThinkingConfigEnabled/Disabled, and there is no
//   output_config field on MessageCreateParams.
//
//   To still *force* the tailored output into a fixed JSON shape, we use the
//   SDK-supported equivalent: a single tool with a strict JSON input schema plus
//   `tool_choice: {type: "tool", name}`. Forcing a specific tool guarantees the
//   model returns exactly one tool_use block whose `input` matches the schema —
//   this is the structured-output mechanism available in this SDK version.
//
//   Adaptive thinking is unavailable here; forced tool_choice is also mutually
//   exclusive with extended thinking on the Messages API, so we let the model
//   reason within the tool call rather than enabling a thinking budget. The base
//   CV is prompt-cached so repeated tailoring runs reuse the large stable prefix.

import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";
import type { Job } from "./types";

export interface TailorResult {
  tailoredCvJson: Record<string, unknown>;
  coverLetter: string;
  model: string;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
}

export interface TailorInput {
  job: Job;
  baseCvJson: Record<string, unknown>;
}

const TOOL_NAME = "emit_tailored_application";

// Per-MTok pricing (USD). Keyed by a substring of the model id.
const PRICING: Array<{ match: string; inPerMTok: number; outPerMTok: number }> = [
  { match: "opus-4-8", inPerMTok: 5, outPerMTok: 25 },
  { match: "opus", inPerMTok: 5, outPerMTok: 25 },
  { match: "sonnet", inPerMTok: 3, outPerMTok: 15 },
];

/** Compute USD cost from token usage, picking rates by model id. */
export function computeCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const rate = PRICING.find((p) => model.includes(p.match)) ?? PRICING.find((p) => p.match === "sonnet")!;
  const cost = (inputTokens / 1_000_000) * rate.inPerMTok + (outputTokens / 1_000_000) * rate.outPerMTok;
  // Round to 6 decimal places to keep DB values tidy.
  return Math.round(cost * 1_000_000) / 1_000_000;
}

// JSON Schema for the tailored CV. Keys mirror what api/render.py accepts; all
// optional so the renderer falls back to the base CV for anything omitted.
const TAILORED_CV_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    role: {
      type: "string",
      description: "Headline role/title tuned to the target job (e.g. 'Senior AI Engineer').",
    },
    profile: {
      type: "string",
      description: "Rewritten 2-4 sentence professional summary emphasising fit for THIS job. Grounded only in base CV facts.",
    },
    experience: {
      type: "array",
      description:
        "Experience entries with bullets rewritten to surface the most relevant achievements for this job. Keep all roles; only rephrase/reorder bullets — never invent.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          dates: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["title", "dates", "bullets"],
      },
    },
    skills: {
      type: "array",
      description:
        "Skill groups reordered so the categories/items most relevant to the job come first. Each entry is [category, items].",
      items: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 2,
      },
    },
  },
  required: ["role", "profile", "experience", "skills"],
};

const APPLICATION_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    tailored_cv: TAILORED_CV_SCHEMA,
    cover_letter: {
      type: "string",
      description:
        "Concise, specific cover letter (3-5 short paragraphs) addressed to the hiring team. Reference the company and role. Use ONLY facts present in the base CV — never fabricate employers, dates, metrics, or skills.",
    },
  },
  required: ["tailored_cv", "cover_letter"],
};

const SYSTEM_PROMPT = [
  "You are an expert technical recruiter and CV writer.",
  "You tailor a candidate's existing CV to a specific job and draft a cover letter.",
  "Hard rules:",
  "- Ground everything ONLY in the provided base CV. Never invent employers, titles, dates, degrees, metrics, or skills the candidate does not already list.",
  "- You may rephrase, reorder, emphasise, and trim — never fabricate.",
  "- Keep every experience entry; rewrite its bullets to foreground what matters for this job.",
  "- The cover letter must be specific to the company and role, concise, and free of clichés.",
  `- Return your result by calling the ${TOOL_NAME} tool exactly once. Do not write any prose outside the tool call.`,
].join("\n");

function buildJobText(job: Job): string {
  const lines = [
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    job.location ? `Location: ${job.location}` : null,
    job.country ? `Country: ${job.country}` : null,
    job.remote != null ? `Remote: ${job.remote}` : null,
    "",
    "Job description:",
    job.jdText ?? "(no description provided)",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

interface TailorPayload {
  tailored_cv: Record<string, unknown>;
  cover_letter: string;
}

function isTailorPayload(v: unknown): v is TailorPayload {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.cover_letter === "string" &&
    typeof o.tailored_cv === "object" &&
    o.tailored_cv !== null
  );
}

/**
 * Tailor the base CV for a job and draft a cover letter. Throws on API error or
 * if the model fails to return a well-formed tool call.
 */
export async function tailorForJob({ job, baseCvJson }: TailorInput): Promise<TailorResult> {
  const model = env.tailorModel();
  const client = new Anthropic({ apiKey: env.anthropicApiKey() });

  const baseCvText = JSON.stringify(baseCvJson, null, 2);

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
      },
      {
        // Prompt-cache the (large, stable) base CV so repeated tailoring runs
        // reuse this prefix at ~0.1x input cost.
        type: "text",
        text: `BASE CV (JSON — the only source of truth about the candidate):\n${baseCvText}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Emit the tailored CV (subset of fields to override on the base CV) and the cover letter.",
        input_schema: APPLICATION_SCHEMA,
      },
    ],
    // Force the model to answer via the tool — this is how we get a guaranteed
    // JSON shape on this SDK version (no output_config available).
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [
      {
        role: "user",
        content: `Tailor my CV and write a cover letter for the following job.\n\n${buildJobText(job)}`,
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME,
  );
  if (!toolUse) {
    throw new Error(`tailorForJob: model did not return a ${TOOL_NAME} tool call`);
  }
  if (!isTailorPayload(toolUse.input)) {
    throw new Error("tailorForJob: tool call input did not match expected shape");
  }

  const inputTokens =
    response.usage.input_tokens +
    (response.usage.cache_creation_input_tokens ?? 0) +
    (response.usage.cache_read_input_tokens ?? 0);
  const outputTokens = response.usage.output_tokens;

  return {
    tailoredCvJson: toolUse.input.tailored_cv,
    coverLetter: toolUse.input.cover_letter,
    model: response.model ?? model,
    costUsd: computeCostUsd(response.model ?? model, inputTokens, outputTokens),
    inputTokens,
    outputTokens,
  };
}
