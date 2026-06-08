Markdown
# Multi-Agent Clinical Triage & Decision Engine

An enterprise-grade, full-stack medical triage application that transforms unstructured patient symptom narratives into highly structured, deterministic clinical insights. 

Powered by a fault-tolerant **LangGraph State Machine**, the system choreographs a sequential multi-agent pipeline using **Google Gemini 2.5 Flash** to extract patient data via **Pydantic** schemas, execute safety override triage logic using the **Emergency Severity Index (ESI)** framework, and synthesize high-density medical briefings optimized for emergency department physicians.

---

## 🏗️ System Architecture & Workflow

The application operates as a unified state machine where data flows through a strict, typed state graph, ensuring contract parity between the frontend, API layer, and autonomous agents.

[Patient UI] ──(HTTP POST)──> [FastAPI Endpoint]
│
[LangGraph State Machine]
│
┌───────────────────────────┴───────────────────────────┐
▼                                                       ▼
┌───────────────┐                                       ┌───────────────┐
│  node_intake  │ ──(Extracts JSON via Pydantic SAMPLE)─>│    Agent 1    │
└───────────────┘                                       └───────────────┘
│
▼
┌───────────────┐                                       ┌───────────────┐
│ node_analyst  │ ──(Applies ESI & Clinical Overrides)─>│    Agent 2    │
└───────────────┘                                       └───────────────┘
│
▼
┌───────────────┐                                       ┌───────────────┐
│  node_router  │ ──(Compiles Specialist & MD Notes)───>│    Agent 3    │
└───────────────┘                                       └───────────────┘
│
▼
[Unified IntakeResponse] ──(JSON)──> [React / Vite Dashboard]


### The 3-Agent Assembly Line:
1. **Agent 1 (The Extractor):** Ingests raw patient text alongside the clinical **SAMPLE** history framework (Age, Sex, History, Meds, Allergies, Vitals) and strips out narrative fluff to build an immutable, structured data contract.
2. **Agent 2 (The Analyst):** Acts as an autonomous triage nurse. It evaluates the structured facts against standard ESI criteria and executes deterministic clinical overrides (e.g., immediate escalation to Level 1 for head trauma combined with anticoagulant therapy).
3. **Agent 3 (The Router / Scribe):** Synthesizes clinical facts and triage evaluations into an executive summary, maps the patient to the correct medical specialist (e.g., Cardiologist, Dentist), extracts key red flags, and compiles a physician-grade Markdown briefing note using standard medical shorthand (`c/o`, `diaphoresis`, `presyncope`).

---

## ⚡ Tech Stack

### Backend
* **Orchestration:** LangGraph (State Machine Agent Architecture)
* **Framework:** FastAPI (Asynchronous Python Web API)
* **LLM Engine:** ChatGoogleGenerativeAI (`gemini-2.5-flash` at `temperature=0`)
* **Data Validation:** Pydantic v2 (Strict typing and compile-time data guarantees)

### Frontend
* **Core:** React 18 + Vite 5 (Lightning-fast client development)
* **Styling:** Tailwind CSS v3 (Epic/Cerner inspired modern healthcare layout)
* **Features:** `react-to-pdf` (One-click professional PDF export), Lucide React (Icons), & React Markdown

---

## 🛠️ Installation & Local Setup

### Prerequisites
* Python 3.10+
* Node.js v18+
* Gemini API Key

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
echo "GOOGLE_API_KEY=your_gemini_api_key_here" > .env

# Launch the FastAPI dev server
uvicorn api.main:app --reload




2. Frontend Setup
Bash
# Open a new terminal window and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Launch the Vite development server
npm run dev