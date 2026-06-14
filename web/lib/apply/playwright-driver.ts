// Live computer-use driver backed by Playwright/Chromium.
//
// Implements the `ComputerUseDriver` interface from engine.ts by translating
// the `computer_20251124` tool action set into Playwright page/mouse/keyboard
// operations, returning a fresh base64 PNG screenshot after each action.
//
// The Chromium binary cannot be downloaded in this sandbox, so the browser is
// behind an injectable launcher (`PlaywrightDriverDeps.launch`) — the unit test
// injects a fake page/context and asserts the action -> Playwright mapping
// without ever launching a real browser.
//
// Action set + coordinate semantics confirmed from the live computer-use docs
// and the anthropic-quickstarts computer-use-demo:
//   - coordinate is [x, y] in pixels from the TOP-LEFT origin.
//   - click actions (left/right/middle/double/triple) take an OPTIONAL coordinate
//     (move there first, then click in place if omitted).
//   - mouse_move / left_click_drag REQUIRE coordinate(s).
//   - type/key take `text`; key uses xdotool key syntax ("Return", "Tab",
//     "ctrl+a") which we map to Playwright's key syntax.
//   - scroll takes coordinate + scroll_direction + scroll_amount.
//   - hold_key takes text + duration (seconds); wait takes duration (seconds).
//   - left_mouse_down / left_mouse_up take no coordinate.

import type { Browser, BrowserContext, Page } from "playwright";
import { supabaseAdmin } from "../supabase";
import type {
  ComputerUseDriver,
  DriverActionResult,
  DriverImage,
} from "./engine";

// Storage layout for the tailored CV docs (mirrors lib/pipeline.ts).
const STORAGE_BUCKET = "cv-docs";

// Display size advertised to the model by the engine.
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;

/**
 * The minimal Playwright surface the driver actually uses. Declaring it
 * explicitly (rather than depending on the concrete classes) lets the unit
 * test inject a fake without a real browser, while staying assignable from a
 * real Playwright `Page`.
 */
export interface DriverMouse {
  move(x: number, y: number): Promise<void>;
  click(x: number, y: number, options?: { button?: "left" | "right" | "middle"; clickCount?: number }): Promise<void>;
  dblclick(x: number, y: number, options?: { button?: "left" | "right" | "middle" }): Promise<void>;
  down(options?: { button?: "left" | "right" | "middle" }): Promise<void>;
  up(options?: { button?: "left" | "right" | "middle" }): Promise<void>;
  wheel(deltaX: number, deltaY: number): Promise<void>;
}

export interface DriverKeyboard {
  type(text: string, options?: { delay?: number }): Promise<void>;
  press(key: string): Promise<void>;
  down(key: string): Promise<void>;
  up(key: string): Promise<void>;
}

/** The subset of Playwright's `Page` the driver relies on. */
export interface DriverPage {
  readonly mouse: DriverMouse;
  readonly keyboard: DriverKeyboard;
  goto(url: string, options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit"; timeout?: number }): Promise<unknown>;
  screenshot(options?: { type?: "png" | "jpeg" }): Promise<Buffer>;
  evaluate<R>(fn: () => R): Promise<R>;
  setInputFiles(selector: string, files: string | readonly string[]): Promise<void>;
}

export interface LaunchedBrowser {
  page: DriverPage;
  /** Release everything (context + browser). Best-effort. */
  close(): Promise<void>;
}

export interface PlaywrightDriverDeps {
  /** Launch (or fake) a browser and return a ready page. */
  launch?: (opts: { width: number; height: number; userDataDir: string }) => Promise<LaunchedBrowser>;
  /** Override how tailored CV bytes are fetched (tests). */
  downloadCvBytes?: (path: string) => Promise<Buffer>;
  /** Override the temp dir used to stage the uploaded CV (tests). */
  tmpDir?: string;
  width?: number;
  height?: number;
  userDataDir?: string;
}

// ---------------------------------------------------------------------------
// Key mapping: xdotool key syntax (as the model emits for `key`/`hold_key`)
// -> Playwright key syntax.
// ---------------------------------------------------------------------------

const XDOTOOL_KEY_MAP: Record<string, string> = {
  return: "Enter",
  kp_enter: "Enter",
  enter: "Enter",
  tab: "Tab",
  escape: "Escape",
  esc: "Escape",
  backspace: "Backspace",
  delete: "Delete",
  space: "Space",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  page_up: "PageUp",
  prior: "PageUp",
  page_down: "PageDown",
  next: "PageDown",
  home: "Home",
  end: "End",
  ctrl: "Control",
  control: "Control",
  alt: "Alt",
  super: "Meta",
  meta: "Meta",
  cmd: "Meta",
  command: "Meta",
  shift: "Shift",
};

/** Map a single xdotool key token to Playwright's key name. */
function mapKeyToken(token: string): string {
  const lower = token.toLowerCase();
  if (XDOTOOL_KEY_MAP[lower]) return XDOTOOL_KEY_MAP[lower];
  // Function keys: f1..f24 -> F1..F24
  const fn = /^f(\d{1,2})$/.exec(lower);
  if (fn) return `F${fn[1]}`;
  // Single visible char: pass through as-is (Playwright accepts "a", "A", "1").
  if (token.length === 1) return token;
  // Fallback: capitalize first letter (e.g. "delete" already handled above).
  return token.charAt(0).toUpperCase() + token.slice(1);
}

/**
 * Map an xdotool key chord ("ctrl+a", "Return", "shift+Tab") to a Playwright
 * `keyboard.press()` argument ("Control+a", "Enter", "Shift+Tab").
 */
export function mapKey(xdotoolKey: string): string {
  return xdotoolKey
    .split("+")
    .map((t) => mapKeyToken(t.trim()))
    .join("+");
}

// ---------------------------------------------------------------------------
// Driver.
// ---------------------------------------------------------------------------

function coordOf(input: Record<string, unknown>, field = "coordinate"): [number, number] | null {
  const v = input[field];
  if (Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number") {
    return [v[0], v[1]];
  }
  return null;
}

function buttonFromAction(action: string): "left" | "right" | "middle" {
  if (action === "right_click") return "right";
  if (action === "middle_click") return "middle";
  return "left";
}

export class PlaywrightComputerUseDriver implements ComputerUseDriver {
  private page: DriverPage | null = null;
  private launched: LaunchedBrowser | null = null;
  private readonly width: number;
  private readonly height: number;
  private readonly userDataDir: string;
  private readonly deps: PlaywrightDriverDeps;
  private cursor: [number, number] = [0, 0];

  constructor(deps: PlaywrightDriverDeps = {}) {
    this.deps = deps;
    this.width = deps.width ?? DEFAULT_WIDTH;
    this.height = deps.height ?? DEFAULT_HEIGHT;
    this.userDataDir =
      deps.userDataDir ??
      process.env.COMPUTER_USE_USER_DATA_DIR ??
      `${osTmpDir()}/resume-builder-cu-profile`;
  }

  isLive(): boolean {
    return true;
  }

  /** Lazily launch the browser; injected fake in tests, real Chromium otherwise. */
  private async ensurePage(): Promise<DriverPage> {
    if (this.page) return this.page;
    const launch = this.deps.launch ?? defaultLaunch;
    this.launched = await launch({
      width: this.width,
      height: this.height,
      userDataDir: this.userDataDir,
    });
    this.page = this.launched.page;
    return this.page;
  }

  async open(url: string): Promise<DriverActionResult> {
    try {
      const page = await this.ensurePage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const image = await this.capture(page);
      return { image, visibleText: await this.readText(page) };
    } catch (err) {
      return { isError: true, text: errMsg(err) };
    }
  }

  async executeAction(input: Record<string, unknown>): Promise<DriverActionResult> {
    try {
      const page = await this.ensurePage();
      const action = String(input.action ?? "");
      const text = await this.dispatch(page, action, input);
      const image = await this.capture(page);
      const visibleText = await this.readText(page);
      return text === undefined ? { image, visibleText } : { image, text, visibleText };
    } catch (err) {
      return { isError: true, text: errMsg(err) };
    }
  }

  /** Execute one action; returns optional text payload (e.g. for cursor_position). */
  private async dispatch(
    page: DriverPage,
    action: string,
    input: Record<string, unknown>
  ): Promise<string | undefined> {
    switch (action) {
      case "screenshot":
        return undefined; // screenshot taken by the caller after dispatch.

      case "cursor_position":
        return `(${this.cursor[0]}, ${this.cursor[1]})`;

      case "mouse_move": {
        const c = requireCoord(input);
        await page.mouse.move(c[0], c[1]);
        this.cursor = c;
        return undefined;
      }

      case "left_click":
      case "right_click":
      case "middle_click": {
        const button = buttonFromAction(action);
        const c = coordOf(input);
        if (c) this.cursor = c;
        const [x, y] = this.cursor;
        await page.mouse.click(x, y, { button });
        return undefined;
      }

      case "double_click": {
        const c = coordOf(input);
        if (c) this.cursor = c;
        await page.mouse.dblclick(this.cursor[0], this.cursor[1]);
        return undefined;
      }

      case "triple_click": {
        const c = coordOf(input);
        if (c) this.cursor = c;
        const [x, y] = this.cursor;
        await page.mouse.click(x, y, { clickCount: 3 });
        return undefined;
      }

      case "left_click_drag": {
        const start = coordOf(input, "start_coordinate") ?? this.cursor;
        const end = requireCoord(input);
        await page.mouse.move(start[0], start[1]);
        await page.mouse.down();
        await page.mouse.move(end[0], end[1]);
        await page.mouse.up();
        this.cursor = end;
        return undefined;
      }

      case "left_mouse_down":
        await page.mouse.down();
        return undefined;

      case "left_mouse_up":
        await page.mouse.up();
        return undefined;

      case "type": {
        const t = String(input.text ?? "");
        await page.keyboard.type(t, { delay: 12 });
        return undefined;
      }

      case "key": {
        const t = String(input.text ?? "");
        await page.keyboard.press(mapKey(t));
        return undefined;
      }

      case "hold_key": {
        const t = String(input.text ?? "");
        const duration = Number(input.duration ?? 0);
        const key = mapKey(t);
        await page.keyboard.down(key);
        await sleep(duration * 1000);
        await page.keyboard.up(key);
        return undefined;
      }

      case "scroll": {
        const c = coordOf(input);
        if (c) {
          await page.mouse.move(c[0], c[1]);
          this.cursor = c;
        }
        const direction = String(input.scroll_direction ?? "down");
        const amount = Number(input.scroll_amount ?? 3);
        const step = amount * 100; // ~100px per scroll "click".
        let dx = 0;
        let dy = 0;
        if (direction === "down") dy = step;
        else if (direction === "up") dy = -step;
        else if (direction === "right") dx = step;
        else if (direction === "left") dx = -step;
        await page.mouse.wheel(dx, dy);
        return undefined;
      }

      case "wait": {
        const duration = Number(input.duration ?? 0);
        await sleep(duration * 1000);
        return undefined;
      }

      default:
        throw new Error(`unsupported computer action: ${action || "(missing)"}`);
    }
  }

  /**
   * Upload the tailored CV (downloaded from Supabase Storage) into a file input.
   * Added as a backward-compatible method the engine can call where a form has
   * an attachment field; not part of the model's `computer` action set.
   */
  async uploadCv(applicationId: string, selector: string, kind: "docx" | "pdf" = "pdf"): Promise<DriverActionResult> {
    try {
      const page = await this.ensurePage();
      const storagePath = `applications/${applicationId}.${kind}`;
      const bytes = await (this.deps.downloadCvBytes ?? defaultDownloadCvBytes)(storagePath);
      const tmpPath = await writeTempFile(this.deps.tmpDir ?? osTmpDir(), `${applicationId}.${kind}`, bytes);
      await page.setInputFiles(selector, tmpPath);
      const image = await this.capture(page);
      return { image, visibleText: await this.readText(page) };
    } catch (err) {
      return { isError: true, text: errMsg(err) };
    }
  }

  async currentText(): Promise<string> {
    if (!this.page) return "";
    return this.readText(this.page);
  }

  private async capture(page: DriverPage): Promise<DriverImage> {
    const buf = await page.screenshot({ type: "png" });
    return { type: "base64", media_type: "image/png", data: buf.toString("base64") };
  }

  private async readText(page: DriverPage): Promise<string> {
    try {
      return await page.evaluate(() => (document.body?.innerText ?? "").slice(0, 20_000));
    } catch {
      return "";
    }
  }

  async close(): Promise<void> {
    try {
      await this.launched?.close();
    } catch {
      /* best-effort */
    } finally {
      this.launched = null;
      this.page = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Defaults (real implementations) — not exercised by the unit test.
// ---------------------------------------------------------------------------

function requireCoord(input: Record<string, unknown>): [number, number] {
  const c = coordOf(input);
  if (!c) throw new Error("action requires a coordinate");
  return c;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : "unknown_error";
}

function sleep(ms: number): Promise<void> {
  if (!(ms > 0)) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function osTmpDir(): string {
  // Lazy require to avoid pulling node:os into the type surface unnecessarily.
  return require("node:os").tmpdir();
}

async function writeTempFile(dir: string, name: string, bytes: Buffer): Promise<string> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  await fs.mkdir(dir, { recursive: true });
  const full = path.join(dir, name);
  await fs.writeFile(full, bytes);
  return full;
}

async function defaultDownloadCvBytes(storagePath: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin().storage.from(STORAGE_BUCKET).download(storagePath);
  if (error || !data) throw new Error(`cv download failed: ${error?.message ?? "no data"}`);
  const arrayBuf = await data.arrayBuffer();
  return Buffer.from(arrayBuf);
}

/** Launch a real persistent Chromium context at the advertised display size. */
async function defaultLaunch(opts: {
  width: number;
  height: number;
  userDataDir: string;
}): Promise<LaunchedBrowser> {
  const { chromium } = await import("playwright");
  const context: BrowserContext = await chromium.launchPersistentContext(opts.userDataDir, {
    headless: process.env.COMPUTER_USE_HEADLESS !== "false",
    viewport: { width: opts.width, height: opts.height },
  });
  const pages = context.pages();
  const page: Page = pages.length > 0 ? pages[0] : await context.newPage();
  const browser: Browser | null = context.browser();
  return {
    page: page as unknown as DriverPage,
    close: async () => {
      await context.close();
      await browser?.close();
    },
  };
}
