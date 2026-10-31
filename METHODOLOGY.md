# Résumé Methodology — the playbook

This is the distilled method for turning a real career into a top-tier,
interview-proof résumé (written for AI/ML Engineering, but the principles
generalize). It is the "skills" half of this repo; [`INTAKE.md`](INTAKE.md) is
the interview that feeds it, and `candidates/dinc_cetintas.py` is a worked
example.

---

## 0. The non-negotiable rule: factual accuracy

**Never invent experience, metrics, titles, or capabilities.** The whole point
of a résumé is to survive a technical interview and a background check.
Fabricated specifics are exactly where candidates get caught.

Operating discipline used in this repo:

- **Confirm every claim** with the candidate before it goes in.
- **Mark proposed numbers** (`[v]`) when you suggest a figure the candidate
  hasn't given — they verify or correct each one before it's final.
- **Omit, don't guess.** If a capability/number can't be confirmed, leave it out.
- **Most-recent answer wins.** If the candidate narrows a claim later, respect
  the narrower version everywhere (and strip it from skills too).
- **Strong framing is fair game; false facts are not.** You can present real
  work in its most favorable, senior light — you cannot assert things that
  didn't happen.

---

## 1. Positioning — target the role, not the past

- Write for the role the candidate **wants**, not the one they held. Lead the
  header with that target title (e.g. "AI Engineer").
- **Functional titles are OK, flag them.** If the official title was "Data
  Scientist" but the work was AI engineering, you may show "AI Engineer" as a
  functional title — tell the candidate so they can defend/revert it.
- Decide what you are **not**: not a researcher, not a prompt-tinkerer, not
  "someone who calls an API." Every bullet should push toward the target.

---

## 2. The bullet formula

Every experience bullet answers: **why was it built → how was it architected →
who used it → what changed (measurably)?**

```
<ownership verb> <system> <for business problem>, <how / architecture>,
<scale / who used it>, <measurable outcome>.
```

- **Lead with ownership verbs:** Architected, Owned, Designed, Built, Deployed,
  Productionized, Scaled, Defined.
- **Each bullet carries ≥1 of:** scale, production complexity, architecture,
  reliability, latency, cost, business impact.
- Roots in the Google **XYZ** formula ("Accomplished X, measured by Y, by doing
  Z") — but pushed toward systems/production ownership.

---

## 3. Engineering judgment (what separates senior from keyword-stuffed)

A strong engineer doesn't care that you built RAG — everyone did. Show the
**decisions**:

- **Tradeoffs / "why":** *"Chose hybrid BM25+vector retrieval after semantic-only
  missed exact regulatory terms."* The *why* signals you understand systems.
- **Failure handling:** name a real failure you debugged and fixed (hallucinations,
  retrieval misses, latency, drift). Résumés that make AI look easy read as junior.
- **After deployment:** show monitoring + feedback loops + iteration, not just
  "build → deploy → success."
- **Causality on metrics:** *"cut latency ~40% **through** optimized retrieval and
  containerized serving"* — mechanism, not just the number.
- **Platform thinking:** back any "platform" claim with concrete reusable
  components (shared retrieval service, shared eval framework, common API).
- **Constraints as differentiators:** in regulated domains, lean into
  auditability, traceability, explainability, data residency, governance.

---

## 4. Modern-AI depth (include only what's true)

Signals that read as current AI-engineering practice — add the ones the
candidate actually used: RAG internals (hybrid retrieval, reranking, citation
grounding), **evaluation** (retrieval quality, grounding, hallucination rate,
human review loops), **structured outputs + schema validation**, **prompt
versioning**, **model routing / fallback strategies**, **context engineering**
(window budgeting, compaction), tool/function calling, agentic workflows,
observability & feedback loops.

Use "agentic" sparingly — once it's said, it's understood; repetition reads as
buzzword-stacking.

---

## 5. Scale & numbers

- Replace vague scope with real figures: "multiple teams" → "7+ business teams";
  "many users" → "200+ internal users".
- If scale isn't extraordinary, lean on the **differentiator** instead (e.g.
  *regulated* production AI) rather than inflating numbers.
- Every number must be defensible in an interview.

---

## 6. Structure that scans in 20 seconds

- **Profile:** 3–4 sentences — role, domain, end-to-end ownership, the single
  biggest differentiator.
- **Experience:** dense judgment bullets (see §2–3), most-relevant role first.
- **Selected AI Systems:** an optional one-line-per-product block — the fastest
  way to communicate "this person shipped multiple production systems."
- **Skills:** keyword-dense but grouped; drop anything not genuinely used.
- Keep it to ~2 pages; move product detail into Selected Systems to keep the
  experience section dense.

---

## 7. ATS-safe + premium rendering (how `render.py` does it)

- Single column, real text, standard fonts (Georgia/Calibri in DOCX;
  Times/Helvetica in PDF). **No tables, text boxes, or images** — they break ATS
  parsing.
- Serif name, letter-spaced navy section headers with rule lines, right-aligned
  role dates, clickable contact links (email/LinkedIn/GitHub).
- DOCX and PDF render from the same `Resume` so they never drift.

---

## 8. The recruiter checklist (quick self-audit)

Before calling a résumé done, check each bullet:

- [ ] Ownership verb up front?
- [ ] Why/architecture, not just "what"?
- [ ] A measurable outcome **with its mechanism**?
- [ ] At least one bullet showing a real failure debugged + fixed?
- [ ] After-deployment monitoring / iteration somewhere?
- [ ] Platform/leadership signal, if true?
- [ ] Regulated/domain constraints surfaced as differentiators?
- [ ] Every number and capability confirmed and defensible?
- [ ] No buzzword repeated past its first, earned mention?
- [ ] ~2 pages, scans in 20 seconds?

---

## 9. Executive / C-suite CVs (the `executive` theme)

Built for the İlkşen Çetintaş CHRO CV; the research behind each rule is in
[`docs/ilksen_cetintas/RESEARCH_AND_SCORECARD.md`](docs/ilksen_cetintas/RESEARCH_AND_SCORECARD.md).

- **Page 1, top third, sells in ~7 seconds** (Ladders eye-tracking): name,
  target title, a one-line positioning tagline, then a **key-numbers band**
  of 4 defensible figures. The current role must start on page 1.
- **Section order:** Executive Profile (≤5 lines) → Signature Achievements
  (5 bullets with bold lead-ins) → Awards & Recognition (on page 1: proof
  next to the claims) → Professional Experience → Core Competencies → Education → Additional Information.
- **Every employer gets a context line** (sector, scale, notable status:
  "11 factories, projects in 120+ countries; listed on Borsa İstanbul").
  Search partners read company calibre before role content.
- **Business language over HR process:** lead-ins name the outcome
  (*Workforce productivity*, *Reward architecture*), the bullet gives the
  mechanism.
- **Full chronology, condensed early career.** Exec search wants every role
  and explained gaps; keep strong early brands (TAI, Siemens) visible but
  short. Avoid stating "38 years" (age bias); let the brands carry tenure.
- **Award credibility ladder:** institutional awards (EBRD) outrank
  commercial event awards; name organisers exactly as they appear publicly.
- **Length:** 3 pages maximum; page 1 must stand alone.
- **Files:** `*.pdf` (master, no photo) for e-mail and international roles,
  `*_photo.pdf` for Türkiye/Gulf/DACH direct applications, `*.docx` for ATS
  portals (never the photo version), `*.txt` for paste-in forms.
- **Privacy:** this repo is public. Put phone, e-mail, photo and reference
  contacts in `candidates/private/` (git-ignored); `RESUME_PUBLIC=1` builds a
  redacted copy that is safe to commit.
