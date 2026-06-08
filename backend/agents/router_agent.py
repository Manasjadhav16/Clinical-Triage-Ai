from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from backend.schemas.models import ClinicalNote, ExtractedFacts, TriageEvaluation

_SYSTEM_PROMPT = """You are an Expert Medical Scribe and Case Router. Your sole job is to compile \
the provided clinical data into a professional, structured note for a doctor's dashboard.

Rules:
- Do NOT invent patient biographical details, diagnoses, or treatments not present in the input data.
- Use professional clinical language appropriate for a physician reader (e.g. c/o, h/o, ESI).
- executive_summary: One sentence only. First clause: the patient's presentation. \
Second clause: the triage disposition and ER requirement.
- red_flags: A list of discrete clinical warning sign strings extracted directly from the data. \
Return an empty list if no warning signs are present. Never infer flags not supported by the facts.
- recommended_specialist: A single specific specialist title. Choose based on the chief complaint, \
associated symptoms, medical history, and triage level. Use these mappings as a guide:
    · Chest pain, palpitations, syncope                         → Cardiologist
    · Head injury, stroke signs, altered consciousness           → Neurologist or Neurosurgeon
    · Shortness of breath, hypoxia, respiratory symptoms         → Pulmonologist
    · Abdominal pain, GI bleeding, nausea/vomiting              → Gastroenterologist
    · Trauma, fractures, musculoskeletal injury                  → Orthopedic Surgeon
    · Facial injury, dental/jaw trauma                          → Maxillofacial Surgeon
    · Urinary symptoms, renal complaints                        → Urologist
    · Psychiatric emergency, suicidal ideation                  → Psychiatrist
    · Pediatric presentations (age < 18)                        → Pediatric Emergency Physician
    · High-acuity undifferentiated or multi-system emergency    → Emergency Medicine Physician
    · Minor or low-acuity without clear specialty               → General Practitioner
  Return exactly one specialist title as a plain string. No departments. No conjunctions. \
Never return "None" or leave blank.
- formatted_dashboard_note: A Markdown string with exactly these four sections in this order:
    ## Patient Demographics & History
    ## Presenting Illness
    ## Clinical Metrics
    ## Triage Assessment
  Rules for each section:
  - ## Patient Demographics & History: ALWAYS the first section. List Age, Sex, Medical History, \
Current Medications, Allergies, and Vitals on separate labelled lines. Never omit this section \
even if values are "None" or "Not recorded".
  - ## Presenting Illness: Chief complaint, duration, and associated symptoms in clinical shorthand.
  - ## Clinical Metrics: Pain scale and any objective vitals data provided.
  - ## Triage Assessment: ESI level with label, ER visit requirement, and clinical reasoning.
  Keep each section concise and dense — this is a physician's at-a-glance reference."""

_ESI_LABELS = {1: "Immediate", 2: "Emergent", 3: "Urgent", 4: "Less Urgent", 5: "Non-Urgent"}


def run_router_agent(
    facts: ExtractedFacts,
    evaluation: TriageEvaluation,
    patient_age: int,
    patient_sex: str,
    medical_history: str = "None",
    current_medications: str = "None",
    allergies: str = "None",
    vitals: str = "Not recorded",
) -> ClinicalNote:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    chain = llm.with_structured_output(ClinicalNote)

    pain_display = f"{facts.pain_scale}/10" if facts.pain_scale is not None else "not reported"
    symptoms_display = ", ".join(facts.associated_symptoms) if facts.associated_symptoms else "none"
    esi_label = _ESI_LABELS.get(evaluation.triage_level, str(evaluation.triage_level))
    er_display = "Yes" if evaluation.requires_er_visit else "No"

    human_message = (
        f"--- PATIENT DEMOGRAPHICS & HISTORY ---\n"
        f"Age: {patient_age}\n"
        f"Sex: {patient_sex}\n"
        f"Medical History: {medical_history}\n"
        f"Current Medications: {current_medications}\n"
        f"Allergies: {allergies}\n"
        f"Vitals: {vitals}\n\n"
        f"--- EXTRACTED FACTS ---\n"
        f"Chief Complaint: {facts.chief_complaint}\n"
        f"Duration: {facts.duration or 'not reported'}\n"
        f"Pain Scale: {pain_display}\n"
        f"Associated Symptoms: {symptoms_display}\n\n"
        f"--- TRIAGE EVALUATION ---\n"
        f"Triage Level: {evaluation.triage_level} ({esi_label})\n"
        f"Requires ER Visit: {er_display}\n"
        f"Clinical Reasoning: {evaluation.clinical_reasoning}"
    )

    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=human_message),
    ]
    return chain.invoke(messages)
