// Computer-use apply engine.
//
// Drives an Anthropic-hosted computer-use session to fill and submit a job
// application hands-off. Two residuals are detected and routed to needs_manual,
// never faked:
//   - CAPTCHA      → Claude won't solve them by policy.
//   - LinkedIn     → Easy Apply auto-submit is banned; never submit on linkedin.com.
//
// A confidence gate also routes to needs_manual when a required field can't be
// mapped or a screening question can't be grounded (see lib/apply/screening.ts).
//
// HONEST SCOPE / TODO — live computer-use wiring.
// Computer use requires a sandboxed desktop (Xvfb + browser in a container/VM)
// that translates Claude's mouse/keyboard/screenshot tool calls into real
// actions. That environment cannot be provisioned or tested in this codebase,
// so it is isolated behind the `ComputerUseDriver` interface below with a
// compiling default (`UnconfiguredDriver`) that makes the gate fail safe
// (routes to needs_manual). The ORCHESTRATION around it — the agent loop
// against client.beta.messages.create, LinkedIn/CAPTCHA detection, the
// confidence gate, IMAP/screening calls, and Supabase status transitions — is
// real and exercised. Swap in a live driver (e.g. the anthropic-quickstarts
// computer-use-demo container) to go fully hands-off.

import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";
import { supabaseAdmin } from "../supabase";
import {
  answerQuestion,
  type ScreeningAnswer,
  type ScreeningProfile,
} from "./screening";
import { fetchLatestVerification } from "../imap";

// --- Bindings confirmed from the live computer-use docs (claude-opus-4-8) ---
//   tool type:   "computer_20251124"
//   beta header: "computer-use-2025-11-24"
//   method:      client.beta.messages.create({ ..., betas: ["computer-use-2025-11-24"] })
const COMPUTER_USE_MODEL = "claude-opus-4-8";
const COMPUTER_USE_BETA = "computer-use-2025-11-24";
const COMPUTER_TOOL_TYPE = "computer_20251124";
const DISPLAY_WIDTH = 1280;
const DISPLAY_HEIGHT = 800;
const MAX_AGENT_ITERATIONS = 40;

export type ApplyOutcomeStatus = "applied" | "needs_manual" | "failed";

export interface ApplyResult {
  status: ApplyOutcomeStatus;
  reason?: string;
}

export interface ApplyInput {
  applicationId: string;
}

// ---------------------------------------------------------------------------
// Computer-use driver abstraction.
//
// The driver owns the sandboxed desktop: it renders screenshots and executes
// the mouse/keyboard actions Claude requests. `executeAction` receives the raw
// `input` object from a `computer` tool_use block and returns a tool_result
// content payload (a screenshot image, or text). Implementations also expose
// `screenshot()` for the kickoff and `currentText()` so the orchestrator can
// run CAPTCHA / verification heuristics on what's currently on screen.
// ---------------------------------------------------------------------------

/** An image payload returned to Claude as a tool_result. */
export interface DriverImage {
  type: "base64";
  media_type: "image/png" | "image/jpeg";
  data: string; // base64-encoded screenshot
}

export interface DriverActionResult {
  /** A screenshot to return to Claude (most actions return one). */
  image?: DriverImage;
  /** Optional text result (e.g. for read/extract-style actions). */
  text?: string;
  /** OCR/DOM text of the current screen, used by the orchestrator's heuristics. */
  visibleText?: string;
  /** Whether the action failed; surfaced as is_error in the tool_result. */
  isError?: boolean;
}

export interface ComputerUseDriver {
  /** Open the application URL and return the initial screen. */
  open(url: string): Promise<DriverActionResult>;
  /** Execute one `computer` tool action (click/type/key/screenshot/...). */
  executeAction(input: Record<string, unknown>): Promise<DriverActionResult>;
  /** Best-effort text of what is currently rendered (for detection heuristics). */
  currentText(): Promise<string>;
  /** Whether this driver is wired to a live sandbox. */
  isLive(): boolean;
  /** Release the sandbox. */
  close(): Promise<void>;
}

/**
 * Default driver used when no live computer-use sandbox is configured. It does
 * NOT pretend to act — every action is reported as an error, which makes the
 * confidence gate fail safe and route the application to needs_manual.
 *
 * TODO: replace with a live driver bound to a computer-use sandbox.
 */
export class UnconfiguredDriver implements ComputerUseDriver {
  async open(): Promise<DriverActionResult> {
    return { isError: true, text: "computer-use sandbox not configured" };
  }
  async executeAction(): Promise<DriverActionResult> {
    return { isError: true, text: "computer-use sandbox not configured" };
  }
  async currentText(): Promise<string> {
    return "";
  }
  isLive(): boolean {
    return false;
  }
  async close(): Promise<void> {
    /* nothing to release */
  }
}

export interface ApplyDeps {
  /** Override the computer-use driver (tests / live wiring). */
  driver?: ComputerUseDriver;
  /** Override the Anthropic client (tests). */
  anthropic?: Anthropic;
}

/**
 * Choose the computer-use driver. When `COMPUTER_USE_DRIVER === "playwright"`,
 * use the live Playwright/Chromium driver; otherwise keep the safe
 * `UnconfiguredDriver` so the gate fails safe and never claims "applied".
 *
 * The live driver is required lazily so the unconfigured path never loads the
 * `playwright` module (and its Chromium dependency).
 */
function selectDriver(): ComputerUseDriver {
  if (process.env.COMPUTER_USE_DRIVER === "playwright") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PlaywrightComputerUseDriver } =
      require("./playwright-driver") as typeof import("./playwright-driver");
    return new PlaywrightComputerUseDriver({
      width: DISPLAY_WIDTH,
      height: DISPLAY_HEIGHT,
    });
  }
  return new UnconfiguredDriver();
}

// ---------------------------------------------------------------------------
// Detection heuristics — real logic, deliberately conservative.
// ---------------------------------------------------------------------------

const LINKEDIN_HOST_RE = /(^|\.)linkedin\.com$/i;

/** True if the apply URL is on linkedin.com (never auto-submit there). */
export function isLinkedInUrl(applyUrl: string | null | undefined): boolean {
  if (!applyUrl) return false;
  try {
    return LINKEDIN_HOST_RE.test(new URL(applyUrl).hostname);
  } catch {
    return /(^|\/\/|\.)linkedin\.com/i.test(applyUrl);
  }
}

const CAPTCHA_MARKERS = [
  "captcha",
  "recaptcha",
  "hcaptcha",
  "i'm not a robot",
  "i am not a robot",
  "verify you are human",
  "are you human",
  "cloudflare",
  "challenge-form",
  "press and hold",
];

/** True if the visible text looks like a CAPTCHA / bot challenge. */
export function looksLikeCaptcha(visibleText: string | null | undefined): boolean {
  if (!visibleText) return false;
  const t = visibleText.toLowerCase();
  return CAPTCHA_MARKERS.some((m) => t.includes(m));
}

// ---------------------------------------------------------------------------
// Engine.
// ---------------------------------------------------------------------------

export async function applyToJob(
  input: ApplyInput,
  deps: ApplyDeps = {}
): Promise<ApplyResult> {
  const sb = supabaseAdmin();
  const { applicationId } = input;

  // 1. Load application + job + profile + screening bank.
  const { data: application, error: appErr } = await sb
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appErr || !application) {
    await writeRunLog(applicationId, "failed", "application_not_found");
    return { status: "failed", reason: "application_not_found" };
  }

  const { data: job } = await sb
    .from("jobs")
    .select("*")
    .eq("id", application.job_id)
    .single();

  const applyUrl: string | null = job?.apply_url ?? null;
  if (!applyUrl) {
    await transition(sb, applicationId, "needs_manual", "no_apply_url", null);
    return { status: "needs_manual", reason: "no_apply_url" };
  }

  // 2. LinkedIn → immediate needs_manual (Easy Apply auto-submit is banned).
  if (isLinkedInUrl(applyUrl)) {
    await transition(sb, applicationId, "needs_manual", "linkedin_no_autosubmit", applyUrl);
    return { status: "needs_manual", reason: "linkedin_no_autosubmit" };
  }

  // 3. Mark applying.
  await sb.from("applications").update({ status: "applying" }).eq("id", applicationId);

  const { data: profileRow } = await sb.from("profile").select("*").limit(1).single();
  const profile = toScreeningProfile(profileRow);

  const { data: screeningRows } = await sb.from("screening_answers").select("*");
  const screeningAnswers: ScreeningAnswer[] = (screeningRows ?? []).map((r) => ({
    question_key: String(r.question_key ?? ""),
    match_terms: Array.isArray(r.match_terms) ? r.match_terms.map(String) : [],
    answer: String(r.answer ?? ""),
  }));

  const driver = deps.driver ?? selectDriver();

  try {
    const result = await runComputerUseSession({
      applyUrl,
      application,
      profile,
      screeningAnswers,
      driver,
      anthropic: deps.anthropic,
    });

    if (result.status === "applied") {
      await sb
        .from("applications")
        .update({ status: "applied", applied_at: new Date().toISOString() })
        .eq("id", applicationId);
    } else {
      await transition(sb, applicationId, result.status, result.reason ?? null, applyUrl);
    }
    await writeRunLog(applicationId, result.status, result.reason);
    return result;
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown_error";
    await transition(sb, applicationId, "failed", reason, applyUrl);
    await writeRunLog(applicationId, "failed", reason);
    return { status: "failed", reason };
  } finally {
    await driver.close();
  }
}

interface SessionArgs {
  applyUrl: string;
  application: Record<string, unknown>;
  profile: ScreeningProfile;
  screeningAnswers: ScreeningAnswer[];
  driver: ComputerUseDriver;
  anthropic?: Anthropic;
}

/**
 * The agent loop: drive Claude's computer-use tool against the sandbox,
 * applying the confidence gate to every screen.
 */
async function runComputerUseSession(args: SessionArgs): Promise<ApplyResult> {
  const { applyUrl, application, profile, screeningAnswers, driver } = args;

  // Fail safe immediately if the sandbox isn't wired — never claim "applied".
  if (!driver.isLive()) {
    return { status: "needs_manual", reason: "computer_use_not_configured" };
  }

  const client =
    args.anthropic ?? new Anthropic({ apiKey: env.anthropicApiKey() });

  const tools = [
    {
      type: COMPUTER_TOOL_TYPE,
      name: "computer",
      display_width_px: DISPLAY_WIDTH,
      display_height_px: DISPLAY_HEIGHT,
      display_number: 1,
    },
  ];

  const system = buildSystemPrompt(application, profile, screeningAnswers);

  // Kickoff: open the URL and hand Claude the first screenshot.
  const opened = await driver.open(applyUrl);
  if (opened.isError) {
    return { status: "failed", reason: "could_not_open_apply_url" };
  }

  // CAPTCHA check on the very first screen.
  const firstText = opened.visibleText ?? (await driver.currentText());
  if (looksLikeCaptcha(firstText)) {
    return { status: "needs_manual", reason: "captcha_detected" };
  }

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text:
            `Apply to this job at ${applyUrl}. Fill every field from the candidate ` +
            `data in the system prompt. For each screening question, the system prompt ` +
            `lists the grounded answers you are permitted to give — if a question is not ` +
            `covered there, do NOT guess: reply with the text NEEDS_MANUAL:<question>. ` +
            `If you see a CAPTCHA or bot challenge, reply NEEDS_MANUAL:captcha. ` +
            `When the application is fully submitted, reply DONE:submitted.`,
        },
        ...(opened.image ? [imageBlock(opened.image)] : []),
      ],
    },
  ];

  for (let i = 0; i < MAX_AGENT_ITERATIONS; i++) {
    const response = await client.beta.messages.create({
      model: COMPUTER_USE_MODEL,
      max_tokens: 4096,
      system,
      tools: tools as unknown as Anthropic.Beta.BetaToolUnion[],
      messages,
      betas: [COMPUTER_USE_BETA],
    });

    messages.push({ role: "assistant", content: response.content });

    // Inspect any text Claude emitted for control signals / ungrounded answers.
    const gate = gateOnText(response.content, profile, screeningAnswers);
    if (gate) return gate;

    const toolUses = response.content.filter(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use"
    );

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      // Claude stopped without a DONE signal and without requesting a tool —
      // we can't confirm submission, so route to manual rather than assume.
      return { status: "needs_manual", reason: "unconfirmed_submission" };
    }

    // Execute each requested action and check the resulting screen.
    const toolResults: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const use of toolUses) {
      const exec = await driver.executeAction(
        (use.input ?? {}) as Record<string, unknown>
      );

      const screenText = exec.visibleText ?? (await driver.currentText());
      if (looksLikeCaptcha(screenText)) {
        return { status: "needs_manual", reason: "captcha_detected" };
      }

      // If the page requests an emailed code/link, supply it from IMAP.
      const verification = await maybeSupplyVerification(screenText, applyUrl);

      toolResults.push(
        buildToolResult(use.id, exec, verification)
      );
    }

    messages.push({ role: "user", content: toolResults });
  }

  // Ran out of iterations without a confirmed submission.
  return { status: "needs_manual", reason: "iteration_limit_reached" };
}

/**
 * Inspect Claude's text output for control signals and apply the confidence
 * gate: DONE:submitted → applied; NEEDS_MANUAL:* → needs_manual; an ungrounded
 * screening answer → needs_manual.
 */
function gateOnText(
  content: Anthropic.Beta.BetaContentBlock[],
  profile: ScreeningProfile,
  screeningAnswers: ScreeningAnswer[]
): ApplyResult | null {
  const texts = content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text);

  for (const text of texts) {
    const t = text.trim();

    if (/(^|\n)\s*DONE:submitted\b/i.test(t)) {
      return { status: "applied" };
    }

    const manual = t.match(/NEEDS_MANUAL:\s*(.+)/i);
    if (manual) {
      const detail = manual[1].trim();
      if (/^captcha\b/i.test(detail)) {
        return { status: "needs_manual", reason: "captcha_detected" };
      }
      // It's an ungrounded screening question — double-check the bank/profile
      // before trusting Claude's self-report, so we don't manual-route a
      // question we actually can answer.
      const { grounded } = answerQuestion(detail, profile, screeningAnswers);
      if (!grounded) {
        return { status: "needs_manual", reason: "ungrounded_question" };
      }
    }
  }
  return null;
}

interface SuppliedVerification {
  otp: string | null;
  link: string | null;
}

/**
 * If the current screen is asking for an email verification code/link, poll the
 * inbox and return what we found so it can be appended to the tool_result.
 */
async function maybeSupplyVerification(
  screenText: string,
  applyUrl: string
): Promise<SuppliedVerification | null> {
  const t = (screenText ?? "").toLowerCase();
  const asksForCode =
    /verification code|confirmation code|one-?time|enter the code|check your email|sent (?:you )?(?:a|an) (?:code|email)/.test(
      t
    );
  if (!asksForCode) return null;

  let allowedHosts: string[] | undefined;
  try {
    allowedHosts = [new URL(applyUrl).hostname];
  } catch {
    allowedHosts = undefined;
  }

  try {
    const v = await fetchLatestVerification({
      since: new Date(Date.now() - 10 * 60_000), // last 10 minutes
      allowedHosts,
      timeoutMs: 60_000,
    });
    if (!v) return null;
    return { otp: v.otp, link: v.link };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  application: Record<string, unknown>,
  profile: ScreeningProfile,
  screeningAnswers: ScreeningAnswer[]
): string {
  const answers = screeningAnswers
    .map((a) => `- (${a.question_key}) match: [${a.match_terms.join(", ")}] → ${a.answer}`)
    .join("\n");

  const coverLetter = application.cover_letter
    ? String(application.cover_letter)
    : "(none provided)";

  return [
    "You are an autonomous job-application agent operating a web browser via the computer tool.",
    "Fill the application accurately using ONLY the candidate data below. Never invent facts.",
    "",
    "Hard rules:",
    "- Never solve or bypass a CAPTCHA or bot challenge. If you see one, reply NEEDS_MANUAL:captcha and stop.",
    "- For any screening question not covered by the grounded answers below, reply NEEDS_MANUAL:<the question text> and stop. Do not guess.",
    "- Attach the tailored CV/cover documents when the form has an upload field (the harness has them staged).",
    "- After the form is fully submitted and you see a confirmation, reply DONE:submitted.",
    "",
    "Candidate profile:",
    `- Work authorization: ${profile.workAuthorization ?? "(unknown)"}`,
    `- Salary expectation: ${profile.salaryExpectation ?? "(unknown)"}`,
    `- Notice period: ${profile.noticePeriod ?? "(unknown)"}`,
    "",
    "Cover letter:",
    coverLetter,
    "",
    "Grounded screening answers (use these verbatim where the question matches):",
    answers || "(none)",
  ].join("\n");
}

function imageBlock(image: DriverImage): Anthropic.Beta.BetaImageBlockParam {
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: image.media_type,
      data: image.data,
    },
  };
}

function buildToolResult(
  toolUseId: string,
  exec: DriverActionResult,
  verification: SuppliedVerification | null
): Anthropic.Beta.BetaToolResultBlockParam {
  const content: Array<
    Anthropic.Beta.BetaTextBlockParam | Anthropic.Beta.BetaImageBlockParam
  > = [];

  if (exec.image) content.push(imageBlock(exec.image));
  if (exec.text) content.push({ type: "text", text: exec.text });

  if (verification && (verification.otp || verification.link)) {
    const parts: string[] = [];
    if (verification.otp) parts.push(`Email verification code: ${verification.otp}`);
    if (verification.link) parts.push(`Email verification link: ${verification.link}`);
    content.push({ type: "text", text: parts.join("\n") });
  }

  if (content.length === 0) {
    content.push({ type: "text", text: "(no output)" });
  }

  return {
    type: "tool_result",
    tool_use_id: toolUseId,
    content,
    is_error: exec.isError === true,
  };
}

function toScreeningProfile(row: Record<string, unknown> | null): ScreeningProfile {
  if (!row) return {};
  return {
    workAuthorization: stringOrNull(row.work_authorization),
    salaryExpectation: stringOrNull(row.salary_expectation),
    noticePeriod: stringOrNull(row.notice_period),
  };
}

function stringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

async function transition(
  sb: ReturnType<typeof supabaseAdmin>,
  applicationId: string,
  status: ApplyOutcomeStatus,
  reason: string | null,
  manualUrl: string | null
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (status === "needs_manual") {
    update.manual_reason = reason;
    update.manual_url = manualUrl;
  }
  await sb.from("applications").update(update).eq("id", applicationId);
}

async function writeRunLog(
  applicationId: string,
  status: string,
  reason?: string
): Promise<void> {
  try {
    await supabaseAdmin()
      .from("run_logs")
      .insert({
        stage: "apply",
        level: status === "failed" ? "error" : "info",
        message: status,
        payload: { applicationId, reason: reason ?? null },
      });
  } catch {
    // run_logs is best-effort telemetry; never fail the apply because of it.
  }
}
