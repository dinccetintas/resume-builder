"""Dinc Cetintas — tailored for the Zettafleet "Senior LLM Data Scientist"
(forward-deployed) role: LLM fine-tuning + evaluation, data pipelines that turn
raw enterprise data into training-/retrieval-ready datasets (cleaning,
filtering, deduplication), RAG over vector databases, Python, strong ownership,
and partnering with product/data teams.

Scoped to candidate-confirmed facts only. Excluded by the candidate: synthetic
data generation, DPO/RL/continued pre-training, and external-customer
("forward-deployed") claims — so none appear here. Headline kept as
"Senior AI Engineer" by the candidate's choice.
Build:  python build_cv.py candidates/dinc_cetintas_llm_data_scientist.py
"""
from resume_builder import Job, Resume

EMAIL = "dinccetintas24@gmail.com"

RESUME = Resume(
    name="DINC CETINTAS",
    role="Senior LLM Data Scientist",
    contact_segments=[
        ("EU Citizen, Cyprus", None),
        (EMAIL, "mailto:" + EMAIL),
        ("+974 51444964", None),
        ("LinkedIn", "https://www.linkedin.com/in/dinc-cetintas-79a04b205/"),
        ("GitHub", "https://github.com/dinccetintas"),
    ],
    profile=(
        "Senior LLM Data Scientist with hands-on experience in LLM fine-tuning, evaluation, and "
        "data-pipeline engineering in regulated financial environments. I turn raw, unstructured "
        "enterprise data into training- and retrieval-ready datasets (cleaning, filtering, "
        "deduplication), fine-tune and evaluate transformer models (GPT, T5, BERT), and build "
        "RAG systems over vector databases — all in Python. I partner closely with product and "
        "data teams to translate requirements into working technical designs, take strong "
        "ownership of outcomes, and explain complex trade-offs clearly to executives and "
        "engineers alike."
    ),
    experience=[
        Job(
            title="LLM Data Scientist / AI Engineer — Commercial Bank of Qatar, Doha",
            dates="Jan 2024 – Present",
            bullets=[
                "Built data pipelines that turn raw, unstructured enterprise data into training- "
                "and retrieval-ready datasets — cleaning, filtering, deduplication, and "
                "structured extraction across 900+ compliance and financial documents.",
                "Fine-tuned and evaluated transformer models (GPT, T5, BERT), refining datasets "
                "and prompts against automated quality benchmarks (retrieval quality, grounding, "
                "hallucination) with human review loops before every release.",
                "Designed RAG systems over vector databases — hybrid BM25 + vector retrieval, "
                "reranking, citation grounding, and context engineering (tokenization-aware "
                "chunking and context-window budgeting) — reaching 87% source-linked accuracy "
                "over 900+ documents.",
                "Built a reusable AI platform (shared retrieval/embeddings service, evaluation "
                "framework, and model-serving API) consumed by 7+ teams, cutting time-to-delivery "
                "for each new use case.",
                "Partnered with product managers, data specialists, and business stakeholders to "
                "understand requirements and roadmaps, translate business concepts into technical "
                "designs, and feed insights back into the roadmap — owning use cases end-to-end "
                "across multiple squads.",
                "Shipped clean, maintainable Python integrating models into live banking systems "
                "(FastAPI/REST serving), with production monitoring and feedback loops that detect "
                "regressions and route them back into evaluation and dataset refinement.",
                "Developed production LLM workflows for credit-risk and financial analysis — "
                "retrieval, tool calling, LLM reasoning, and JSON-schema-validated outputs — "
                "producing structured, analyst-ready reports.",
                "Designed and deployed a fraud-detection model (ROC-AUC 0.93) with engineered "
                "features, evaluation, and monitoring, strengthening transaction-risk controls.",
            ],
        ),
        Job(
            title="Software Engineer — MeeApps, İstanbul",
            dates="Feb 2023 – Jan 2024",
            bullets=[
                "Built a low-latency order-execution platform — smart order-routing and execution "
                "algorithms — adopted by 23 brokerage firms managing $10M+ in portfolios, "
                "achieving microsecond-level execution.",
                "Delivered the full production stack (React/C#/C++ frontend, backend services, "
                "and live market-data feeds) in a cross-functional team, optimizing ITCH, OUCH, "
                "and TCP protocols against co-located exchange servers for ultra-low latency.",
                "Owned end-to-end system performance and reliability, sustaining 99.9% uptime "
                "under live trading load.",
            ],
        ),
        Job(
            title="Data Scientist — Schneider Electric, İstanbul",
            dates="Jul 2022 – Dec 2022",
            bullets=[
                "Built and deployed demand-forecasting and stock-out-risk models in Python "
                "(pandas, scikit-learn) that reduced inventory gaps 12–15% during COVID supply "
                "shocks.",
                "Engineered features from sales, supply-chain, and distributor data and built "
                "reproducible pipelines with rigorous evaluation (cross-validation, holdout "
                "testing) for scalable deployment.",
                "Partnered with logistics stakeholders to define success metrics and "
                "operationalize forecasts into fulfillment planning.",
            ],
        ),
    ],
    education=[
        ("BASc, Electronics Engineering — Sabancı University, İstanbul", "2018 – 2023"),
        ("Exchange Semester, Electrical & Electronics Engineering — Universitat "
         "Politècnica de València (UPV), Spain", "2022"),
    ],
    skills=[
        ("LLM & Model Development", "Fine-tuning (SFT), evaluation & dataset refinement, "
         "transformers (GPT / T5 / BERT), tokenization, context engineering, prompt versioning"),
        ("Data / ML Engineering", "Training- & retrieval-ready data pipelines (cleaning, "
         "filtering, deduplication, structured extraction), feature engineering, RAG, vector "
         "databases"),
        ("Evaluation / LLMOps", "Automated evaluation (retrieval quality, grounding, "
         "hallucination), human review loops, production monitoring & feedback loops, model "
         "routing & fallback strategies"),
        ("Languages & Tools", "Python (pandas, scikit-learn), SQL, FastAPI, Docker, Kubernetes, "
         "MLflow; Azure, AWS"),
        ("Domain", "Financial services, regulatory compliance (auditability, traceability), risk"),
    ],
    selected_systems=[
        ("Enterprise RAG Platform", "hybrid retrieval + reranking over 900+ docs on a vector DB; 87% source-linked accuracy"),
        ("Enterprise Data Pipelines (Training & Retrieval)", "cleaning, filtering, deduplication & structured extraction into model-ready datasets"),
        ("Model Evaluation Framework", "retrieval-quality, grounding & hallucination benchmarks; human review; release gating"),
        ("Credit Risk & Financial-Analysis LLM Workflows", "tool calling + LLM reasoning + schema-validated, analyst-ready reports"),
        ("Real-Time Fraud-Detection Model", "ROC-AUC 0.93; engineered features, evaluation, monitoring"),
    ],
    courses=(
        "Operationalizing LLMs on Azure (Duke) · Generative AI Applications with RAG & LangChain "
        "(IBM) · AI Agents (IBM) · Generative AI Techniques & Applications (Duke) · Machine "
        "Learning Specialization (Stanford) · TensorFlow in AI/ML/DL (DeepLearning.AI) · Deep "
        "Learning for Sequences & Time Series (DeepLearning.AI) · Visa Data Science Bootcamp"
    ),
    additional="Languages: English (professional)",
    basename="Dinc_Cetintas_LLM_Data_Scientist",
)
