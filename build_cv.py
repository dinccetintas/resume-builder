#!/usr/bin/env python3
"""Render Dinc Cetintas' confirmed AI Engineer CV to ATS-safe DOCX + PDF (+ Markdown).

Single source of truth: the CV data below. Both renderers consume the same
structure so the DOCX and PDF stay identical. No tables/text-boxes/images in the
DOCX so applicant tracking systems parse it as clean linear text.
"""
from __future__ import annotations

import os

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, RGBColor
from fpdf import FPDF

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
BASENAME = "Dinc_Cetintas_AI_Engineer"

# --- Confirmed CV content ---------------------------------------------------

NAME = "DINC CETINTAS"
ROLE = "AI Engineer"
CONTACT = (
    "EU Citizen — no visa sponsorship required  ·  Cyprus  ·  "
    "dinccetintas24@gmail.com  ·  +974 51444964  ·  "
    "linkedin.com/in/dinc-cetintas-79a04b205  ·  GitHub"
)

PROFILE = (
    "AI Engineer who designs, builds, deploys, evaluates, and scales production AI systems in "
    "regulated financial environments. I own LLM and RAG platforms end-to-end — architecture, "
    "evaluation, agentic orchestration, model serving, and observability — delivering reliable, "
    "auditable, low-latency products used by real business teams. I combine software "
    "engineering, MLOps, and GenAI to turn mission-critical banking workflows into measurable "
    "gains in cost, speed, and risk reduction."
)

EXPERIENCE = [
    {
        "title": "AI Engineer — Commercial Bank of Qatar, Doha",
        "dates": "Jan 2024 – Present",
        "bullets": [
            "Architected and owned production LLM platforms for document intelligence, workflow "
            "automation, and conversational AI, deployed for multiple business teams across a "
            "regulated bank.",
            "Designed a production RAG platform over 900+ compliance documents — hybrid "
            "retrieval, semantic chunking, reranking, and citation grounding — delivering "
            "auditable, source-linked answers at 87% retrieval accuracy.",
            "Built automated evaluation pipelines measuring retrieval quality, grounding, and "
            "hallucination rate, with human review loops, gating every release on quality "
            "thresholds before production.",
            "Productionized agentic workflows orchestrating LLM reasoning, tool calling, OCR, "
            "and structured outputs to automate 500+ customer inquiries weekly — reducing "
            "manual workload 70% and earning the COO Problem Solver Award.",
            "Engineered 7 OCR + document-extraction pipelines for complex Arabic/English "
            "identity and financial documents, accelerating document handling ~65% while "
            "preserving traceability and data privacy.",
            "Deployed a real-time fraud-detection system with engineered risk features and "
            "rigorous evaluation (A/B testing, ROC-AUC 0.93), flagging anomalous transactions "
            "and hardening the bank's risk controls.",
            "Eliminated ~$120K/yr in third-party translation spend by building an on-prem "
            "Arabic↔English document translator that preserves layout and keeps sensitive "
            "data fully in-house.",
            "Owned end-to-end MLOps and observability — containerized model serving (Docker, "
            "Kubernetes, MLflow), CI/CD, monitoring, guardrails, caching, and model routing — "
            "cutting inference latency ~40% and ensuring production reliability.",
        ],
    },
    {
        "title": "Software Engineer — MeeApps, İstanbul",
        "dates": "Feb 2023 – Jan 2024",
        "bullets": [
            "Architected and delivered a high-frequency trading platform for 23 brokerage firms "
            "managing $10M+ in portfolios, achieving microsecond-level execution by optimizing "
            "ITCH, OUCH, and TCP protocols for ultra-low latency.",
            "Built and owned the full production stack — React/C#/C++ frontend, backend "
            "services, and co-located live market-data feeds — under strict real-time "
            "reliability constraints.",
            "Owned end-to-end system performance and reliability, sustaining 99.9% uptime "
            "under live trading load.",
        ],
    },
    {
        "title": "Machine Learning Engineer — Schneider Electric, İstanbul",
        "dates": "Jul 2022 – Dec 2022",
        "bullets": [
            "Built and deployed demand-forecasting and stock-out-risk models that reduced "
            "inventory gaps 12–15% during COVID supply shocks, directly improving fulfillment "
            "reliability.",
            "Engineered features from sales, supply-chain, and distributor data and built "
            "reproducible model pipelines with rigorous evaluation (cross-validation, holdout "
            "testing) for scalable deployment.",
            "Partnered with logistics stakeholders to define success metrics and operationalize "
            "forecasts into fulfillment planning.",
        ],
    },
]

EDUCATION = [
    ("BASc, Electronics Engineering — Sabancı University, İstanbul", "2018 – 2023"),
    ("Exchange Semester, Electrical & Electronics Engineering — Universitat "
     "Politècnica de València (UPV), Spain", "2022"),
]

SKILLS = [
    ("AI Systems / GenAI", "LLM systems, RAG (hybrid retrieval, reranking, citation grounding), "
     "agentic & multi-step workflows, tool / function calling, prompt & context engineering, "
     "AI orchestration, structured outputs"),
    ("AI Engineering / LLMOps", "Automated evaluation (retrieval quality, grounding, "
     "hallucination mitigation), human review loops, benchmarking, observability & logging, "
     "guardrails, caching, model routing, latency optimization, reliability engineering"),
    ("Production / Platform", "APIs, model serving, Docker, Kubernetes, MLflow, CI/CD, monitoring"),
    ("ML Foundations", "Supervised & unsupervised learning, feature engineering, time-series "
     "forecasting, A/B testing, statistical evaluation"),
    ("Cloud & Data", "Azure (OCR, Translation, Custom Models), AWS, SQL"),
    ("Programming", "Python; full-stack (React, C#, C++)"),
]

COURSES = (
    "Operationalizing LLMs on Azure (Duke) · Generative AI Applications with RAG & LangChain "
    "(IBM) · AI Agents (IBM) · Generative AI Techniques & Applications (Duke) · Machine "
    "Learning Specialization (Stanford) · TensorFlow in AI/ML/DL (DeepLearning.AI) · Deep "
    "Learning for Sequences & Time Series (DeepLearning.AI) · Visa Data Science Bootcamp"
)

ADDITIONAL = "Languages: English  ·  Links: LinkedIn, GitHub"


# --- DOCX renderer ----------------------------------------------------------

def build_docx(path: str) -> None:
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10.5)

    for section in doc.sections:
        section.top_margin = section.bottom_margin = Pt(40)
        section.left_margin = section.right_margin = Pt(50)

    def heading(text: str) -> None:
        p = doc.add_paragraph()
        p.space_before = Pt(8)
        run = p.add_run(text.upper())
        run.bold = True
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x1F, 0x3A, 0x5F)
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(2)

    def bullet(text: str) -> None:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(3)
        p.add_run(text)

    # Header
    name_p = doc.add_paragraph()
    name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = name_p.add_run(NAME)
    r.bold = True
    r.font.size = Pt(20)
    name_p.paragraph_format.space_after = Pt(0)

    role_p = doc.add_paragraph()
    role_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rr = role_p.add_run(ROLE)
    rr.font.size = Pt(12)
    rr.font.color.rgb = RGBColor(0x1F, 0x3A, 0x5F)
    role_p.paragraph_format.space_after = Pt(2)

    contact_p = doc.add_paragraph()
    contact_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cr = contact_p.add_run(CONTACT)
    cr.font.size = Pt(8.5)
    contact_p.paragraph_format.space_after = Pt(4)

    # Profile
    heading("Profile")
    doc.add_paragraph(PROFILE)

    # Experience
    heading("Professional Experience")
    for job in EXPERIENCE:
        jp = doc.add_paragraph()
        jp.paragraph_format.space_before = Pt(6)
        jp.paragraph_format.space_after = Pt(1)
        tr = jp.add_run(job["title"])
        tr.bold = True
        tr.font.size = Pt(10.5)
        jp.add_run("\t")
        dr = jp.add_run(job["dates"])
        dr.italic = True
        dr.font.size = Pt(9.5)
        for b in job["bullets"]:
            bullet(b)

    # Education
    heading("Education")
    for school, dates in EDUCATION:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        sr = p.add_run(school)
        sr.bold = True
        p.add_run("  —  " + dates).italic = True

    # Skills
    heading("Technical Skills")
    for cat, items in SKILLS:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        p.add_run(cat + ": ").bold = True
        p.add_run(items)

    # Courses
    heading("Certifications & Courses")
    doc.add_paragraph(COURSES)

    # Additional
    heading("Additional")
    doc.add_paragraph(ADDITIONAL)

    doc.save(path)


# --- PDF renderer -----------------------------------------------------------

NAVY = (31, 58, 95)


class CVPdf(FPDF):
    pass


def build_pdf(path: str) -> None:
    pdf = CVPdf(format="A4", unit="mm")
    pdf.set_auto_page_break(auto=True, margin=14)
    pdf.add_page()
    pdf.set_margins(left=16, top=14, right=16)
    width = pdf.w - 32

    def name_block() -> None:
        pdf.set_font("Helvetica", "B", 22)
        pdf.cell(0, 9, NAME, align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*NAVY)
        pdf.set_font("Helvetica", "", 12)
        pdf.cell(0, 6, ROLE, align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(0, 0, 0)
        pdf.set_font("Helvetica", "", 8)
        pdf.multi_cell(0, 4, latin(CONTACT), align="C")
        pdf.ln(1.5)

    def heading(text: str) -> None:
        pdf.ln(1.5)
        pdf.set_text_color(*NAVY)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 5.5, text.upper(), new_x="LMARGIN", new_y="NEXT")
        y = pdf.get_y()
        pdf.set_draw_color(*NAVY)
        pdf.line(16, y, 16 + width, y)
        pdf.ln(1)
        pdf.set_text_color(0, 0, 0)

    def body(text: str) -> None:
        pdf.set_x(pdf.l_margin)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(width, 4.6, latin(text))

    def bullet(text: str) -> None:
        pdf.set_x(pdf.l_margin)
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(4, 4.6, latin("-"))
        pdf.multi_cell(width - 4, 4.6, latin(text))

    name_block()

    heading("Profile")
    body(PROFILE)

    heading("Professional Experience")
    for job in EXPERIENCE:
        pdf.ln(1.5)
        # Title (bold) and dates (italic, right-aligned) on one row.
        pdf.set_x(pdf.l_margin)
        pdf.set_font("Helvetica", "I", 9)
        date_w = pdf.get_string_width(latin(job["dates"])) + 2
        pdf.set_font("Helvetica", "B", 10.5)
        pdf.cell(width - date_w, 5, latin(job["title"]))
        pdf.set_font("Helvetica", "I", 9)
        pdf.cell(date_w, 5, latin(job["dates"]), align="R", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(0.5)
        for b in job["bullets"]:
            bullet(b)

    heading("Education")
    for school, dates in EDUCATION:
        pdf.set_x(pdf.l_margin)
        pdf.set_font("Helvetica", "B", 10)
        body_str = f"{school}  -  {dates}"
        pdf.multi_cell(width, 4.6, latin(body_str))

    heading("Technical Skills")
    for cat, items in SKILLS:
        pdf.set_font("Helvetica", "B", 10)
        pdf.write(4.8, latin(cat + ": "))
        pdf.set_font("Helvetica", "", 10)
        pdf.write(4.8, latin(items))
        pdf.ln(5.2)

    heading("Certifications & Courses")
    body(COURSES)

    heading("Additional")
    body(ADDITIONAL)

    pdf.output(path)


def latin(s: str) -> str:
    """fpdf2 core fonts are latin-1; map the few unicode glyphs we use."""
    repl = {
        "—": "-", "–": "-", "•": "-", "·": "|",
        "↔": "<->", "İ": "I", "ı": "i", "ç": "c", "Ç": "C",
        "ş": "s", "Ş": "S", "ğ": "g", "Ğ": "G",
        "è": "e", "í": "i", "ü": "u", "ö": "o",
        "‘": "'", "’": "'", "“": '"', "”": '"',
    }
    for k, v in repl.items():
        s = s.replace(k, v)
    return s.encode("latin-1", "replace").decode("latin-1")


# --- Markdown source --------------------------------------------------------

def build_md(path: str) -> None:
    lines = [f"# {NAME}", f"**{ROLE}**", "", CONTACT, "", "## PROFILE", PROFILE, "",
             "## PROFESSIONAL EXPERIENCE"]
    for job in EXPERIENCE:
        lines += ["", f"**{job['title']}** · {job['dates']}"]
        lines += [f"- {b}" for b in job["bullets"]]
    lines += ["", "## EDUCATION"]
    lines += [f"**{s}** · {d}  " for s, d in EDUCATION]
    lines += ["", "## TECHNICAL SKILLS"]
    lines += [f"- **{c}:** {i}" for c, i in SKILLS]
    lines += ["", "## CERTIFICATIONS & COURSES", COURSES, "", "## ADDITIONAL", ADDITIONAL, ""]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    docx_path = os.path.join(OUT_DIR, BASENAME + ".docx")
    pdf_path = os.path.join(OUT_DIR, BASENAME + ".pdf")
    md_path = os.path.join(os.path.dirname(OUT_DIR), BASENAME + ".md")
    build_docx(docx_path)
    build_pdf(pdf_path)
    build_md(md_path)
    for p in (docx_path, pdf_path, md_path):
        print(f"wrote {p}  ({os.path.getsize(p)} bytes)")


if __name__ == "__main__":
    main()
