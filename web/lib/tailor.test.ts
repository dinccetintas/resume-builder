// Tests for tailorForJob. The Anthropic SDK is fully mocked — no real API calls.
//
// We assert that:
//   - the prompt is sensible: base CV is prompt-cached, the JD is included, the
//     structured tool is forced via tool_choice;
//   - a well-formed forced tool_use response parses into the right shape;
//   - cost is computed correctly from usage and the model's per-MTok rates;
//   - cache + uncached input tokens are summed;
//   - a missing tool call surfaces as an error.

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Job } from "./types";

// --- Mock @anthropic-ai/sdk -------------------------------------------------
// A single shared mock for messages.create that each test configures.
const createMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: createMock };
    constructor(_opts?: unknown) {}
  }
  return { default: MockAnthropic };
});

// --- Mock env ---------------------------------------------------------------
vi.mock("./env", () => ({
  env: {
    anthropicApiKey: () => "test-key",
    tailorModel: () => "claude-sonnet-4-6",
  },
}));

import { computeCostUsd, tailorForJob } from "./tailor";

const JOB: Job = {
  source: "greenhouse",
  externalId: "acme:42",
  title: "Senior AI Engineer",
  company: "Acme AI",
  location: "London, UK",
  country: "UK",
  jdText: "Build LLM-powered systems with Python and FastAPI.",
  applyUrl: "https://acme.example/jobs/42",
  ats: "greenhouse",
};

const BASE_CV = {
  name: "Jane Doe",
  role: "AI Engineer",
  profile: "Engineer with ML experience.",
  experience: [
    { title: "ML Engineer, Foo", dates: "2021-2024", bullets: ["Built models."] },
  ],
  skills: [["Languages", "Python, TypeScript"]],
};

function goodResponse() {
  return {
    model: "claude-sonnet-4-6",
    content: [
      {
        type: "tool_use",
        id: "toolu_1",
        name: "emit_tailored_application",
        input: {
          tailored_cv: {
            role: "Senior AI Engineer",
            profile: "LLM engineer tuned for Acme AI.",
            experience: [
              {
                title: "ML Engineer, Foo",
                dates: "2021-2024",
                bullets: ["Built LLM systems in Python and FastAPI."],
              },
            ],
            skills: [["Languages", "Python, TypeScript"]],
          },
          cover_letter: "Dear Acme AI, I am excited to apply...",
        },
      },
    ],
    usage: {
      input_tokens: 100,
      output_tokens: 200,
      cache_creation_input_tokens: 1000,
      cache_read_input_tokens: 4000,
    },
  };
}

beforeEach(() => {
  createMock.mockReset();
});

describe("computeCostUsd", () => {
  it("uses sonnet rates ($3 in / $15 out)", () => {
    // 1M input + 1M output => $3 + $15 = $18
    expect(computeCostUsd("claude-sonnet-4-6", 1_000_000, 1_000_000)).toBeCloseTo(18, 6);
  });

  it("uses opus-4-8 rates ($5 in / $25 out)", () => {
    expect(computeCostUsd("claude-opus-4-8", 1_000_000, 1_000_000)).toBeCloseTo(30, 6);
  });

  it("defaults to sonnet rates for unknown models", () => {
    expect(computeCostUsd("some-future-model", 1_000_000, 0)).toBeCloseTo(3, 6);
  });
});

describe("tailorForJob", () => {
  it("builds a sensible prompt: cached base CV, JD included, forced tool", async () => {
    createMock.mockResolvedValue(goodResponse());

    await tailorForJob({ job: JOB, baseCvJson: BASE_CV });

    expect(createMock).toHaveBeenCalledTimes(1);
    const params = createMock.mock.calls[0][0];

    // Model from env.
    expect(params.model).toBe("claude-sonnet-4-6");

    // System is an array; the base CV block is prompt-cached.
    expect(Array.isArray(params.system)).toBe(true);
    const cachedBlock = params.system.find(
      (b: { cache_control?: unknown }) => b.cache_control,
    );
    expect(cachedBlock).toBeTruthy();
    expect(cachedBlock.cache_control).toEqual({ type: "ephemeral" });
    // The candidate's real name appears in the cached base-CV block.
    expect(cachedBlock.text).toContain("Jane Doe");

    // A single tool is defined and forced via tool_choice.
    expect(params.tools).toHaveLength(1);
    expect(params.tool_choice).toMatchObject({ type: "tool", name: params.tools[0].name });
    expect(params.tools[0].input_schema.type).toBe("object");

    // The user message carries the job title, company, and JD text.
    const userMsg = params.messages[0].content as string;
    expect(userMsg).toContain("Senior AI Engineer");
    expect(userMsg).toContain("Acme AI");
    expect(userMsg).toContain("FastAPI");
  });

  it("parses the forced tool_use into the right shape and computes cost", async () => {
    createMock.mockResolvedValue(goodResponse());

    const result = await tailorForJob({ job: JOB, baseCvJson: BASE_CV });

    expect(result.coverLetter).toBe("Dear Acme AI, I am excited to apply...");
    expect(result.tailoredCvJson).toMatchObject({ role: "Senior AI Engineer" });
    expect(result.model).toBe("claude-sonnet-4-6");

    // input tokens sum uncached + cache create + cache read = 100 + 1000 + 4000.
    expect(result.inputTokens).toBe(5100);
    expect(result.outputTokens).toBe(200);

    // cost = 5100/1e6 * 3 + 200/1e6 * 15.
    const expected = (5100 / 1_000_000) * 3 + (200 / 1_000_000) * 15;
    expect(result.costUsd).toBeCloseTo(expected, 9);
  });

  it("throws when the model returns no tool call", async () => {
    createMock.mockResolvedValue({
      model: "claude-sonnet-4-6",
      content: [{ type: "text", text: "no tool here" }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    await expect(tailorForJob({ job: JOB, baseCvJson: BASE_CV })).rejects.toThrow();
  });

  it("throws when the tool input has the wrong shape", async () => {
    createMock.mockResolvedValue({
      model: "claude-sonnet-4-6",
      content: [
        {
          type: "tool_use",
          id: "toolu_2",
          name: "emit_tailored_application",
          input: { cover_letter: 123 }, // wrong types, missing tailored_cv
        },
      ],
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    await expect(tailorForJob({ job: JOB, baseCvJson: BASE_CV })).rejects.toThrow();
  });
});
