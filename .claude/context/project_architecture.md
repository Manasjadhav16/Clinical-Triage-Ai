# Project Context: Clinical Triage AI Agent

## 1. Project Overview
The Clinical Triage AI Agent is a B2B Generative AI SaaS application designed to reduce administrative burnout in medical clinics. It acts as an autonomous digital intake nurse. It takes unstructured patient symptoms (text/chat), extracts core medical facts, evaluates symptom severity using multi-agent routing, and generates a structured, prioritized clinical note for a doctor's dashboard.

## 2. Core Architecture
This system utilizes a decoupled React/FastAPI architecture with a LangGraph multi-agent backend.
* **Frontend (Phase 2):** React (Vite) & Tailwind CSS (Doctor's Dashboard)
* **Backend (Current Phase):** FastAPI (REST endpoints)
* **Agentic Framework:** LangGraph (Stateful, multi-node routing)
* **Data Validation/Guardrails:** Pydantic (Strict JSON outputs are mandatory for frontend rendering)
* **LLM:** Anthropic Claude 3.5 Sonnet (via API)

## 3. End-to-End Pipeline
1. **Ingestion:** Patient submits raw, unstructured symptoms via a frontend form. FastAPI receives this payload at the `/intake` endpoint.
2. **Extraction (Agent 1 - Intake):** Parses the raw text. Extracts core facts: Chief Complaint, Duration, Pain Scale (1-10), and Associated Symptoms.
3. **Evaluation (Agent 2 - Clinical Analyst):** Analyzes the extracted facts against standard triage logic. Assigns a Priority Score (e.g., 1-Critical to 5-Non-Urgent) and flags potential red flags.
4. **Formatting (Agent 3 - Dashboard Router):** Takes the analyst's evaluation and forces it into a strict Pydantic JSON schema.
5. **Presentation:** FastAPI returns the structured JSON to the React frontend, populating the doctor's clinical dashboard.

## 4. Agent Roles & Specifications

### Agent 1: The Intake Agent
* **Input:** Raw patient text (e.g., "My chest has been hurting for 2 days and I feel dizzy.")
* **Role:** Acts as the data extractor. Strips away emotion and noise to find the clinical facts.
* **Output:** A structured dictionary of symptoms, duration, and pain levels.

### Agent 2: The Clinical Analyst
* **Input:** Extracted facts from Agent 1.
* **Role:** The reasoning engine. It compares the facts to standard medical triage protocols. It must err on the side of caution (e.g., chest pain = high priority).
* **Output:** A triage severity score and a brief medical rationale.

### Agent 3: The Dashboard Router
* **Input:** The reasoning output from Agent 2.
* **Role:** Strict data formatting. It ensures the final output perfectly matches the Pydantic schema expected by the frontend UI. It does no medical reasoning.

## 5. Target Directory Structure
Maintain this modular architecture as the project scales:

```text
clinical-triage-ai/
│
├── backend/                    # FastAPI + LangGraph Backend
│   ├── api/
│   │   └── main.py             # FastAPI application and REST endpoints
│   ├── agents/
│   │   ├── graph.py            # LangGraph state definition and node routing
│   │   ├── intake_agent.py     # Agent 1 logic
│   │   ├── analyst_agent.py    # Agent 2 logic
│   │   └── router_agent.py     # Agent 3 logic
│   ├── schemas/
│   │   └── models.py           # Pydantic models & LangGraph AgentState TypedDict
│   └── .env                    # API Keys (Anthropic)
│
├── frontend/                   # React SPA (To be built later)
├── requirements.txt            # Python dependencies
└── CLAUDE.md                   # Core directives and context

## 6. LangGraph State — `AgentState`
The shared state TypedDict passed between all LangGraph nodes:

| Field | Type | Description |
|---|---|---|
| `patient_id` | `str` | Unique session/patient UUID |
| `raw_input` | `str` | The initial unstructured text from the patient |
| `extracted_facts` | `dict` | Output of the Intake Agent |
| `triage_evaluation` | `dict` | Output of the Clinical Analyst (Score and Rationale) |
| `final_clinical_note` | `dict` | Strictly formatted JSON for the React UI |