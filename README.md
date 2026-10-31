# Resume Builder

A small, reusable system for producing **world-class, ATS-safe résumés** as
**DOCX + PDF + Markdown** from a single source of truth per person.

It was built while crafting an elite AI-Engineer résumé, and it carries that
method with it. Two things live here:

1. **The tool** — content (one file per candidate) cleanly separated from the
   renderer, so you can produce the same caliber of CV for anyone.
2. **The playbook** — [`METHODOLOGY.md`](METHODOLOGY.md) (how to write the
   content) and [`INTAKE.md`](INTAKE.md) (the interview that gets the facts).

## Quick start

```bash
pip install -r requirements.txt

# Build the default candidate (Dinc Cetintas) -> out/
python build_cv.py

# Build any candidate
python build_cv.py candidates/dinc_cetintas.py
```

Outputs land in `out/<basename>.{docx,pdf,md}`.

## Make a résumé for a new person

```bash
cp candidates/TEMPLATE.py candidates/jane_doe.py
```

1. Run the interview in [`INTAKE.md`](INTAKE.md) with the candidate.
2. Fill `candidates/jane_doe.py` with **only confirmed facts** (see the
   anti-fabrication rule in [`METHODOLOGY.md`](METHODOLOGY.md)).
3. Build it:

```bash
python build_cv.py candidates/jane_doe.py
```

That's it — same premium layout, same ATS-safe output, a different person.

## Executive / C-suite CVs

Set `theme="executive"` in the candidate file (worked example:
`candidates/ilksen_cetintas.py`, a CHRO). You get a board-level layout —
key-numbers band, signature achievements, company context lines, awards,
competency grid, optional photo — with embedded Unicode fonts so Turkish
and other accented names render correctly:

```bash
python build_cv.py candidates/ilksen_cetintas.py --out out/private   # full, with private contact data
RESUME_PUBLIC=1 python build_cv.py candidates/ilksen_cetintas.py      # redacted, safe to commit
```

Outputs: `<basename>.pdf` (master), `<basename>_photo.pdf` (if a photo is
set), `.docx` (ATS upload), `.md`, `.txt` (paste-in forms). Private data
(phone, e-mail, photo, reference contacts) lives in the git-ignored
`candidates/private/`. Method: METHODOLOGY.md §9.

## Tests

```bash
python -m pytest -q
```

## How it's organized

```
build_cv.py                 CLI entrypoint (loads a candidate file, renders to out/)
requirements.txt
METHODOLOGY.md              The writing playbook (positioning, bullets, judgment, honesty)
INTAKE.md                   The candidate interview (the questions that produce the content)
resume_builder/
  schema.py                 Resume / Job data model (classic + executive fields)
  render.py                 classic DOCX + PDF + Markdown renderers; build_all dispatch
  executive_pdf.py          executive-theme PDF (embedded fonts, photo variant)
  executive_docx.py         executive-theme ATS-safe DOCX
  executive_text.py         executive-theme Markdown + plain text
  markup.py                 **bold** lead-in markup helpers
  fonts/                    Caladea + Carlito (SIL OFL) for Unicode PDFs
candidates/
  TEMPLATE.py               Blank, annotated starting point
  dinc_cetintas.py          A complete, worked example (the AI-Engineer CV)
  ilksen_cetintas.py        Executive example (CHRO CV, executive theme)
  private/                  git-ignored contact data / photos
docs/ilksen_cetintas/       research, persona reviews, scorecard, open questions
tests/                      pytest regression tests
out/                        Generated files
```

## Design notes

- **ATS-safe:** single column, real text, standard fonts, no tables / text
  boxes / images — so applicant tracking systems parse it as clean linear text.
- **Premium look:** serif name, letter-spaced navy section headers with rule
  lines, right-aligned role dates, clickable contact links. DOCX and PDF render
  from the same `Resume`, so they stay identical.
- **Sections auto-hide:** leave a list or string empty in the candidate file and
  that section is skipped.

## Verify a build (optional)

```python
from pypdf import PdfReader
r = PdfReader("out/Dinc_Cetintas_AI_Engineer.pdf")
print(len(r.pages), "pages")
```
