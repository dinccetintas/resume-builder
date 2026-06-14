// Screening-question answering.
//
// Job applications often interpose free-text or multiple-choice "screening"
// questions ("Are you authorized to work in the UK?", "What is your salary
// expectation?"). The apply engine must answer these to submit hands-off, but
// it must NEVER fabricate an answer it cannot ground in known data — an
// ungrounded answer routes the whole application to `needs_manual`.
//
// This module is pure (no I/O): given the question text plus the profile and a
// bank of curated screening answers, it returns either a grounded answer or
// {answer: null, grounded: false}.

/**
 * A row from the `screening_answers` table. `match_terms` are lowercased
 * substrings/keywords; if the question contains one, this answer applies.
 */
export interface ScreeningAnswer {
  question_key: string;
  match_terms: string[];
  answer: string;
}

/**
 * The subset of the profile this module grounds answers against. Mirrors the
 * `profile` table columns the engine loads.
 */
export interface ScreeningProfile {
  workAuthorization?: string | null;
  salaryExpectation?: string | null;
  noticePeriod?: string | null;
}

export interface AnswerResult {
  answer: string | null;
  /** True only when `answer` is sourced from the bank or profile. */
  grounded: boolean;
}

const UNGROUNDED: AnswerResult = { answer: null, grounded: false };

// Keyword groups for grounding directly against profile scalar fields. These
// are intentionally conservative: a question must clearly be about the topic.
const WORK_AUTH_TERMS = [
  "authorized to work",
  "authorised to work",
  "work authorization",
  "work authorisation",
  "right to work",
  "legally able to work",
  "eligible to work",
  "require sponsorship",
  "need sponsorship",
  "visa sponsorship",
  "work permit",
  "work visa",
];

const SALARY_TERMS = [
  "salary expectation",
  "salary expectations",
  "expected salary",
  "desired salary",
  "compensation expectation",
  "expected compensation",
  "salary requirement",
  "desired compensation",
];

const NOTICE_TERMS = [
  "notice period",
  "notice required",
  "when can you start",
  "start date",
  "available to start",
  "availability to start",
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesAny(haystack: string, terms: string[]): boolean {
  return terms.some((t) => haystack.includes(t));
}

/**
 * Answer a single screening question.
 *
 * Resolution order:
 *  1. The curated answer bank, matched by `match_terms` (most specific wins —
 *     the answer with the most matched terms is preferred).
 *  2. Profile scalar fields (work authorization, salary, notice period), when
 *     the question clearly asks about one of them and the field is populated.
 *
 * If neither grounds an answer, returns {answer: null, grounded: false} and the
 * caller routes the application to `needs_manual` rather than guessing.
 */
export function answerQuestion(
  question: string,
  profile: ScreeningProfile,
  screeningAnswers: ScreeningAnswer[]
): AnswerResult {
  if (!question || !question.trim()) return UNGROUNDED;

  const q = normalize(question);

  // 1. Curated answer bank — pick the entry with the most matched terms so
  //    that a more specific question key wins over a generic one.
  let best: { answer: ScreeningAnswer; score: number } | null = null;
  for (const entry of screeningAnswers ?? []) {
    if (!entry || !Array.isArray(entry.match_terms)) continue;
    const matched = entry.match_terms.filter(
      (term) => term && q.includes(normalize(term))
    ).length;
    if (matched > 0 && (best === null || matched > best.score)) {
      best = { answer: entry, score: matched };
    }
  }
  if (best && best.answer.answer != null && best.answer.answer !== "") {
    return { answer: best.answer.answer, grounded: true };
  }

  // 2. Profile scalar fields.
  if (matchesAny(q, WORK_AUTH_TERMS) && grounded(profile.workAuthorization)) {
    return { answer: profile.workAuthorization as string, grounded: true };
  }
  if (matchesAny(q, SALARY_TERMS) && grounded(profile.salaryExpectation)) {
    return { answer: profile.salaryExpectation as string, grounded: true };
  }
  if (matchesAny(q, NOTICE_TERMS) && grounded(profile.noticePeriod)) {
    return { answer: profile.noticePeriod as string, grounded: true };
  }

  return UNGROUNDED;
}

function grounded(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}
