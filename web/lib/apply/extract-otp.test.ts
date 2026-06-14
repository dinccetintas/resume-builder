import { describe, it, expect } from "vitest";
import { extractOtp, extractVerificationLink } from "./extract-otp";

describe("extractOtp", () => {
  it("extracts a code from 'your code is 123456'", () => {
    expect(extractOtp("Your code is 123456")).toBe("123456");
  });

  it("extracts a code from 'verification code: 0492' preserving leading zero", () => {
    expect(extractOtp("Your verification code: 0492")).toBe("0492");
  });

  it("extracts a code introduced with 'is'", () => {
    expect(
      extractOtp("Hello, your one-time passcode is 842913. It expires soon.")
    ).toBe("842913");
  });

  it("extracts a 4-digit code", () => {
    expect(extractOtp("Confirmation code 7781")).toBe("7781");
  });

  it("extracts an 8-digit code", () => {
    expect(extractOtp("Security code: 12345678")).toBe("12345678");
  });

  it("handles 'code = 556677'", () => {
    expect(extractOtp("Enter this code = 556677 to continue")).toBe("556677");
  });

  it("handles number-first phrasing", () => {
    expect(extractOtp("999321 is your verification code")).toBe("999321");
  });

  it("handles 'enter 445566'", () => {
    expect(extractOtp("Please enter 445566 on the website.")).toBe("445566");
  });

  it("collapses a spaced-out code '1 2 3 4 5 6'", () => {
    expect(extractOtp("Your code is 1 2 3 4 5 6")).toBe("123456");
  });

  it("prefers the contextual code over an unrelated number", () => {
    const body =
      "Order #88213 confirmed. Your verification code is 246810. Total: $42.";
    expect(extractOtp(body)).toBe("246810");
  });

  it("returns null when no code is present", () => {
    expect(extractOtp("Thanks for signing up! Welcome aboard.")).toBeNull();
  });

  it("returns null for empty / nullish input", () => {
    expect(extractOtp("")).toBeNull();
    // @ts-expect-error testing defensive nullish handling
    expect(extractOtp(undefined)).toBeNull();
  });

  it("does not treat a 4-digit year as a code", () => {
    expect(extractOtp("Copyright 2026 Acme Corp. All rights reserved.")).toBeNull();
  });

  it("returns null when multiple bare numbers are ambiguous (no context)", () => {
    expect(
      extractOtp("Items: 1234 and 5678 and 9012 are in your cart.")
    ).toBeNull();
  });

  it("uses the single standalone number fallback", () => {
    expect(extractOtp("Use 135790 now.")).toBe("135790");
  });

  it("is case-insensitive on the keyword", () => {
    expect(extractOtp("YOUR VERIFICATION CODE IS 314159")).toBe("314159");
  });

  it("ignores 9+ digit runs (not a code)", () => {
    expect(extractOtp("Reference: 1234567890 (do not reply)")).toBeNull();
  });
});

describe("extractVerificationLink", () => {
  it("extracts a single link", () => {
    expect(
      extractVerificationLink("Click https://example.com/verify?token=abc to confirm")
    ).toBe("https://example.com/verify?token=abc");
  });

  it("strips trailing punctuation", () => {
    expect(
      extractVerificationLink("Confirm here: https://example.com/confirm/xyz.")
    ).toBe("https://example.com/confirm/xyz");
  });

  it("prefers a verify-style link over a plain one", () => {
    const body = `
      Unsubscribe: https://mail.example.com/unsub
      Verify your email: https://mail.example.com/verify/abc123
    `;
    expect(extractVerificationLink(body)).toBe(
      "https://mail.example.com/verify/abc123"
    );
  });

  it("filters by allowed hosts (subdomain match)", () => {
    const body = `
      Tracking: https://tracker.evil.com/x
      Confirm: https://auth.greenhouse.io/confirm/123
    `;
    expect(extractVerificationLink(body, ["greenhouse.io"])).toBe(
      "https://auth.greenhouse.io/confirm/123"
    );
  });

  it("returns null when no link matches the allowed hosts", () => {
    expect(
      extractVerificationLink("Visit https://spam.com/x", ["greenhouse.io"])
    ).toBeNull();
  });

  it("returns null when there are no links", () => {
    expect(extractVerificationLink("No links here.")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(extractVerificationLink("")).toBeNull();
  });

  it("matches an exact host", () => {
    expect(
      extractVerificationLink("Go to https://lever.co/activate/9", ["lever.co"])
    ).toBe("https://lever.co/activate/9");
  });

  it("skips malformed URLs", () => {
    expect(extractVerificationLink("htp:/broken and https://ok.com/verify")).toBe(
      "https://ok.com/verify"
    );
  });
});
