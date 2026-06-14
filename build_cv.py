#!/usr/bin/env python3
"""Render Dinc Cetintas' confirmed AI Engineer CV to ATS-safe DOCX + PDF (+ Markdown).

The CV data and renderers now live in the reusable ``cv`` package so tailored
(per-job) variants can be rendered through the same code path. This script keeps
its original behaviour: build the default CV into ``out/``.
"""
from __future__ import annotations

import os

from cv import DEFAULT_CV, render_docx, render_md, render_pdf

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
BASENAME = "Dinc_Cetintas_AI_Engineer"


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    docx_path = os.path.join(OUT_DIR, BASENAME + ".docx")
    pdf_path = os.path.join(OUT_DIR, BASENAME + ".pdf")
    md_path = os.path.join(os.path.dirname(OUT_DIR), BASENAME + ".md")
    render_docx(DEFAULT_CV, docx_path)
    render_pdf(DEFAULT_CV, pdf_path)
    render_md(DEFAULT_CV, md_path)
    for p in (docx_path, pdf_path, md_path):
        print(f"wrote {p}  ({os.path.getsize(p)} bytes)")


if __name__ == "__main__":
    main()
