"""Reusable, ATS-safe résumé builder.

Separates CONTENT (a `Resume` object, one per candidate under `candidates/`)
from RENDERING (DOCX + PDF + Markdown). See README.md for usage and
METHODOLOGY.md / INTAKE.md for the writing playbook.
"""
from .schema import Job, Resume
from .render import build_all, build_docx, build_pdf, build_md

__all__ = ["Job", "Resume", "build_all", "build_docx", "build_pdf", "build_md"]
