"""Data model for a résumé. One `Resume` per candidate; the renderer turns it
into DOCX + PDF + Markdown. Keep every field factual and candidate-confirmed
(see METHODOLOGY.md — the anti-fabrication rule)."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Job:
    """One role in the experience section."""
    title: str          # e.g. "AI Engineer — Commercial Bank of Qatar, Doha"
    dates: str          # e.g. "Jan 2024 – Present"
    bullets: list[str]  # each: business problem -> architecture -> impact -> metric


@dataclass
class Resume:
    """A complete résumé. Lists left empty are skipped in the output.

    contact_segments: ordered (text, url_or_None) pairs rendered on one centered
      line; entries with a url become clickable links (use "mailto:" for email).
    education / skills / selected_systems: (left, right) string pairs.
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
