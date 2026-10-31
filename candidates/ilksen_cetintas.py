"""İlkşen Çetintaş — executive CV (CHRO / Chief People Officer / ExCom).

Source of truth: her own CV (Ilksen_Cetintas_CV_ENG_2026.pdf). Rewritten
for an executive-search and Board audience (see
docs/ilksen_cetintas/RESEARCH_AND_SCORECARD.md for the research, personas,
scoring and the list of claims she must confirm before sending).

Rules applied:
  * No new personal metrics were invented. Every personal claim traces to
    her CV. Company context lines (sector, factories, IPO, award details)
    come from public sources cited in the research doc.
  * The repository is PUBLIC: phone, e-mail, photo and reference contact
    details are read from candidates/private/ (git-ignored) at build time.

Build:  python build_cv.py candidates/ilksen_cetintas.py
"""
from __future__ import annotations

import importlib.util
import os

from resume_builder import Job, Resume

# --- private data (git-ignored) ---------------------------------------------
_PRIV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "private", "ilksen_cetintas_private.py")
_priv = None
# RESUME_PUBLIC=1 builds the redacted version that is safe to commit.
if os.path.exists(_PRIV_PATH) and os.environ.get("RESUME_PUBLIC") != "1":
    _spec = importlib.util.spec_from_file_location("ilksen_private", _PRIV_PATH)
    _priv = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_priv)

LINKEDIN = "https://www.linkedin.com/in/ilk%C5%9Fen-%C3%A7etinta%C5%9F-b52a6920/"

_contact: list[tuple[str, str | None]] = [("Ankara, Türkiye", None)]
if _priv:
    _contact += [(_priv.PHONE, "tel:" + _priv.PHONE.replace(" ", "")),
                 (_priv.EMAIL, "mailto:" + _priv.EMAIL)]
_contact += [
    ("linkedin.com/in/ilkşen-çetintaş-b52a6920", LINKEDIN),
    ("Dual Turkish & EU citizen · open to international relocation", None),
]

RESUME = Resume(
    theme="executive",
    name="İlkşen Çetintaş",
    role="Chief Human Resources Officer · Executive Committee Member",
    tagline=("Builds HR from the ground up  ·  Prepares founder-led companies for growth and IPO  ·  "
             "Trusted partner to CEOs and Boards"),
    contact_segments=_contact,
    photo=getattr(_priv, "PHOTO", "") if _priv else "",
    metrics=[
        ("~5,000", "employees under Group HR at IC Holding"),
        ("4% → 25%", "women in tech roles in 1 year · EBRD Gold"),
        ("~2,000", "employees · 11 factories · CHRO since 2021"),
        ("IPO 2026", "led ŞA-RA's institutionalization to listing"),
    ],
    profile=(
        "CHRO and Executive Committee member with **25+ years** of HR leadership in industrial, "
        "defense, energy and global technology companies. Specializes in turning founder-led "
        "companies into professionally run corporations: led **ŞA-RA Group's institutionalization "
        "up to its 2026 Borsa İstanbul IPO**, ran HR for **~5,000 employees at IC Holding** and "
        "led HR at defense company **Nurol Teknoloji**. Trained at **Siemens** and **Turkish "
        "Aerospace (TAI)**. Guiding belief: HR earns its seat at the Board table when people "
        "decisions are **measurable, fair and tied to business results**. Targeting CHRO, Chief "
        "People Officer and Group HR Director roles in Türkiye and internationally."
    ),
    highlights=[
        "**Prepared ŞA-RA for its IPO:** led the company-wide institutionalization of a "
        "~2,000-employee, 11-factory group up to its **July 2026 Borsa İstanbul listing**, "
        "building HR governance, policies, grading, pay and performance systems **from the ground up**.",
        "**Raised women in technical roles from 4% to 25% in one year** at TREDAŞ, IC Holding's "
        "electricity distributor. The program won the **EBRD Gold Award** for Environmental & "
        "Social Best Practice (2019).",
        "**Linked workforce cost to production:** founded a Workforce Productivity & Planning Unit "
        "that compares **planned vs. actual production tonnage** with unit labor cost, so the Board "
        "makes **capacity decisions based on data**.",
        "**One fair pay system for ~5,000 employees:** introduced **Hay job evaluation**, common job "
        "grades and salary scales across **every IC Holding company**, from construction and energy "
        "to airports and tourism.",
        "**Ran HR as a business at Siemens:** built Siemens Communications Türkiye's HR department, "
        "played a key role in turning it into a **profit center**, and led a leadership program "
        "that became a **benchmark across Siemens Europe**.",
    ],
    awards=[
        ("2025", "**Exemplary Woman HR Marvel of the Year**, Global Business Conclave, London"),
        ("2024", "**Global 200 Power Leaders**, among senior executives from 42 countries, Dubai"),
        ("2019", "**EBRD Gold Award**, Environmental & Social Best Practice: led the TREDAŞ gender "
                 "initiative and was instrumental in securing the award"),
        ("2018", "**Ministry of Energy and Natural Resources Award**: among the top three most "
                 "successful businesswomen in mining and energy"),
    ],
    experience=[
        Job(
            company="ŞA-RA Group (ŞA-RA Enerji İnşaat Tic. ve San. A.Ş.)",
            location="Ankara",
            title="Chief Human Resources Officer (CHRO) · Executive Committee Member",
            dates="2021 – Present",
            context=("Energy-infrastructure manufacturer founded in 1985: steel structures, power-line "
                     "hardware and galvanizing; 11 factories, projects in 120+ countries, ~2,000 "
                     "employees. Listed on Borsa İstanbul in July 2026."),
            bullets=[
                "**Road to IPO:** led the company-wide institutionalization and culture change that "
                "brought the group to its **2026 public listing**, building HR policies, processes "
                "and systems **from the ground up**.",
                "**HR as a strategic function:** moved HR from approving paperwork to a function "
                "accountable for **governance, productivity and business results**.",
                "**Board partner:** prepare productivity, workforce-cost and risk analyses that help "
                "the **Board and Executive Committee** decide on workforce and capacity.",
                "**Productivity unit:** founded and lead the Workforce Productivity & Planning Unit, "
                "linking **production tonnage, unit labor cost and workforce mix**.",
                "**Fair pay:** built a **grade- and band-based salary structure** for all Group "
                "companies, checked every role against it and proposed adjustments to improve "
                "**internal pay equity**.",
                "**Pay for performance:** designed goal scorecards (department, shared and personal "
                "goals) and a **variable pay model** that links bonuses to results, competencies "
                "and talent reviews.",
                "**Digital HR:** built an **e-HR platform inside the company ERP**, bringing goals, "
                "competency assessments and approvals into one system.",
                "**Talent and governance:** set up workforce planning, recruitment, **succession**, "
                "career planning and leadership development; built an HR governance framework in "
                "line with labor law; prepare the annual HR budget.",
            ],
        ),
        Job(
            company="Nurol Teknoloji A.Ş.",
            location="Ankara",
            title="Chief Human Resources Officer (CHRO)",
            dates="2019 – 2021",
            context=("Defense-technology company of Nurol Holding: ballistic ceramics and armor for "
                     "personnel, vehicles and aircraft."),
            bullets=[
                "**Defense HR:** led HR strategy in a tightly regulated defense company with **large "
                "blue-collar teams**, keeping people plans in step with growth and innovation goals.",
                "**Succession:** built performance, talent and reward systems that strengthened the "
                "**leadership pipeline for critical technical roles**; introduced competency-based "
                "learning.",
                "**Early careers and diversity:** launched diversity-focused internships and "
                "**university–industry programs** to grow the early-career talent pipeline.",
                "**HR technology:** played a direct role in SAP integration and the **SAP "
                "SuccessFactors** rollout.",
            ],
        ),
        Job(
            company="IC Holding (IC İbrahim Çeçen Yatırım Holding)",
            location="Ankara",
            title="Deputy General Manager, Human Resources",
            dates="2013 – 2019",
            context=("Diversified Turkish group: construction and infrastructure (incl. the Yavuz Sultan "
                     "Selim Bridge and Northern Marmara Motorway), energy (TREDAŞ), airports, tourism "
                     "and industry; ~5,000 employees."),
            bullets=[
                "**Gender diversity:** led the TREDAŞ initiative that raised women in technical roles "
                "from **4% to 25% in one year** (**EBRD Gold Award 2019**).",
                "**Job evaluation:** ran **Hay job evaluations in all holding companies** and set common "
                "job grades and salary scales for consistent, fair pay decisions.",
                "**Workforce cost:** led HR strategy and **workforce cost planning**; prepared HR budgets "
                "(salaries, variable pay, social security, severance, benefits, training).",
                "**Performance and reward:** designed competency management and **variable pay "
                "scorecards** that link performance directly to reward.",
                "**HR digitalization:** led the **SAP-based HR rollout** and workforce analytics for "
                "clearer data and better decisions.",
            ],
        ),
        Job(
            company="TED University",
            location="Ankara",
            title="HR Director",
            dates="2011 – 2013",
            context=("Foundation university of the Turkish Education Association (TED); joined before "
                     "its 2012 academic launch."),
            bullets=[
                "Built the university's **HR function and governance from scratch** as part of the "
                "founding team.",
            ],
        ),
        Job(
            company="Swissôtel Ankara",
            location="Ankara",
            title="HR Director · Executive Committee Member",
            dates="2009 – 2011",
            context="Five-star hotel of the Swissôtel Hotels & Resorts brand.",
            bullets=[
                "Led talent development and change programs as a member of the hotel's "
                "**Executive Committee**.",
            ],
        ),
        Job(
            company="Siemens Communications, Türkiye",
            location="",
            title="Group Human Resources Manager",
            dates="1996 – 2006",
            context=("Siemens Industries Inc.: Siemens' telecommunications business in Türkiye "
                     "(carrier networks, enterprise networks, mobile devices)."),
            bullets=[
                "**HR as a profit center:** set up and led the HR department; played a key role in "
                "turning it from a service unit into a **profit center** with internal service "
                "agreements and pricing.",
                "**Leadership Excellence:** led the Siemens Leadership Excellence program in Türkiye, "
                "which became a **benchmark across Siemens Europe**.",
                "**Reward:** led company-wide **job evaluation (CRG, Hay)**, built grade- and band-based "
                "pay structures and linked scorecards to variable pay.",
                "**Talent systems:** set up **assessment and development centers**, onboarding and "
                "outplacement programs; rolled out the global recruitment portal in Türkiye; "
                "contributed to SAP HR integration.",
            ],
        ),
        Job(
            company="Turkish Aerospace Industries (TAI)",
            location="Ankara",
            title="Senior HR Lead",
            dates="1988 – 1996",
            context="Türkiye's national aerospace company, founded in 1984 for F-16 co-production.",
            bullets=[
                "Contributed to HR policy for job evaluation, salary scales, wage policy, salary "
                "surveys, performance and reward; ran appraisal and development workshops for "
                "first-line and middle managers.",
            ],
        ),
    ],
    approach=[
        "**Institutions outlast founders:** clear governance and succession let a company grow "
        "(**ŞA-RA, road to IPO**).",
        "**Measure what matters:** people decisions rest on data (**Workforce Productivity Unit**).",
        "**Fair systems build trust:** transparent grades, goals and rewards (**IC Holding, Siemens, ŞA-RA**).",
        "**HR answers for results:** run HR like a business (**Siemens HR as a profit center**).",
        "**Diversity with targets:** inclusion managed like any KPI (**4% → 25%, EBRD Gold**).",
    ],
    competencies=[
        "People & HR Strategy", "HR Operating Model Design", "Organizational Effectiveness",
        "Business & Culture Transformation", "Change Management", "Board & Stakeholder Management",
        "HR Governance & People Risk", "Compensation & Benefits", "Reward Strategy & Total Rewards",
        "Job Evaluation (Hay, CRG)", "Grading & Salary Structures", "Internal Pay Equity",
        "Performance & Variable Pay", "Strategic Workforce Planning", "Workforce Cost & Productivity",
        "Succession & Career Planning", "Talent Management", "Leadership Development",
        "Culture & Employee Engagement", "Diversity, Equity & Inclusion", "Talent Acquisition & Early Careers",
        "HR Digital Transformation & HRIS", "SAP & SAP SuccessFactors", "People Analytics",
        "Employment Law Compliance", "Multi-site & Blue-collar Workforces", "Assessment & Development Centers",
    ],
    education=[
        ("**Middle East Technical University (METU)**, Bachelor's Degree in Management",
         "Ankara"),
    ],
    details=[
        ("Languages", "Turkish (native)  ·  English (advanced)  ·  German (good working proficiency)"),
        ("Mobility", "Dual Turkish & EU citizen; open to relocation within Türkiye and internationally"),
    ],
    references=(getattr(_priv, "REFERENCES", "") if _priv else "") or
               "Senior references (TED, Siemens) available on request.",
    keywords=("CHRO, Chief Human Resources Officer, Executive Committee, Board partner, HR strategy, organizational transformation, "
              "reward, job evaluation, Hay, CRG, salary structure, pay equity, performance management, "
              "variable pay, workforce planning, productivity, succession, leadership development, "
              "DEI, HR digitalization, SAP SuccessFactors, governance, Türkiye"),
    headings={"profile": "Executive Profile", "highlights": "Signature Achievements"},
    basename="Ilksen_Cetintas_CHRO",
)
