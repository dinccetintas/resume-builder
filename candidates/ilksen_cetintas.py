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
    tagline=("Organizational transformation  ·  Reward & job architecture  ·  "
             "Board partner on workforce cost, productivity and people risk"),
    contact_segments=_contact,
    photo=getattr(_priv, "PHOTO", "") if _priv else "",
    metrics=[
        ("~5,000", "employees in Group HR remit at IC Holding"),
        ("4% → 25%", "women in tech roles in 1 year · EBRD Gold"),
        ("~2,000", "employees · 11 factories · CHRO & ExCom since 2021"),
        ("BIST 2026", "ŞA-RA listed on Borsa İstanbul, July 2026"),
    ],
    profile=(
        "CHRO and Executive Committee member with 25+ years in industrial, defense and global "
        "technology groups, turning founder-led businesses into institutions. At **ŞA-RA Group** (~2,000 employees, 11 factories; listed on Borsa İstanbul "
        "in 2026) built HR governance, group-wide grading and pay, and a productivity unit that "
        "links labor cost to production tonnage for Board capacity decisions. Previously Deputy "
        "GM HR of **IC Holding** (~5,000 employees), leading the gender initiative behind an "
        "EBRD Gold Award, then CHRO of defense company **Nurol Teknoloji**. Trained at **Siemens** "
        "and **Turkish Aerospace (TAI)**. Targeting CHRO, Chief People Officer and Group HR "
        "Director roles in Türkiye and internationally."
    ),
    highlights=[
        "**Award-winning gender inclusion:** led the initiative that raised women in technical "
        "roles from 4% to 25% within one year at TREDAŞ, IC Holding's electricity distributor; "
        "the program won the EBRD Gold Award for Environmental & Social Best Practice (2019).",
        "**Institutionalized a ~2,000-employee, 11-factory group** (listed on Borsa İstanbul in "
        "July 2026): built ŞA-RA's HR operating model, governance, grading and pay structure and "
        "people systems from the ground up.",
        "**Productivity managed like a P&L line:** founded a Workforce Productivity & Planning "
        "Unit that ties planned vs. actual production tonnage to unit labor cost and workforce "
        "mix, giving the Board a fact base for capacity decisions.",
        "**One pay logic for ~5,000 employees:** Hay-based job evaluation across every IC Holding "
        "company, with a common grading framework and salary scales to support consistent pay "
        "decisions and internal equity across construction, energy, airports and tourism.",
        "**HR as a business at Siemens Communications Türkiye:** built the HR function, played a "
        "key role in turning it into a profit center through internal service agreements and "
        "pricing, and led the Siemens Leadership Excellence program that became a benchmark "
        "across Siemens Europe.",
    ],
    experience=[
        Job(
            company="ŞA-RA Group (ŞA-RA Enerji İnşaat Tic. ve San. A.Ş.)",
            location="Ankara",
            title="Chief Human Resources Officer (CHRO) · Executive Committee Member",
            dates="2021 – Present",
            context=("Energy-infrastructure manufacturer and contractor founded in 1985: steel structures, "
                     "transmission hardware and galvanizing; 11 factories, projects in 120+ countries; "
                     "~2,000 employees. Listed on Borsa İstanbul in July 2026."),
            bullets=[
                "**Transformation:** lead institutionalization and culture change, building HR "
                "policies, structures and people systems from the ground up and repositioning HR from "
                "approvals to a strategic function accountable for governance, productivity and "
                "organizational effectiveness.",
                "**Talent systems:** group-wide workforce planning, recruitment, succession, career "
                "planning and leadership development across factories and central functions.",
                "**Board partnership:** strategic partner to the Board and Executive Committee, "
                "preparing the productivity, workforce-cost and people-risk analyses behind "
                "workforce and capacity decisions.",
                "**Workforce productivity:** founded and lead the Workforce Productivity & Planning "
                "Unit; designed a planning framework linking planned vs. actual production tonnage, "
                "unit labor cost and workforce composition across heavy industrial operations.",
                "**Reward architecture:** built a grade- and band-based salary structure (minimum, "
                "midpoint, maximum per grade) across all Group companies, positioned every role "
                "against it and proposed salary adjustments to improve internal pay equity "
                "(compensation & benefits).",
                "**Pay for performance:** designed scorecard-based management by objectives "
                "(departmental goal pools, shared cross-functional goals, weighted individual "
                "scorecards with evidence requirements) and a variable-pay framework combining "
                "scorecard, competency and talent-matrix results, to support consistent, performance-based bonus decisions.",
                "**HR digitalization:** designed and implemented an e-HR platform inside the company "
                "ERP, putting objectives, competency assessments and approval workflows on one system.",
                "**Governance & cost:** brought labor-law compliance and people risk under one HR "
                "governance framework; prepare the annual HR budget (salaries, bonuses, statutory "
                "contributions, severance, benefits, training, consultancy).",
            ],
        ),
        Job(
            company="Nurol Teknoloji A.Ş.",
            location="Ankara",
            title="Chief Human Resources Officer (CHRO)",
            dates="2019 – 2021",
            context=("Defense-technology company of Nurol Holding: advanced ballistic ceramics and "
                     "armor systems for personnel, vehicles and aircraft."),
            bullets=[
                "**Succession for critical roles:** led HR strategy in defense technology and built "
                "performance, talent-development and reward systems that strengthened the "
                "leadership pipeline and succession readiness for critical technical roles; "
                "introduced competency-based learning frameworks to improve role readiness.",
                "**Regulated operations:** managed large blue-collar workforces and regulatory "
                "compliance in a highly controlled defense environment.",
                "**Early-career & diversity:** launched diversity-focused internships and "
                "university–industry programs, expanding the early-career talent pipeline and "
                "improving workforce diversity indicators.",
                "**HR technology:** played a direct role in SAP integration and the implementation of "
                "SAP SuccessFactors.",
            ],
        ),
        Job(
            company="IC Holding (IC İbrahim Çeçen Yatırım Holding)",
            location="Ankara",
            title="Deputy General Manager, Human Resources",
            dates="2013 – 2019",
            context=("Diversified Turkish conglomerate: construction & infrastructure (incl. the Yavuz "
                     "Sultan Selim Bridge and Northern Marmara Motorway), energy generation and "
                     "distribution (TREDAŞ), airports, tourism and industry; ~5,000 employees in HR remit."),
            bullets=[
                "**Gender inclusion:** led the TREDAŞ initiative that lifted women in technical roles "
                "from 4% to 25% in one year (EBRD Gold Award 2019).",
                "**Job architecture:** ran Hay-based job evaluation across all holding companies "
                "(know-how, problem solving, decision authority, management scope and financial "
                "impact) and set job grades and salary scales on one common framework, enabling "
                "consistent pay decisions and internal equity Group-wide.",
                "**Workforce cost:** directed HR strategy and workforce-cost planning; prepared HR "
                "budgets for salaries, variable pay, statutory contributions, termination costs, "
                "benefits, training and consultancy.",
                "**Pay for performance:** designed corporate competency management and "
                "variable-compensation scorecards linking performance outcomes directly to reward.",
                "**HR digitalization:** led SAP-based HR process implementation and workforce "
                "analytics, improving data transparency and management decision-making.",
            ],
        ),
        Job(
            company="TED University",
            location="Ankara",
            title="HR Director",
            dates="2011 – 2013",
            context=("Foundation university established by the Turkish Education Association (TED); "
                     "joined during its establishment, ahead of the 2012 academic launch."),
            bullets=[
                "Built the university's HR function and people-governance framework from inception, "
                "as part of the establishment team.",
            ],
        ),
        Job(
            company="Swissôtel Ankara",
            location="Ankara",
            title="HR Director · Executive Committee Member",
            dates="2009 – 2011",
            context="Five-star luxury hotel of the Swissôtel Hotels & Resorts brand.",
            bullets=[
                "Led talent development and change initiatives within global hospitality "
                "operations as a member of the hotel's Executive Committee.",
            ],
        ),
        Job(
            company="Siemens Communications, Türkiye",
            location="",
            title="Group Human Resources Manager",
            dates="1996 – 2006",
            context=("Siemens Industries Inc.: Siemens' telecommunications business in Türkiye, covering "
                     "carrier infrastructure, enterprise networks and mobile devices."),
            bullets=[
                "**HR as a business:** established and led the HR department; played a key role in "
                "transforming it from a service unit into a profit center through internal service "
                "agreements and pricing, strengthening cost transparency and accountability.",
                "**Leadership:** led the Siemens Leadership Excellence program in Türkiye, which became "
                "a benchmark across Siemens Europe.",
                "**Reward:** led company-wide job evaluation (CRG, Hay), built grade- and "
                "band-based pay structures and tied corporate scorecards to variable pay.",
                "**Talent systems:** set up assessment and development centers, onboarding and "
                "outplacement programs; coordinated the rollout of the global recruitment portal "
                "across Turkish operations; contributed directly to SAP HR integration.",
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
                "surveys, performance management and reward; delivered appraisal and development "
                "workshops (HR management, business ethics) for first-line and middle managers.",
            ],
        ),
    ],
    awards=[
        ("2025", "**Exemplary Woman HR Marvel of the Year**, Global Business Conclave, London "
                 "(White Page International)."),
        ("2024", "**Global 200 Power Leaders**, selected among senior executives from 42 "
                 "countries, Dubai (White Page International)."),
        ("2019", "**EBRD Gold Award, Environmental & Social Best Practice**, won by TREDAŞ / "
                 "IC İçtaş Elektrik for its gender-inclusion program; led the initiative and was "
                 "instrumental in securing the award."),
        ("2018", "**Ministry of Energy and Natural Resources Award**: selected among the top three "
                 "most successful businesswomen in mining and energy."),
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
