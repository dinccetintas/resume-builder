import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PlaywrightComputerUseDriver,
  mapKey,
  type DriverPage,
  type LaunchedBrowser,
  type PlaywrightDriverDeps,
} from "./playwright-driver";

// A fake Playwright page that records calls — no real browser is launched.
function makeFakePage() {
  const calls: Array<{ target: string; method: string; args: unknown[] }> = [];
  const rec =
    (target: string, method: string) =>
    (...args: unknown[]): Promise<unknown> => {
      calls.push({ target, method, args });
      return Promise.resolve(undefined);
    };

  const page: DriverPage = {
    mouse: {
      move: rec("mouse", "move") as DriverPage["mouse"]["move"],
      click: rec("mouse", "click") as DriverPage["mouse"]["click"],
      dblclick: rec("mouse", "dblclick") as DriverPage["mouse"]["dblclick"],
      down: rec("mouse", "down") as DriverPage["mouse"]["down"],
      up: rec("mouse", "up") as DriverPage["mouse"]["up"],
      wheel: rec("mouse", "wheel") as DriverPage["mouse"]["wheel"],
    },
    keyboard: {
      type: rec("keyboard", "type") as DriverPage["keyboard"]["type"],
      press: rec("keyboard", "press") as DriverPage["keyboard"]["press"],
      down: rec("keyboard", "down") as DriverPage["keyboard"]["down"],
      up: rec("keyboard", "up") as DriverPage["keyboard"]["up"],
    },
    goto: rec("page", "goto") as DriverPage["goto"],
    screenshot: vi.fn(async () => Buffer.from("PNGDATA")),
    evaluate: vi.fn(async () => "Apply to this job") as unknown as DriverPage["evaluate"],
    setInputFiles: rec("page", "setInputFiles") as DriverPage["setInputFiles"],
  };

  return { page, calls };
}

function makeDriver(extra: Partial<PlaywrightDriverDeps> = {}) {
  const { page, calls } = makeFakePage();
  let closed = false;
  const launched: LaunchedBrowser = {
    page,
    close: async () => {
      closed = true;
    },
  };
  const driver = new PlaywrightComputerUseDriver({
    launch: async () => launched,
    width: 1280,
    height: 800,
    ...extra,
  });
  return { driver, page, calls, isClosed: () => closed };
}

describe("mapKey", () => {
  it("maps xdotool keys to Playwright key syntax", () => {
    expect(mapKey("Return")).toBe("Enter");
    expect(mapKey("Tab")).toBe("Tab");
    expect(mapKey("ctrl+a")).toBe("Control+a");
    expect(mapKey("shift+Tab")).toBe("Shift+Tab");
    expect(mapKey("super+l")).toBe("Meta+l");
    expect(mapKey("Escape")).toBe("Escape");
    expect(mapKey("Page_Down")).toBe("PageDown");
    expect(mapKey("f5")).toBe("F5");
    expect(mapKey("a")).toBe("a");
  });
});

describe("PlaywrightComputerUseDriver", () => {
  let env: ReturnType<typeof makeDriver>;
  beforeEach(() => {
    env = makeDriver();
  });

  it("is live", () => {
    expect(env.driver.isLive()).toBe(true);
  });

  it("open() navigates and returns a base64 PNG screenshot", async () => {
    const result = await env.driver.open("https://jobs.example.com/apply");
    expect(env.calls.find((c) => c.target === "page" && c.method === "goto")?.args[0]).toBe(
      "https://jobs.example.com/apply"
    );
    expect(result.isError).toBeUndefined();
    expect(result.image?.media_type).toBe("image/png");
    expect(result.image?.data).toBe(Buffer.from("PNGDATA").toString("base64"));
    expect(result.visibleText).toContain("Apply to this job");
  });

  it("left_click clicks at the given coordinate", async () => {
    await env.driver.executeAction({ action: "left_click", coordinate: [120, 240] });
    const click = env.calls.find((c) => c.target === "mouse" && c.method === "click");
    expect(click?.args.slice(0, 2)).toEqual([120, 240]);
    expect(click?.args[2]).toMatchObject({ button: "left" });
  });

  it("right_click and middle_click map to the right button", async () => {
    await env.driver.executeAction({ action: "right_click", coordinate: [10, 20] });
    await env.driver.executeAction({ action: "middle_click", coordinate: [30, 40] });
    const clicks = env.calls.filter((c) => c.target === "mouse" && c.method === "click");
    expect(clicks[0]?.args[2]).toMatchObject({ button: "right" });
    expect(clicks[1]?.args[2]).toMatchObject({ button: "middle" });
  });

  it("a click without coordinate reuses the last cursor position", async () => {
    await env.driver.executeAction({ action: "mouse_move", coordinate: [55, 66] });
    await env.driver.executeAction({ action: "left_click" });
    const click = env.calls.find((c) => c.target === "mouse" && c.method === "click");
    expect(click?.args.slice(0, 2)).toEqual([55, 66]);
  });

  it("double_click and triple_click", async () => {
    await env.driver.executeAction({ action: "double_click", coordinate: [5, 5] });
    await env.driver.executeAction({ action: "triple_click", coordinate: [7, 8] });
    expect(env.calls.find((c) => c.method === "dblclick")?.args.slice(0, 2)).toEqual([5, 5]);
    const triple = env.calls.filter((c) => c.method === "click").pop();
    expect(triple?.args.slice(0, 2)).toEqual([7, 8]);
    expect(triple?.args[2]).toMatchObject({ clickCount: 3 });
  });

  it("left_click_drag presses, moves, releases", async () => {
    await env.driver.executeAction({
      action: "left_click_drag",
      start_coordinate: [1, 2],
      coordinate: [3, 4],
    });
    const seq = env.calls.filter((c) => c.target === "mouse").map((c) => c.method);
    expect(seq).toEqual(["move", "down", "move", "up"]);
    const moves = env.calls.filter((c) => c.target === "mouse" && c.method === "move");
    expect(moves[0].args).toEqual([1, 2]);
    expect(moves[1].args).toEqual([3, 4]);
  });

  it("left_mouse_down / left_mouse_up", async () => {
    await env.driver.executeAction({ action: "left_mouse_down" });
    await env.driver.executeAction({ action: "left_mouse_up" });
    expect(env.calls.some((c) => c.target === "mouse" && c.method === "down")).toBe(true);
    expect(env.calls.some((c) => c.target === "mouse" && c.method === "up")).toBe(true);
  });

  it("type sends text to the keyboard", async () => {
    await env.driver.executeAction({ action: "type", text: "hello world" });
    const t = env.calls.find((c) => c.target === "keyboard" && c.method === "type");
    expect(t?.args[0]).toBe("hello world");
  });

  it("key maps xdotool chords and presses them", async () => {
    await env.driver.executeAction({ action: "key", text: "ctrl+a" });
    const press = env.calls.find((c) => c.target === "keyboard" && c.method === "press");
    expect(press?.args[0]).toBe("Control+a");
  });

  it("hold_key holds then releases the mapped key", async () => {
    await env.driver.executeAction({ action: "hold_key", text: "Return", duration: 0 });
    const down = env.calls.find((c) => c.target === "keyboard" && c.method === "down");
    const up = env.calls.find((c) => c.target === "keyboard" && c.method === "up");
    expect(down?.args[0]).toBe("Enter");
    expect(up?.args[0]).toBe("Enter");
  });

  it("scroll moves to the coordinate then wheels in the right direction", async () => {
    await env.driver.executeAction({
      action: "scroll",
      coordinate: [100, 100],
      scroll_direction: "down",
      scroll_amount: 3,
    });
    expect(env.calls.find((c) => c.target === "mouse" && c.method === "move")?.args).toEqual([100, 100]);
    const wheel = env.calls.find((c) => c.target === "mouse" && c.method === "wheel");
    expect(wheel?.args).toEqual([0, 300]);

    const up = makeDriver();
    await up.driver.executeAction({ action: "scroll", scroll_direction: "up", scroll_amount: 2 });
    expect(up.calls.find((c) => c.method === "wheel")?.args).toEqual([0, -200]);
  });

  it("screenshot action returns a fresh PNG without other ops", async () => {
    const result = await env.driver.executeAction({ action: "screenshot" });
    expect(result.image?.data).toBe(Buffer.from("PNGDATA").toString("base64"));
    expect(env.calls.some((c) => c.target === "mouse")).toBe(false);
  });

  it("cursor_position reports the tracked cursor as text", async () => {
    await env.driver.executeAction({ action: "mouse_move", coordinate: [42, 99] });
    const result = await env.driver.executeAction({ action: "cursor_position" });
    expect(result.text).toBe("(42, 99)");
  });

  it("wait does not error", async () => {
    const result = await env.driver.executeAction({ action: "wait", duration: 0 });
    expect(result.isError).toBeUndefined();
  });

  it("unknown action surfaces as an error result", async () => {
    const result = await env.driver.executeAction({ action: "teleport" });
    expect(result.isError).toBe(true);
    expect(result.text).toContain("teleport");
  });

  it("uploadCv downloads bytes and sets them on the file input", async () => {
    const downloadCvBytes = vi.fn(async () => Buffer.from("DOCXBYTES"));
    const tmpDir = `${require("node:os").tmpdir()}/cu-test-${Date.now()}`;
    const { driver, calls } = makeDriver({ downloadCvBytes, tmpDir });
    const result = await driver.uploadCv("app-123", "input[type=file]", "pdf");
    expect(downloadCvBytes).toHaveBeenCalledWith("applications/app-123.pdf");
    const setFiles = calls.find((c) => c.target === "page" && c.method === "setInputFiles");
    expect(setFiles?.args[0]).toBe("input[type=file]");
    expect(String(setFiles?.args[1])).toContain("app-123.pdf");
    expect(result.isError).toBeUndefined();
  });

  it("close releases the launched browser", async () => {
    await env.driver.open("https://example.com");
    await env.driver.close();
    expect(env.isClosed()).toBe(true);
  });
});
