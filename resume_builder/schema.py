"""Data model for a résumé. One `Resume` per candidate; the renderer turns it
into DOCX + PDF + Markdown (+ plain text for the executive theme). Keep every
field factual and candidate-confirmed (see METHODOLOGY.md — the
anti-fabrication rule).

Two themes share this model:
  * "classic"   — the original single-column technical CV (see render.py).
  * "executive" — a board-level layout with a key-numbers strip, signature
    achievements, awards, company context lines, competency grid and an
    optional photo (see executive_pdf.py / executive_docx.py).
Fields that a theme does not use are simply ignored; empty fields are skipped.

Inline markup: in bullets, highlights, awards and profile text, `**bold**`
marks a lead-in phrase. The executive renderers turn it into real bold; the
classic renderers leave text untouched (it has no markup).
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Job:
    """One role in the experience section.

    Classic theme: `title` carries "Role — Company, City".
    Executive theme: `title` is the role only; `company`, `location` and the
    one-line `context` (sector, scale, mandate) are rendered separately.
    """
    title: str          # e.g. "AI Engineer — Commercial Bank of Qatar, Doha"
    dates: str          # e.g. "Jan 2024 – Present"
    bullets: list[str]  # each: business problem -> architecture -> impact -> metric
    company: str = ""   # executive theme: employer name
    location: str = ""  # executive theme: "Ankara, Türkiye"
    context: str = ""   # executive theme: one-line company/mandate descriptor


@dataclass
class Resume:
    """A complete résumé. Lists left empty are skipped in the output.

    contact_segments: ordered (text, url_or_None) pairs rendered on one
      line; entries with a url become clickable links (use "mailto:" for email).
    education / skills / selected_systems: (left, right) string pairs.

    Executive-theme fields:
      tagline:      short line under the role (themes of expertise).
      photo:        optional path to a headshot; rendered only into the
                    "*_photo.pdf" variant (ATS files never carry images).
      metrics:      (value, label) pairs for the key-numbers strip.
      highlights:   "Signature Achievements" bullets (use **lead-in**).
      awards:       (year, text) pairs.
      competencies: short phrases rendered as a grid / dot-separated line.
      earlier_career: condensed Jobs (title/company/dates + one line).
      details:      (label, text) rows, e.g. Languages, Citizenship.
      references:   one line.
      approach:     "Leadership Approach" bullets: principle + proof from
                    the career (vision, never unsupported claims).
      keywords:     embedded into PDF/DOCX metadata (search/ATS indexing).
      headings:     overrides for section titles, keyed by section id.
    """
    name: str
    role: str
    contact_segments: list[tuple[str, str | None]]
    profile: str
    experience: list[Job]
    education: list[tuple[str, str]] = field(default_factory=list)
    skills: list[tuple[str, str]] = field(default_factory=list)
    selected_systems: list[tuple[str, str]] = field(default_factory=list)
    courses: str = ""
    additional: str = ""
    # Output filename stem, e.g. "Dinc_Cetintas_AI_Engineer"
    basename: str = "Resume"

    # --- executive theme ----------------------------------------------------
    theme: str = "classic"
    lang: str = "en"            # "en" | "tr": PDF/DOCX language tag + correct uppercasing
    tagline: str = ""
    photo: str = ""
    metrics: list[tuple[str, str]] = field(default_factory=list)
    highlights: list[str] = field(default_factory=list)
    awards: list[tuple[str, str]] = field(default_factory=list)
    competencies: list[str] = field(default_factory=list)
    earlier_career: list[Job] = field(default_factory=list)
    details: list[tuple[str, str]] = field(default_factory=list)
    references: str = ""
    approach: list[str] = field(default_factory=list)
    keywords: str = ""
    headings: dict[str, str] = field(default_factory=dict)

    def heading(self, key: str, default: str) -> str:
        """Section title for `key`, honouring any override in `headings`."""
        return self.headings.get(key, default)
