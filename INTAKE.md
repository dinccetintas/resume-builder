# Candidate Intake — the interview

Run this before writing a candidate file. The goal is to collect **confirmed
facts** so the résumé survives a technical interview. Pair it with
[`METHODOLOGY.md`](METHODOLOGY.md); fill the answers into a copy of
`candidates/TEMPLATE.py`.

Golden rule: **if the candidate can't confirm it, it doesn't go in.** Where you
propose a number, mark it and have them verify before it's final.

---

## A. Target & basics

1. **Target role?** (AI Engineer / Applied AI / GenAI / MLOps / Data Scientist / …)
   The résumé is written toward this, not the last title held.
2. Optional: seniority, country/location, industry, company type.
3. Contact: location line, email, phone, LinkedIn URL, GitHub URL.
   (Drop anything they don't want shown — e.g. visa status.)
4. Any title you should present **functionally** (official vs. what the work
   actually was)? Flag these so they can defend them.

## B. Per role (repeat for each job)

For each role, get the real story behind each major piece of work:

5. What did you **actually build/own** here? (platform vs. feature vs. strategy —
   be precise; the one incoherent bullet is where recruiters probe.)
6. For each system: **why** that design? what did you try first that failed?
7. **Scale:** how many users / teams / requests / documents / $ ? (real numbers)
8. **A real failure** you debugged and fixed in production — and how you detected
   it and what you changed afterward (monitoring, gates, feedback).
9. **Mechanism behind each metric:** "reduced X by N%" — *through what*?
10. Stakeholders you worked with / standards you set (leadership signals, scoped
    honestly: your systems vs. org-wide).

## C. Capability confirmation (check the box only if genuinely true)

Ask explicitly — these are claim/no-claim decisions, and unselected ⇒ omitted:

- [ ] RAG internals you built (hybrid retrieval, chunking, reranking, grounding)
- [ ] Evaluation pipelines you ran (retrieval quality, grounding, hallucination)
      and whether releases were gated on them
- [ ] Agentic / tool-calling workflows you built
- [ ] Observability / monitoring / guardrails / caching / model routing — which
      specifically did you own? (list only the real ones)
- [ ] Structured outputs + schema validation
- [ ] Prompt versioning
- [ ] Model routing / fallback strategies
- [ ] Context engineering (window budgeting, compaction)
- [ ] Reusable platform components others consumed (shared retrieval service,
      shared eval framework, common API/serving layer)

## D. Supporting sections

11. Education (degrees, schools, dates; note exchange semesters honestly).
12. Certifications / courses — order most role-relevant first.
13. Languages / anything else.

## E. Numbers to verify (the `[v]` list)

List every figure you proposed that the candidate hasn't explicitly given, and
confirm each one before finalizing. Keep only what they can defend.

---

### Turning answers into the file

- One `Job` per role; each bullet follows the formula in METHODOLOGY §2–3.
- Put the standout products into `selected_systems`.
- Skills: group and keyword-dense, but only techniques from section C that were
  confirmed.
- Set `basename` to `First_Last_TargetRole`.
