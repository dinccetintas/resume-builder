"""Typed CV data model + the confirmed default CV.

The single source of truth used to be module-level constants in ``build_cv.py``.
We keep the same content here but wrap it in a dataclass so the renderer can
accept *tailored* variants (e.g. an LLM-produced CV for a specific job) instead
of only the hard-coded default. ``CVData.from_dict`` accepts the JSON the
tailoring step emits; ``DEFAULT_CV`` is the original confirmed CV.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Tuple


@dataclass
class Experience:
    title: str
    dates: str
    bullets: List[str]


@dataclass
class CVData:
    name: str
    role: str
    email: str
    phone: str
    linkedin_url: str
    github_url: str
    # (text, link-or-None) — rendered as a centered contact line.
    contact_segments: List[Tuple[str, Optional[str]]]
    profile: str
    experience: List[Experience]
    education: List[Tuple[str, str]]          # (school, dates)
    skills: List[Tuple[str, str]]             # (category, items)
    selected_systems: List[Tuple[str, str]]   # (name, description)
    courses: str
    additional: str

    @classmethod
    def from_dict(cls, d: dict) -> "CVData":
        """Build from the tailoring step's JSON (tolerant of missing fields)."""
        base = DEFAULT_CV
        def seg(items):
            return [(s.get("text", ""), s.get("url")) for s in items] if items else base.contact_segments
        return cls(
            name=d.get("name", base.name),
            role=d.get("role", base.role),
            email=d.get("email", base.email),
            phone=d.get("phone", base.phone),
            linkedin_url=d.get("linkedin_url", base.linkedin_url),
            github_url=d.get("github_url", base.github_url),
            contact_segments=seg(d.get("contact_segments")),
            profile=d.get("profile", base.profile),
            experience=[
                Experience(e["title"], e["dates"], list(e.get("bullets", [])))
                for e in d.get("experience", [])
            ] or base.experience,
            education=[tuple(x) for x in d.get("education", [])] or base.education,
            skills=[tuple(x) for x in d.get("skills", [])] or base.skills,
            selected_systems=[tuple(x) for x in d.get("selected_systems", [])] or base.selected_systems,
            courses=d.get("courses", base.courses),
            additional=d.get("additional", base.additional),
        )


_EMAIL = "dinccetintas24@gmail.com"
_LINKEDIN = "https://www.linkedin.com/in/dinc-cetintas-79a04b205/"
_GITHUB = "https://github.com/dinccetintas"

DEFAULT_CV = CVData(
    name="DINC CETINTAS",
    role="AI Engineer",
    email=_EMAIL,
    phone="+974 51444964",
    linkedin_url=_LINKEDIN,
    github_url=_GITHUB,
    contact_segments=[
        ("EU Citizen, Cyprus", None),
        (_EMAIL, "mailto:" + _EMAIL),
        ("+974 51444964", None),
        ("LinkedIn", _LINKEDIN),
        ("GitHub", _GITHUB),
    ],
    profile=(
        "AI Engineer who owns production AI platforms end-to-end — from architecture and evaluation "
        "to deployment, observability, and continuous improvement — in regulated financial "
        "environments. I ship reliable, auditable, low-latency LLM and RAG systems used across 7+ "
        "business teams and 200+ internal users, combining software engineering, MLOps, and GenAI to "
        "turn mission-critical banking workflows into measurable gains in cost, speed, and risk "
        "reduction."
    ),
    experience=[
        Experience(
            "AI Engineer — Commercial Bank of Qatar, Doha",
            "Jan 2024 – Present",
            [
                "Established reusable AI platform capabilities — shared retrieval, evaluation, "
                "document-intelligence, and model-serving components — accelerating delivery of "
                "multiple production AI applications across 7+ business teams and 200+ internal "
                "users under banking compliance and data-governance controls.",
                "Designed the RAG architecture — hybrid retrieval, semantic chunking, reranking, "
                "and citation grounding over 900+ compliance documents — delivering explainable, "
                "fully traceable, source-linked answers at 87% retrieval accuracy.",
                "Defined architectural, evaluation, and release standards for the production AI "
                "systems I built — automated quality benchmarks (retrieval quality, grounding, "
                "hallucination mitigation), human review loops, and auditability enforced before "
                "every deployment.",
                "Built an AI email & inquiry assistant that auto-classifies and drafts responses to "
                "500+ requests/week using LLM reasoning and structured outputs, cutting manual "
                "workload 70% and earning the COO Problem Solver Award.",
                "Developed production AI workflows for credit-risk and financial analysis, combining "
                "retrieval, tool calling, and LLM reasoning to generate structured, analyst-ready "
                "reports.",
                "Engineered an OCR & document-intelligence pipeline (7 extraction flows) for complex "
                "Arabic/English identity and financial documents, accelerating document handling "
                "~65% with full traceability.",
                "Built and owned the FastAPI / REST services and model-serving layer (Docker, "
                "Kubernetes, MLflow) with production monitoring and observability, cutting inference "
                "latency ~40% and ensuring reliability.",
                "Designed and deployed a real-time fraud-detection service integrating engineered "
                "risk features, model evaluation, and monitoring, achieving ROC-AUC 0.93 while "
                "strengthening transaction-risk controls.",
                "Delivered an on-prem Arabic↔English document-translation platform that preserves "
                "layout and keeps sensitive data fully in-house, eliminating ~$120K/yr in "
                "third-party translation spend.",
                "Partnered with risk, compliance, and business stakeholders to define requirements, "
                "align on success metrics, and drive adoption of production AI systems across "
                "multiple teams.",
            ],
        ),
        Experience(
            "Software Engineer — MeeApps, İstanbul",
            "Feb 2023 – Jan 2024",
            [
                "Built a low-latency order-execution platform — including smart order-routing and "
                "execution algorithms — adopted by 23 brokerage firms managing $10M+ in "
                "portfolios, achieving microsecond-level execution.",
                "Engineered the ultra-low-latency execution path by optimizing ITCH, OUCH, and TCP "
                "protocols against co-located exchange servers, and built the full production stack "
                "(React/C#/C++ frontend, backend services, and live market-data feeds).",
                "Owned end-to-end system performance and reliability, sustaining 99.9% uptime "
                "under live trading load.",
            ],
        ),
        Experience(
            "Machine Learning Engineer — Schneider Electric, İstanbul",
            "Jul 2022 – Dec 2022",
            [
                "Built and deployed demand-forecasting and stock-out-risk models that reduced "
                "inventory gaps 12–15% during COVID supply shocks, directly improving fulfillment "
                "reliability.",
                "Engineered features from sales, supply-chain, and distributor data and built "
                "reproducible model pipelines with rigorous evaluation (cross-validation, holdout "
                "testing) for scalable deployment.",
                "Partnered with logistics stakeholders to define success metrics and operationalize "
                "forecasts into fulfillment planning.",
            ],
        ),
    ],
    education=[
        ("BASc, Electronics Engineering — Sabancı University, İstanbul", "2018 – 2023"),
        ("Exchange Semester, Electrical & Electronics Engineering — Universitat "
         "Politècnica de València (UPV), Spain", "2022"),
    ],
    skills=[
        ("AI Systems / GenAI", "LLM systems, RAG (hybrid retrieval, reranking, citation grounding), "
         "agentic workflows, tool / function calling, prompt & context engineering, structured outputs"),
        ("AI Engineering / LLMOps", "Automated evaluation (retrieval quality, grounding, "
         "hallucination mitigation), human review loops, observability & logging, latency "
         "optimization, reliability engineering"),
        ("Regulated AI", "Auditability, traceability, explainability, compliance & release governance"),
        ("Production / Platform", "FastAPI / REST APIs, backend & service architecture, model "
         "serving, Docker, Kubernetes, MLflow, monitoring"),
        ("ML Foundations", "Supervised & unsupervised learning, feature engineering, time-series "
         "forecasting, A/B testing"),
        ("Cloud & Languages", "Azure, AWS, SQL · Python; full-stack (React, C#, C++)"),
    ],
    selected_systems=[
        ("Enterprise RAG Platform", "900+ compliance documents; auditable, source-linked answers at 87% accuracy"),
        ("AI Email / Inquiry Assistant", "500+ requests/week automated; 70% manual-load reduction"),
        ("Credit Risk Report Generation Platform", "agentic generation of analyst-ready credit-risk reports"),
        ("Financial Analysis Agent Workflows", "multi-step LLM reasoning + tool calling over financial data"),
        ("OCR & Document Intelligence Platform", "7 extraction pipelines for Arabic/English ID & financial docs"),
        ("Arabic↔English Translation Platform", "on-prem, layout-preserving; ~$120K/yr third-party spend eliminated"),
    ],
    courses=(
        "Operationalizing LLMs on Azure (Duke) · Generative AI Applications with RAG & LangChain "
        "(IBM) · AI Agents (IBM) · Generative AI Techniques & Applications (Duke) · Machine "
        "Learning Specialization (Stanford) · TensorFlow in AI/ML/DL (DeepLearning.AI) · Deep "
        "Learning for Sequences & Time Series (DeepLearning.AI) · Visa Data Science Bootcamp"
    ),
    additional="Languages: English (professional)",
)
