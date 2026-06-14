import { describe, expect, it } from "vitest";
import {
  profileSchema,
  screeningAnswerCreateSchema,
  screeningAnswerUpdateSchema,
  workAuthorizationSchema,
} from "./profile-schema";

describe("profileSchema", () => {
  const valid = {
    full_name: "Dinc Cetintas",
    email: "dinccetintas24@gmail.com",
    cv_json: { role: "AI Engineer", profile: "Builds AI platforms." },
  };

  it("accepts a minimal valid profile and applies defaults", () => {
    const parsed = profileSchema.parse(valid);
    expect(parsed.willing_to_relocate).toBe(true);
    expect(parsed.work_authorization).toEqual({});
    expect(parsed.eeo_defaults).toEqual({});
  });

  it("rejects a missing name", () => {
    const res = profileSchema.safeParse({ ...valid, full_name: "" });
    expect(res.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const res = profileSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(res.success).toBe(false);
  });

  it("preserves extra cv_json fields (passthrough)", () => {
    const parsed = profileSchema.parse({
      ...valid,
      cv_json: { role: "X", profile: "Y", experience: [{ title: "t" }] },
    });
    expect((parsed.cv_json as Record<string, unknown>).experience).toEqual([
      { title: "t" },
    ]);
  });
});

describe("workAuthorizationSchema", () => {
  it("accepts known country keys", () => {
    expect(
      workAuthorizationSchema.parse({ US: "Requires sponsorship", UK: "Citizen" }),
    ).toEqual({ US: "Requires sponsorship", UK: "Citizen" });
  });

  it("rejects unknown country keys", () => {
    expect(workAuthorizationSchema.safeParse({ FR: "x" }).success).toBe(false);
  });
});

describe("screeningAnswerCreateSchema", () => {
  it("accepts a valid entry", () => {
    const parsed = screeningAnswerCreateSchema.parse({
      question_key: "years_python",
      match_terms: ["python", "experience"],
      answer: "8 years.",
    });
    expect(parsed.match_terms).toEqual(["python", "experience"]);
  });

  it("defaults match_terms to an empty array", () => {
    const parsed = screeningAnswerCreateSchema.parse({
      question_key: "salary",
      answer: "Open.",
    });
    expect(parsed.match_terms).toEqual([]);
  });

  it("rejects an invalid question_key", () => {
    const res = screeningAnswerCreateSchema.safeParse({
      question_key: "Years Python!",
      answer: "x",
    });
    expect(res.success).toBe(false);
  });

  it("requires an id on update", () => {
    expect(
      screeningAnswerUpdateSchema.safeParse({
        question_key: "salary",
        answer: "x",
      }).success,
    ).toBe(false);
  });
});
