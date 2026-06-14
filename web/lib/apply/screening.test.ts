import { describe, it, expect } from "vitest";
import {
  answerQuestion,
  type ScreeningAnswer,
  type ScreeningProfile,
} from "./screening";

const PROFILE: ScreeningProfile = {
  workAuthorization: "Authorized to work in the UK without sponsorship",
  salaryExpectation: "£75,000",
  noticePeriod: "1 month",
};

const BANK: ScreeningAnswer[] = [
  {
    question_key: "years_experience",
    match_terms: ["years of experience", "how many years"],
    answer: "8",
  },
  {
    question_key: "relocate",
    match_terms: ["willing to relocate", "relocation"],
    answer: "Yes",
  },
  {
    question_key: "remote",
    match_terms: ["remote", "work from home"],
    answer: "Open to hybrid or remote",
  },
];

describe("answerQuestion — answer bank", () => {
  it("matches a banked question by a match term", () => {
    const r = answerQuestion("How many years of experience do you have?", PROFILE, BANK);
    expect(r).toEqual({ answer: "8", grounded: true });
  });

  it("is case-insensitive and whitespace-tolerant", () => {
    const r = answerQuestion("  Are you WILLING to RELOCATE  ?", PROFILE, BANK);
    expect(r).toEqual({ answer: "Yes", grounded: true });
  });

  it("prefers the entry that matches the most terms", () => {
    const bank: ScreeningAnswer[] = [
      { question_key: "generic", match_terms: ["work"], answer: "generic" },
      {
        question_key: "specific",
        match_terms: ["work from home", "work"],
        answer: "specific",
      },
    ];
    const r = answerQuestion("Are you able to work from home?", PROFILE, bank);
    expect(r).toEqual({ answer: "specific", grounded: true });
  });

  it("ignores bank entries with an empty answer", () => {
    const bank: ScreeningAnswer[] = [
      { question_key: "blank", match_terms: ["citizenship"], answer: "" },
    ];
    expect(answerQuestion("What is your citizenship?", PROFILE, bank)).toEqual({
      answer: null,
      grounded: false,
    });
  });
});

describe("answerQuestion — profile grounding", () => {
  it("grounds work authorization questions", () => {
    const r = answerQuestion("Are you authorized to work in the UK?", PROFILE, BANK);
    expect(r).toEqual({
      answer: "Authorized to work in the UK without sponsorship",
      grounded: true,
    });
  });

  it("grounds the British-spelling variant", () => {
    const r = answerQuestion("Are you authorised to work here?", PROFILE, BANK);
    expect(r.grounded).toBe(true);
  });

  it("grounds sponsorship questions", () => {
    const r = answerQuestion("Do you require visa sponsorship?", PROFILE, BANK);
    expect(r.grounded).toBe(true);
  });

  it("grounds salary expectation questions", () => {
    const r = answerQuestion("What is your salary expectation?", PROFILE, BANK);
    expect(r).toEqual({ answer: "£75,000", grounded: true });
  });

  it("grounds notice period questions", () => {
    const r = answerQuestion("What is your notice period?", PROFILE, BANK);
    expect(r).toEqual({ answer: "1 month", grounded: true });
  });

  it("grounds 'when can you start'", () => {
    const r = answerQuestion("When can you start?", PROFILE, BANK);
    expect(r).toEqual({ answer: "1 month", grounded: true });
  });
});

describe("answerQuestion — ungrounded → needs_manual", () => {
  it("returns ungrounded for an unknown question", () => {
    const r = answerQuestion(
      "Describe a time you handled a difficult stakeholder.",
      PROFILE,
      BANK
    );
    expect(r).toEqual({ answer: null, grounded: false });
  });

  it("returns ungrounded when the profile field is missing", () => {
    const r = answerQuestion(
      "What is your salary expectation?",
      { salaryExpectation: null },
      []
    );
    expect(r).toEqual({ answer: null, grounded: false });
  });

  it("returns ungrounded when the profile field is empty/whitespace", () => {
    const r = answerQuestion(
      "What is your notice period?",
      { noticePeriod: "   " },
      []
    );
    expect(r).toEqual({ answer: null, grounded: false });
  });

  it("returns ungrounded for empty/whitespace question", () => {
    expect(answerQuestion("", PROFILE, BANK)).toEqual({ answer: null, grounded: false });
    expect(answerQuestion("   ", PROFILE, BANK)).toEqual({ answer: null, grounded: false });
  });

  it("does not crash on a malformed bank and falls through to profile", () => {
    // @ts-expect-error testing defensive handling of bad rows
    const bank: ScreeningAnswer[] = [null, { match_terms: null }, undefined];
    const r = answerQuestion("Are you authorized to work in the UK?", PROFILE, bank);
    expect(r.grounded).toBe(true);
  });
});
