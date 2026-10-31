#!/usr/bin/env python3
"""Build a résumé into out/ as ATS-safe DOCX + PDF + Markdown.

Usage:
    python build_cv.py                               # default: Dinc Cetintas
    python build_cv.py candidates/jane_doe.py        # any candidate file
    python build_cv.py candidates/jane_doe.py --out some_dir

Each candidate file defines a module-level `RESUME` (a resume_builder.Resume).
Copy candidates/TEMPLATE.py to start a new person. See README.md / METHODOLOGY.md.
"""
from __future__ import annotations

import argparse
import importlib.util
import os
import sys

from resume_builder import Resume, build_all

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CANDIDATE = os.path.join(HERE, "candidates", "dinc_cetintas.py")


def load_resume(candidate_path: str) -> Resume:
    spec = importlib.util.spec_from_file_location("candidate", candidate_path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Cannot load candidate file: {candidate_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    resume = getattr(module, "RESUME", None)
    if not isinstance(resume, Resume):
        raise SystemExit(f"{candidate_path} must define a module-level RESUME (a Resume).")
    return resume


def main() -> None:
    parser = argparse.ArgumentParser(description="Build an ATS-safe résumé (DOCX + PDF + MD).")
    parser.add_argument("candidate", nargs="?", default=DEFAULT_CANDIDATE,
                        help="Path to a candidate .py file defining RESUME "
                             "(default: candidates/dinc_cetintas.py).")
    parser.add_argument("--out", default=os.path.join(HERE, "out"),
                        help="Output directory (default: ./out).")
    args = parser.parse_args()

    resume = load_resume(args.candidate)
    for p in build_all(resume, args.out):
        print(f"wrote {p}  ({os.path.getsize(p)} bytes)")


if __name__ == "__main__":
    main()
