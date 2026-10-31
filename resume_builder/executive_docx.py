"""Executive-theme DOCX renderer — the file to upload into ATS portals.

Same content and order as the executive PDF, but built for parsers:
single column, real paragraphs (no tables, text boxes, images, headers or
footers carrying content), standard section titles, Cambria headings and
Calibri body (the metric twins of the PDF's Caladea/Carlito).
The key-numbers strip becomes one plain line; the competency grid becomes a
dot-separated paragraph.
"""
from __future__ import annotations

from docx import Document
from docx.enum.text import WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import datetime as _dt

from docx.shared import Mm, Pt, RGBColor

from .markup import segments
from .render import _add_bottom_border, _add_hyperlink, _set_char_spacing
from .schema import Job, Resume

NAVY = RGBColor(0x15, 0x2A, 0x47)
ACCENT = RGBColor(0x96, 0x71, 0x3C)
MUTED = RGBColor(0x60, 0x65, 0x6E)
NAVY_HEX = "152A47"
HAIR_HEX = "CED1D7"


def _rich(paragraph, text: str, size: float = 10, color: RGBColor | None = None) -> None:
    """Append `text` to `paragraph`, turning **bold** markup into bold runs."""
    for chunk, bold in segments(text):
        run = paragraph.add_run(chunk)
        run.bold = bold
        run.font.size = Pt(size)
        if color is not None:
            run.font.color.rgb = color


def _spacing(paragraph, before: float = 0, after: float = 0) -> None:
    paragraph.paragraph_format.space_before = Pt(before)
    paragraph.paragraph_format.space_after = Pt(after)


def build_executive_docx(resume: Resume, path: str) -> None:
    """Render `resume` as an ATS-safe, single-column executive DOCX."""
    doc = Document()
    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(10)
    rpr = normal.element.get_or_add_rPr()
    fonts = rpr.find(qn("w:rFonts"))
    if fonts is None:
        fonts = OxmlElement("w:rFonts")
        rpr.append(fonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        fonts.set(qn(attr), "Calibri")

    props = doc.core_properties
    now = _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0, tzinfo=None)
    props.created = props.modified = now
    props.last_modified_by = resume.name
    props.revision = 1
    props.comments = ""
    props.author = resume.name
    props.title = f"{resume.name} — {resume.role}"
    props.subject = f"Curriculum Vitae — {resume.role}"
    props.keywords = resume.keywords[:255]  # OOXML core-property limit

    sec = doc.sections[0]
    sec.page_width, sec.page_height = Mm(210), Mm(297)  # A4, like the PDF
    sec.top_margin = sec.bottom_margin = Pt(36)
    sec.left_margin = sec.right_margin = Pt(48)
    right_pos = sec.page_width - sec.left_margin - sec.right_margin

    for name in ("Heading 1", "Heading 2"):
        st = doc.styles[name]
        st.font.name = "Calibri"
        st.font.color.rgb = NAVY
        st.font.italic = False
        st.element.get_or_add_rPr()
        st.paragraph_format.space_before = Pt(0)

    def heading(text: str) -> None:
        # Real "Heading 1" style so parsers detect section boundaries.
        p = doc.add_paragraph(style="Heading 1")
        run = p.add_run(text.upper())
        run.bold = True
        run.font.size = Pt(10.5)
        run.font.color.rgb = NAVY
        _set_char_spacing(run, 1.2)
        _spacing(p, 12, 5)
        _add_bottom_border(p, color=HAIR_HEX, sz=4, space=2)

    def bullet(text: str, size: float = 10) -> None:
        p = doc.add_paragraph(style="List Bullet")
        _spacing(p, 0, 2.5)
        _rich(p, text, size)

    # --- header -------------------------------------------------------------
    p = doc.add_paragraph()
    run = p.add_run(resume.name)
    run.bold = True
    run.font.name = "Cambria"
    run.font.size = Pt(24)
    run.font.color.rgb = NAVY
    _spacing(p, 0, 1)

    p = doc.add_paragraph()
    run = p.add_run(resume.role)
    run.font.all_caps = True  # visual caps; parsers still read mixed case
    run.bold = True
    run.font.size = Pt(10)
    run.font.color.rgb = ACCENT
    _set_char_spacing(run, 1.2)
    _spacing(p, 0, 2)

    if resume.tagline:
        p = doc.add_paragraph()
        run = p.add_run(resume.tagline)
        run.italic = True
        run.font.name = "Cambria"
        run.font.size = Pt(10.5)
        _spacing(p, 0, 3)

    p = doc.add_paragraph()
    for i, (text, url) in enumerate(resume.contact_segments):
        if url and not url.startswith("tel:"):
            _add_hyperlink(p, text, url, size=9, color=NAVY_HEX)
        else:
            run = p.add_run(text)
            run.font.size = Pt(9)
            run.font.color.rgb = MUTED
        if i < len(resume.contact_segments) - 1:
            s = p.add_run("  |  ")
            s.font.size = Pt(9)
            s.font.color.rgb = ACCENT
    _spacing(p, 0, 6)
    _add_bottom_border(p, color=NAVY_HEX, sz=8, space=4)

    if resume.metrics:
        # Two figures per line, mirroring the PDF's 2x2 band; non-breaking
        # spaces keep each figure ("EBRD Gold") on one line.
        for start in range(0, len(resume.metrics), 2):
            p = doc.add_paragraph()
            _spacing(p, 2 if start == 0 else 0, 1)
            pair = resume.metrics[start:start + 2]
            for i, (value, label) in enumerate(pair):
                v = p.add_run(value.replace(" ", "\u00a0") + "  ")
                v.bold = True
                v.font.name = "Cambria"
                v.font.size = Pt(12)
                v.font.color.rgb = NAVY
                lab = p.add_run(label)
                lab.font.size = Pt(9.5)
                lab.font.color.rgb = MUTED
                if i < len(pair) - 1:
                    s = p.add_run("     |     ")
                    s.font.size = Pt(9.5)
                    s.font.color.rgb = ACCENT

    # --- body ---------------------------------------------------------------
    if resume.profile:
        heading(resume.heading("profile", "Executive Profile"))
        p = doc.add_paragraph()
        _rich(p, resume.profile, 10.5)

    if resume.highlights:
        heading(resume.heading("highlights", "Signature Achievements"))
        for h in resume.highlights:
            bullet(h)

    def job_block(job: Job, compact: bool = False) -> None:
        p = doc.add_paragraph(style="Heading 2")  # employer line
        _spacing(p, 4 if compact else 8, 0)
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.tab_stops.add_tab_stop(right_pos, WD_TAB_ALIGNMENT.RIGHT)
        r = p.add_run(job.company or job.title)
        r.bold = True
        r.font.name = "Cambria"
        r.font.size = Pt(11.5)
        r.font.color.rgb = NAVY
        if job.location:
            loc = p.add_run("  ·  " + job.location)
            loc.font.size = Pt(9)
            loc.font.color.rgb = MUTED
        p.add_run("\t")
        d = p.add_run(job.dates.replace("–", "-"))  # plain hyphen: safest for Taleo
        d.bold = True
        d.font.size = Pt(9.5)
        d.font.color.rgb = MUTED
        if job.company:
            t = doc.add_paragraph()
            _spacing(t, 0, 1)
            t.paragraph_format.keep_with_next = True
            tr = t.add_run(job.title)
            tr.bold = True
            tr.font.size = Pt(10)
        if job.context:
            c = doc.add_paragraph()
            _spacing(c, 0, 2)
            c.paragraph_format.keep_with_next = True
            cr = c.add_run(job.context)
            cr.italic = True
            cr.font.name = "Cambria"
            cr.font.size = Pt(9.5)
            cr.font.color.rgb = MUTED
        for b in job.bullets:
            if compact:
                q = doc.add_paragraph()
                _spacing(q, 0, 2)
                _rich(q, b, 9.5)
            else:
                bullet(b)

    if resume.experience:
        heading(resume.heading("experience", "Professional Experience"))
        for job in resume.experience:
            job_block(job)

    if resume.earlier_career:
        heading(resume.heading("earlier", "Earlier Career"))
        for job in resume.earlier_career:
            job_block(job, compact=True)

    if resume.awards:
        heading(resume.heading("awards", "Awards & Recognition"))
        for year, text in resume.awards:
            p = doc.add_paragraph()
            _spacing(p, 0, 3)
            y = p.add_run(year + "   ")
            y.bold = True
            y.font.name = "Cambria"
            y.font.color.rgb = ACCENT
            _rich(p, text)

    if resume.competencies:
        heading(resume.heading("competencies", "Core Competencies"))
        p = doc.add_paragraph()
        p.add_run("  •  ".join(resume.competencies)).font.size = Pt(10)

    if resume.education:
        heading(resume.heading("education", "Education"))
        for school, right in resume.education:
            p = doc.add_paragraph()
            p.paragraph_format.tab_stops.add_tab_stop(right_pos, WD_TAB_ALIGNMENT.RIGHT)
            _rich(p, school)
            p.add_run("\t" + right).font.color.rgb = MUTED

    if resume.details:
        heading(resume.heading("details", "Additional Information"))
        for label, text in resume.details:
            p = doc.add_paragraph()
            _spacing(p, 0, 2)
            lr = p.add_run(label + ": ")
            lr.bold = True
            lr.font.color.rgb = NAVY
            _rich(p, text)

    if resume.references:
        heading(resume.heading("references", "References"))
        _rich(doc.add_paragraph(), resume.references)

    doc.save(path)
