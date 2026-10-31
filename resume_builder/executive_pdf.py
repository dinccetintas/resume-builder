"""Executive-theme PDF renderer (board-level CV).

Design goals, in priority order:
  1. The top third of page 1 sells the candidate in a 6-second scan:
     name, role, positioning line, then a key-numbers strip.
  2. Real, extractable text in a single reading column so ATS parsers and
     copy-paste keep the order (no text boxes, no skill bars, no charts).
  3. Quiet luxury: two typefaces (Caladea serif for name/headings/figures,
     Carlito sans for body), one navy + one muted bronze accent, generous
     whitespace and hairline rules.

Fonts are embedded (resume_builder/fonts, SIL OFL) so Turkish characters
(İ ı ş ğ ç ö ü) render and extract correctly on every machine.
"""
from __future__ import annotations

import os

from fpdf import FPDF

from .schema import Job, Resume

FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")

# Palette ---------------------------------------------------------------------
NAVY = (21, 42, 71)
INK = (33, 37, 43)
MUTED = (96, 101, 110)
ACCENT = (150, 113, 60)      # muted bronze
HAIR = (206, 209, 215)
BAND = (246, 244, 239)       # warm off-white for the key-numbers strip

# Geometry (mm) ---------------------------------------------------------------
MARGIN_X = 17.0
MARGIN_TOP = 15.0
MARGIN_BOTTOM = 15.0
BODY_SIZE = 9.8
LINE_H = 4.55
BULLET_INDENT = 4.6


class _ExecPDF(FPDF):
    """FPDF with the executive footer (name + page x/y)."""

    def footer(self) -> None:  # noqa: D401 — fpdf hook
        """Page counter only (pages 2+). A name/title footer would be
        extracted mid-text by ATS parsers and misread as a job title."""
        if self.page_no() == 1:
            return
        self.set_y(-10)
        self.set_font("sans", "", 7.5)
        self.set_text_color(*MUTED)
        self.cell(0, 4, f"{self.page_no()} / {{nb}}", align="R")


def _register_fonts(pdf: FPDF) -> None:
    """Embed Caladea as 'serif' and Carlito as 'sans' (all four styles)."""
    for family, stem in (("serif", "Caladea"), ("sans", "Carlito")):
        for style, suffix in (("", "Regular"), ("B", "Bold"),
                              ("I", "Italic"), ("BI", "BoldItalic")):
            pdf.add_font(family, style, os.path.join(FONT_DIR, f"{stem}-{suffix}.ttf"))


class ExecutiveLayout:
    """Stateful drawer for one executive CV; call `render()` once."""

    def __init__(self, resume: Resume, with_photo: bool) -> None:
        self.r = resume
        self.with_photo = with_photo and bool(resume.photo) and os.path.exists(resume.photo)
        pdf = _ExecPDF(format="A4", unit="mm")
        _register_fonts(pdf)
        pdf.set_margins(MARGIN_X, MARGIN_TOP, MARGIN_X)
        pdf.set_auto_page_break(auto=True, margin=MARGIN_BOTTOM)
        pdf.alias_nb_pages()
        pdf.set_lang("en")
        pdf.set_title(f"{resume.name} — {resume.role}")
        pdf.set_author(resume.name)
        pdf.set_subject(f"Curriculum Vitae — {resume.role}")
        if resume.keywords:
            pdf.set_keywords(resume.keywords)
        pdf.set_creator("resume-builder (executive theme)")
        pdf.add_page()
        self.pdf = pdf
        self.width = pdf.w - 2 * MARGIN_X

    # -- primitives -----------------------------------------------------------

    def _font(self, family: str, style: str, size: float, color=INK) -> None:
        self.pdf.set_font(family, style, size)
        self.pdf.set_text_color(*color)

    def _hline(self, y: float, x0: float | None = None, x1: float | None = None,
               color=HAIR, width: float = 0.2) -> None:
        self.pdf.set_draw_color(*color)
        self.pdf.set_line_width(width)
        self.pdf.line(MARGIN_X if x0 is None else x0, y,
                      MARGIN_X + self.width if x1 is None else x1, y)

    def _ensure(self, height: float) -> None:
        """Start a new page if `height` mm will not fit (keeps blocks together)."""
        if self.pdf.will_page_break(height):
            self.pdf.add_page()

    def _rich(self, text: str, x: float, w: float, size: float = BODY_SIZE,
              color=INK, h: float = LINE_H) -> None:
        """Wrapped paragraph honouring **bold** markup."""
        self.pdf.set_x(x)
        self._font("sans", "", size, color)
        self.pdf.multi_cell(w, h, text, markdown=True, align="L",
                            new_x="LMARGIN", new_y="NEXT")

    def _bullet(self, text: str, x: float | None = None, w: float | None = None) -> None:
        x = MARGIN_X if x is None else x
        w = self.width - (x - MARGIN_X) if w is None else w
        self._ensure(LINE_H * 2)
        y = self.pdf.get_y()
        self.pdf.set_fill_color(*ACCENT)
        self.pdf.rect(x + 0.6, y + LINE_H / 2 - 0.55, 1.1, 1.1, style="F")
        self._rich(text, x + BULLET_INDENT, w - BULLET_INDENT)
        self.pdf.set_y(self.pdf.get_y() + 0.9)

    def heading(self, text: str) -> None:
        """Letter-spaced navy section title followed by a hairline."""
        self._ensure(20)  # never strand a heading: keep >=2 lines of content with it
        pdf = self.pdf
        pdf.ln(3.4)
        self._font("sans", "B", 9.6, NAVY)
        pdf.set_char_spacing(1.4)
        label = text.upper()
        tw = pdf.get_string_width(label)
        y = pdf.get_y()
        pdf.set_x(MARGIN_X)
        pdf.cell(tw + 1, 5.2, label)
        pdf.set_char_spacing(0)
        self._hline(y + 2.7, MARGIN_X + tw + 4, None, HAIR, 0.25)
        pdf.set_fill_color(*ACCENT)
        pdf.rect(MARGIN_X, y + 5.6, 9, 0.7, style="F")
        pdf.set_y(y + 8.2)

    # -- blocks ---------------------------------------------------------------

    def header(self) -> None:
        pdf, r = self.pdf, self.r
        x = MARGIN_X
        top = pdf.get_y()
        if self.with_photo:
            d = 27.0
            with pdf.round_clip(MARGIN_X, top, d):
                pdf.image(r.photo, x=MARGIN_X, y=top, w=d, h=d)
            pdf.set_draw_color(*HAIR)
            pdf.set_line_width(0.3)
            pdf.ellipse(MARGIN_X, top, d, d)
            x = MARGIN_X + d + 6
        w = self.width - (x - MARGIN_X)

        pdf.set_xy(x, top + (0.5 if self.with_photo else 0))
        self._font("serif", "B", 26, NAVY)
        pdf.cell(w, 11, r.name, new_x="LMARGIN", new_y="NEXT")

        pdf.set_x(x)
        self._font("sans", "B", 9.8, ACCENT)
        pdf.set_char_spacing(1.5)
        pdf.cell(w, 5.6, r.role.upper(), new_x="LMARGIN", new_y="NEXT")
        pdf.set_char_spacing(0)

        if r.tagline:
            pdf.set_x(x)
            self._font("serif", "I", 10.6, INK)
            pdf.multi_cell(w, 5.0, r.tagline, align="L", new_x="LMARGIN", new_y="NEXT")

        pdf.set_y(pdf.get_y() + 1.4)
        pdf.set_x(x)
        self._contact_line(x)
        bottom = pdf.get_y()
        if self.with_photo:
            bottom = max(bottom, top + 27.0)
        pdf.set_y(bottom + 2.6)
        self._hline(pdf.get_y(), color=NAVY, width=0.5)
        pdf.set_y(pdf.get_y() + 3.2)

    def _contact_line(self, x: float) -> None:
        pdf = self.pdf
        sep = "   ·   "
        pdf.set_x(x)
        for i, (text, url) in enumerate(self.r.contact_segments):
            self._font("sans", "", 8.8, NAVY if url else MUTED)
            tw = pdf.get_string_width(text)
            if pdf.get_x() + tw > MARGIN_X + self.width:
                pdf.ln(4.4)
                pdf.set_x(x)
            pdf.cell(tw, 4.4, text, link=url or "")
            if i < len(self.r.contact_segments) - 1:
                self._font("sans", "", 8.8, ACCENT)
                pdf.cell(pdf.get_string_width(sep), 4.4, sep)
        pdf.ln(4.6)

    def metrics(self) -> None:
        """Key-numbers band: two columns, each cell "FIGURE  label" on one line.

        Value and label share a baseline so text extraction (pdftotext, ATS
        PDF parsers) reads each pair together, row by row, left to right.
        """
        items = self.r.metrics
        if not items:
            return
        pdf = self.pdf
        cols = 2
        rows = (len(items) + cols - 1) // cols
        cw = self.width / cols
        row_h = 8.6
        pad = 3.2
        top = pdf.get_y()
        h = rows * row_h + 2.4
        pdf.set_fill_color(*BAND)
        pdf.rect(MARGIN_X, top, self.width, h, style="F")
        pdf.set_draw_color(*HAIR)
        pdf.set_line_width(0.25)
        pdf.line(MARGIN_X + cw, top + 2.2, MARGIN_X + cw, top + h - 2.2)
        for r in range(1, rows):
            y = top + 1.2 + r * row_h
            pdf.line(MARGIN_X + pad, y, MARGIN_X + self.width - pad, y)
        for i, (value, label) in enumerate(items):
            row, col = divmod(i, cols)
            x = MARGIN_X + col * cw + pad
            base = top + 1.2 + row * row_h
            self._font("serif", "B", 15, NAVY)
            vw = pdf.get_string_width(value) + 2.5
            pdf.set_xy(x, base + 0.8)
            pdf.cell(vw, 7, value)
            size = 9.0
            avail = cw - 2 * pad - vw
            self._font("sans", "", size, MUTED)
            while pdf.get_string_width(label) > avail and size > 7.2:
                size -= 0.2
                self._font("sans", "", size, MUTED)
            pdf.set_xy(x + vw, base + 1.0)
            pdf.cell(avail, 7, label)
        pdf.set_y(top + h + 1.5)

    def paragraph(self, text: str) -> None:
        self._rich(text, MARGIN_X, self.width, size=10.1, h=4.85)

    def awards(self) -> None:
        for year, text in self.r.awards:
            self._ensure(LINE_H * 2.2)
            y = self.pdf.get_y()
            self.pdf.set_xy(MARGIN_X, y)
            self._font("serif", "B", 10.4, ACCENT)
            self.pdf.cell(13, LINE_H, year)
            self._rich(text, MARGIN_X + 13, self.width - 13)
            self.pdf.set_y(self.pdf.get_y() + 1.1)

    def job(self, job: Job, compact: bool = False) -> None:
        pdf = self.pdf
        self._ensure(26 if job.bullets and not compact else 12)
        pdf.ln(1.6 if compact else 2.4)
        y = pdf.get_y()
        # Line 1: company (serif) · location ............ dates
        self._font("sans", "B", 9, MUTED)
        dw = pdf.get_string_width(job.dates) + 1
        pdf.set_xy(MARGIN_X + self.width - dw, y + 0.6)
        pdf.cell(dw, 5, job.dates, align="R")
        pdf.set_xy(MARGIN_X, y)
        self._font("serif", "B", 11.6 if not compact else 10.6, NAVY)
        company = job.company or job.title
        pdf.cell(pdf.get_string_width(company) + 1, 6, company)
        if job.location:
            self._font("sans", "", 8.8, MUTED)
            pdf.cell(0, 6.2, "  ·  " + job.location)
        pdf.set_y(y + 6.0)
        # Line 2: role title
        if job.company:
            self._font("sans", "B", 9.9, INK)
            pdf.set_x(MARGIN_X)
            pdf.cell(self.width - dw, 4.8, job.title, new_x="LMARGIN", new_y="NEXT")
        # Line 3: context
        if job.context:
            pdf.set_x(MARGIN_X)
            self._font("serif", "I", 9.4, MUTED)
            pdf.multi_cell(self.width, 4.3, job.context, align="L",
                           new_x="LMARGIN", new_y="NEXT")
        pdf.set_y(pdf.get_y() + 1.0)
        for b in job.bullets:
            if compact:
                self._rich(b, MARGIN_X, self.width, size=9.5, h=4.4)
            else:
                self._bullet(b)

    def competencies(self) -> None:
        """Three-column grid, row-major (ATS text order stays left-to-right)."""
        items = self.r.competencies
        cols = 3
        cw = self.width / cols
        pdf = self.pdf
        line_h = 4.3
        for row_start in range(0, len(items), cols):
            row = items[row_start:row_start + cols]
            self._font("sans", "", 9.4, INK)
            n_lines = max(len(pdf.multi_cell(cw - 5, line_h, it, dry_run=True,
                                             output="LINES")) for it in row)
            self._ensure(n_lines * line_h + 1)
            y = pdf.get_y()
            for c, item in enumerate(row):
                x = MARGIN_X + c * cw
                pdf.set_fill_color(*ACCENT)
                pdf.rect(x + 0.6, y + line_h / 2 - 0.5, 1.0, 1.0, style="F")
                pdf.set_xy(x + 3.8, y)
                self._font("sans", "", 9.4, INK)
                pdf.multi_cell(cw - 5, line_h, item, align="L", new_x="RIGHT", new_y="TOP")
            pdf.set_y(y + n_lines * line_h + 0.9)

    def details(self, rows: list[tuple[str, str]], label_w: float = 36) -> None:
        for label, text in rows:
            self._ensure(LINE_H * 1.6)
            y = self.pdf.get_y()
            self.pdf.set_xy(MARGIN_X, y)
            self._font("sans", "B", 9.5, NAVY)
            self.pdf.cell(label_w, LINE_H, label)
            self._rich(text, MARGIN_X + label_w, self.width - label_w, size=9.5)
            self.pdf.set_y(self.pdf.get_y() + 0.8)

    # -- assembly -------------------------------------------------------------

    def render(self, path: str) -> None:
        r = self.r
        self.header()
        self.metrics()
        if r.profile:
            self.heading(r.heading("profile", "Executive Profile"))
            self.paragraph(r.profile)
        if r.highlights:
            self.heading(r.heading("highlights", "Signature Achievements"))
            for h in r.highlights:
                self._bullet(h)
        if r.experience:
            self.heading(r.heading("experience", "Professional Experience"))
            for job in r.experience:
                self.job(job)
        if r.earlier_career:
            self.heading(r.heading("earlier", "Earlier Career"))
            for job in r.earlier_career:
                self.job(job, compact=True)
        if r.awards:
            self.heading(r.heading("awards", "Awards & Recognition"))
            self.awards()
        if r.competencies:
            self.heading(r.heading("competencies", "Core Competencies"))
            self.competencies()
        if r.education:
            self.heading(r.heading("education", "Education"))
            self._education()
        if r.details:
            self.heading(r.heading("details", "Additional Information"))
            self.details(r.details)
        if r.references:
            self.heading(r.heading("references", "References"))
            self.paragraph(r.references)
        self.pdf.output(path)

    def _education(self) -> None:
        pdf = self.pdf
        for school, right in self.r.education:
            self._ensure(LINE_H * 2)
            y = pdf.get_y()
            self._font("sans", "", 9, MUTED)
            dw = pdf.get_string_width(right) + 1
            pdf.set_xy(MARGIN_X + self.width - dw, y)
            pdf.cell(dw, 5, right, align="R")
            pdf.set_xy(MARGIN_X, y)
            self._rich(school, MARGIN_X, self.width - dw - 2, size=9.8)
            pdf.set_y(pdf.get_y() + 0.8)


def build_executive_pdf(resume: Resume, path: str, with_photo: bool = False) -> None:
    """Render `resume` with the executive layout to `path`."""
    ExecutiveLayout(resume, with_photo=with_photo).render(path)
