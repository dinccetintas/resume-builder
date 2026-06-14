"use client";

// CRUD editor for the screening-answer bank. Each entry is a question_key, a
// set of match_terms (keyword tags used to fuzzy-match unseen questions) and a
// free-text answer. Persists via POST/PUT/DELETE on /api/screening-answers.
// Mirrors screeningAnswer*Schema (lib/profile-schema.ts).

import { useState } from "react";
import type { ScreeningAnswerRow } from "@/lib/ui-data";

type Status =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "error"; message: string };

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink shadow-sm transition-colors duration-150 placeholder:text-muted focus:border-accent focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-accent";

// Keyboard-usable tag input: type a term, press Enter or comma to add;
// Backspace on an empty field removes the last tag.
function TagInput({
  id,
  tags,
  onChange,
}: {
  id: string;
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(term: string) {
    const t = term.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
  }

  function remove(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
      setDraft("");
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      remove(tags.length - 1);
    }
  }

  return (
    <div
      className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white p-2 shadow-sm focus-within:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-accent"
    >
      <ul className="contents">
        {tags.map((tag, i) => (
          <li key={`${tag}-${i}`}>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink ring-1 ring-inset ring-slate-200">
              {tag}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${tag}`}
                className="rounded-full text-muted transition-colors duration-150 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </span>
          </li>
        ))}
      </ul>
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) {
            add(draft);
            setDraft("");
          }
        }}
        placeholder={tags.length === 0 ? "Add a keyword, press Enter" : ""}
        className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm text-ink placeholder:text-muted focus:outline-none"
      />
    </div>
  );
}

interface Draft {
  question_key: string;
  match_terms: string[];
  answer: string;
}

const EMPTY_DRAFT: Draft = { question_key: "", match_terms: [], answer: "" };

function AnswerForm({
  idPrefix,
  draft,
  setDraft,
  onSubmit,
  onCancel,
  submitLabel,
  busy,
}: {
  idPrefix: string;
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
  busy: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor={`${idPrefix}_key`}
          className="text-sm font-medium text-ink"
        >
          Question key
        </label>
        <input
          id={`${idPrefix}_key`}
          value={draft.question_key}
          onChange={(e) => setDraft({ ...draft, question_key: e.target.value })}
          placeholder="e.g. years_python"
          className={inputClass}
        />
        <p className="mt-0.5 text-xs text-muted">
          Lowercase letters, numbers and underscores.
        </p>
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}_terms`}
          className="text-sm font-medium text-ink"
        >
          Match terms
        </label>
        <TagInput
          id={`${idPrefix}_terms`}
          tags={draft.match_terms}
          onChange={(match_terms) => setDraft({ ...draft, match_terms })}
        />
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}_answer`}
          className="text-sm font-medium text-ink"
        >
          Answer
        </label>
        <textarea
          id={`${idPrefix}_answer`}
          rows={3}
          value={draft.answer}
          onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy}
          className="inline-flex items-center rounded-md bg-navy px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function ScreeningAnswersEditor({
  initialAnswers,
  configured,
}: {
  initialAnswers: ScreeningAnswerRow[];
  configured: boolean;
}) {
  const [answers, setAnswers] = useState<ScreeningAnswerRow[]>(initialAnswers);
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function describeError(res: Response, data: { configured?: boolean; error?: string }) {
    if (data?.configured === false) {
      return "Supabase is not configured, so changes were not saved.";
    }
    if (data?.error === "validation_error") {
      return "Invalid entry. Question key must be lowercase_with_underscores and the answer is required.";
    }
    return data?.error ? String(data.error) : `Request failed (${res.status}).`;
  }

  async function create() {
    setStatus({ kind: "busy" });
    try {
      const res = await fetch("/api/screening-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDraft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: "error", message: describeError(res, data) });
        return;
      }
      setAnswers((prev) => [...prev, data.answer as ScreeningAnswerRow]);
      setNewDraft(EMPTY_DRAFT);
      setStatus({ kind: "idle" });
    } catch {
      setStatus({ kind: "error", message: "Network error while saving." });
    }
  }

  async function update(id: string) {
    setStatus({ kind: "busy" });
    try {
      const res = await fetch("/api/screening-answers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editDraft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: "error", message: describeError(res, data) });
        return;
      }
      setAnswers((prev) =>
        prev.map((a) => (a.id === id ? (data.answer as ScreeningAnswerRow) : a)),
      );
      setEditingId(null);
      setStatus({ kind: "idle" });
    } catch {
      setStatus({ kind: "error", message: "Network error while saving." });
    }
  }

  async function remove(id: string) {
    setStatus({ kind: "busy" });
    try {
      const res = await fetch("/api/screening-answers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: "error", message: describeError(res, data) });
        return;
      }
      setAnswers((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) setEditingId(null);
      setStatus({ kind: "idle" });
    } catch {
      setStatus({ kind: "error", message: "Network error while deleting." });
    }
  }

  function startEdit(a: ScreeningAnswerRow) {
    setEditingId(a.id);
    setEditDraft({
      question_key: a.question_key,
      match_terms: [...a.match_terms],
      answer: a.answer,
    });
  }

  const busy = status.kind === "busy";

  return (
    <section
      aria-label="Screening answer bank"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="font-serif text-xl text-ink">Screening answer bank</h2>
      <p className="mt-1 text-sm text-muted">
        Reusable answers the apply worker fuzzy-matches to unseen screening
        questions.
      </p>

      {!configured ? (
        <div
          role="status"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <strong className="font-semibold">Supabase is not configured.</strong>{" "}
          Showing example answers. Changes will not be saved until persistence is
          enabled.
        </div>
      ) : null}

      {status.kind === "error" ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-700">
          {status.message}
        </p>
      ) : null}

      <ul className="mt-5 space-y-3">
        {answers.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-muted">
            No answers yet. Add your first below.
          </li>
        ) : null}
        {answers.map((a) => (
          <li
            key={a.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            {editingId === a.id ? (
              <AnswerForm
                idPrefix={`edit_${a.id}`}
                draft={editDraft}
                setDraft={setEditDraft}
                onSubmit={() => update(a.id)}
                onCancel={() => setEditingId(null)}
                submitLabel={busy ? "Saving…" : "Save changes"}
                busy={busy}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-ink">
                    {a.question_key}
                  </p>
                  {a.match_terms.length > 0 ? (
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {a.match_terms.map((t, i) => (
                        <li
                          key={`${t}-${i}`}
                          className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted ring-1 ring-inset ring-slate-200"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
                    {a.answer}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(a)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    disabled={busy}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-sm font-medium text-red-700 transition-colors duration-150 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-lg border border-slate-200 bg-surface/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">Add an answer</h3>
        <AnswerForm
          idPrefix="new"
          draft={newDraft}
          setDraft={setNewDraft}
          onSubmit={create}
          submitLabel={busy ? "Adding…" : "Add answer"}
          busy={busy}
        />
      </div>
    </section>
  );
}
