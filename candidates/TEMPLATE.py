"""TEMPLATE candidate — copy this file to candidates/<name>.py and fill it in.

HOW TO USE
  1. cp candidates/TEMPLATE.py candidates/jane_doe.py
  2. Run the intake interview in INTAKE.md with the candidate; fill fields below
     with ONLY confirmed facts (see METHODOLOGY.md — never invent metrics).
  3. python build_cv.py candidates/jane_doe.py   →  out/<basename>.{docx,pdf,md}

Rules of thumb (full playbook in METHODOLOGY.md):
  • Target the role you want, not the past job title.
  • Each bullet: business problem -> architecture/how -> production impact -> metric.
  • Lead with ownership verbs (Architected / Owned / Designed / Built / Deployed).
  • Mechanism behind every metric ("cut latency ~40% THROUGH caching + ...").
  • Any number you can't defend in an interview: get the real one or drop it.
  • Empty lists/strings are skipped in the output, so delete what doesn't apply.
"""
from resume_builder import Job, Resume

EMAIL = "name@example.com"

RESUME = Resume(
    name="FIRST LAST",
    role="AI Engineer",  # the TARGET role, not necessarily the last title
    contact_segments=[
        ("City, Country", None),
        (EMAIL, "mailto:" + EMAIL),
        ("+000 000 0000", None),
        ("LinkedIn", "https://www.linkedin.com/in/your-handle/"),
        ("GitHub", "https://github.com/your-handle"),
    ],
    # 3–4 sentences: who you are + the strongest, most specific differentiator.
    profile=(
        "<One-paragraph positioning statement. Name the role, the domain, and the "
        "end-to-end ownership + the single biggest differentiator.>"
    ),
    experience=[
        Job(
            title="Target-aligned Title — Company, City",
            dates="Mon YYYY – Present",
            bullets=[
                "<Problem -> how you architected it -> who used it -> measurable outcome.>",
                "<A real failure you debugged & fixed, and the monitoring/feedback that followed.>",
                "<Platform/ownership or stakeholder-leadership bullet, if true.>",
            ],
        ),
    ],
    education=[
        ("Degree — University, City", "YYYY – YYYY"),
    ],
    skills=[
        ("AI Systems / GenAI", "<only tools/techniques actually used>"),
        ("AI Engineering / LLMOps", "<evaluation, monitoring, serving, routing/fallbacks ...>"),
        ("Production / Platform", "<APIs, Docker, K8s, CI/CD ...>"),
        ("Programming", "<languages>"),
    ],
    # Optional 20-second scan section: the production systems this person built.
    selected_systems=[
        # ("System Name", "one-line scope + metric"),
    ],
    courses="<comma/·-separated relevant certifications — most role-relevant first>",
    additional="Languages: ...",
    basename="First_Last_AI_Engineer",
)
