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

## How it's organized

```
build_cv.py                 CLI entrypoint (loads a candidate file, renders to out/)
requirements.txt
METHODOLOGY.md              The writing playbook (positioning, bullets, judgment, honesty)
INTAKE.md                   The candidate interview (the questions that produce the content)
resume_builder/
  schema.py                 Resume / Job data model
  render.py                 DOCX + PDF + Markdown renderers (one Resume -> all formats)
candidates/
  TEMPLATE.py               Blank, annotated starting point
  dinc_cetintas.py          A complete, worked example (the AI-Engineer CV)
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
