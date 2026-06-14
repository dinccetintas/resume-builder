# Automated Job-Application Pipeline

A self-hosted web app that continuously finds **high-value, career-boosting** AI/ML
roles across London / USA / Dubai / Qatar / Amsterdam, tailors a CV + cover letter per
role with an LLM, applies on company ATS pages with **computer use**, and tracks
everything — built on top of the existing ATS-safe CV renderer.

> Status: **Phase 1 foundation in progress.** The CV render engine, data schema,
> ranking, and discovery adapters are in place. The Next.js UI and computer-use apply
> worker are the next increments (see Roadmap).

## How it works

```
Next.js (Vercel)  ──►  Supabase (Postgres + Storage + Auth)
  discover  →  rank (high-value)  →  tailor (Anthropic)  →  render (Python)  →  apply (computer use)  →  track
```

- **Discover** — Adzuna (UK/US/NL) + Greenhouse/Lever/Ashby company boards + Gulf
  best-effort. LinkedIn is **discovery-only** (saved-search URLs); never auto-submit
  there (account-ban risk).
- **Rank** — scores seniority + company prestige + JD↔skills fit; a floor drops
  low-value roles so effort goes to career-boosting ones (`web/lib/rank.ts`).
- **Tailor** — Anthropic API produces a tailored CV (JSON) + cover letter, grounded in
  your profile. Default model `claude-sonnet-4-6` (≈ $0.03/job).
- **Render** — the tailored CV JSON is rendered to ATS-safe DOCX/PDF by the reused
  `cv` package, exposed as a Vercel Python function (`api/render.py`).
- **Apply** — Anthropic-hosted **computer use** drives the company ATS (vision, not
  brittle selectors): fills fields from your profile + screening-answer bank, attaches
  the tailored docs, answers novel questions, and submits. A **dedicated IMAP inbox**
  auto-enters email verification codes.
- **Track** — pipeline state + audit logs in Supabase; the UI shows a funnel and a
  `needs_manual` action queue.

### Honest automation limits (designed around, not ignored)

- **CAPTCHA** — Claude won't solve CAPTCHAs by policy. Many ATS don't gate the apply
  form with one; when hit, the job is parked `needs_manual` and a notification fires.
- **LinkedIn submit** — automating Easy Apply submission gets accounts banned, so we
  apply on the company's own site instead.

## Repo layout

```
cv/                     # reusable CV model + ATS-safe DOCX/PDF/MD renderers
  data.py               #   CVData dataclass + DEFAULT_CV (confirmed CV)
  render.py             #   render_docx / render_pdf / render_md
build_cv.py             # builds the default CV into out/ (uses the cv package)
api/render.py           # Vercel Python function: tailored CV JSON -> DOCX+PDF (base64)
supabase/migrations/    # Postgres schema (jobs, applications, profile, ...)
web/                    # Next.js app (Vercel) — UI + API routes + pipeline libs
  lib/types.ts          #   shared domain types
  lib/rank.ts           #   high-value ranking engine
  lib/discover/         #   Adzuna + Greenhouse/Lever/Ashby adapters
.env.example            # required secrets (copy to .env; never commit)
```

## Local setup

```bash
# 1. CV renderer (Python)
python3 -m pip install python-docx fpdf2
python3 build_cv.py            # regenerates out/*.docx, out/*.pdf

# 2. Secrets
cp .env.example .env           # fill in; ROTATE any key shared in chat

# 3. Database
#   Create a Supabase project, then apply supabase/migrations/0001_init.sql

# 4. Web app (after the Next.js scaffold lands — see Roadmap)
cd web && npm install && npm run dev
```

## Security

All secrets live in `.env` / Vercel env vars / Supabase Vault and are git-ignored.
The IMAP inbox uses a **dedicated address + app password**. If you ever paste a key in
chat or a PR, rotate it.

## Roadmap

- [x] Reusable CV render engine (tailored variants)
- [x] Supabase schema + secret hygiene
- [x] High-value ranking + discovery adapters (Adzuna / Greenhouse / Lever / Ashby)
- [ ] Tailoring step (Anthropic) + Vercel wiring of `api/render.py`
- [ ] Next.js UI (ui-ux-pro-max skill + 21st.dev Magic MCP): dashboard, job table,
      profile/answer-bank editor, `needs_manual` queue
- [ ] Computer-use apply worker + IMAP auto-verification + webhooks
- [ ] Gulf best-effort discovery, analytics, response tracking
```
