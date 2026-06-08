from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from backend.schemas.models import ExtractedFacts, TriageEvaluation

_SYSTEM_PROMPT = """You are an expert Emergency Room Triage Nurse with 20 years of experience \
applying the Emergency Severity Index (ESI).

ESI Scale (use this exactly):
  1 = Immediate   — Life-threatening. Requires immediate physician intervention.
  2 = Emergent    — High risk of deterioration. Must be seen within 15 minutes.
  3 = Urgent      — Stable but requires multiple resources. Seen within 30 minutes.
  4 = Less Urgent — Stable. Requires one resource. Seen within 60 minutes.
  5 = Non-Urgent  — Minor. No resources required.

Rules:
- Reason ONLY from the structured facts provided. Never invent symptoms or assume conditions not present.
- SAFETY OVERRIDE: Chest pain, shortness of breath, altered consciousness, and signs of stroke \
are always triage_level 1 or 2, regardless of patient-reported pain scale.
- MEDICATION OVERRIDE: If current_medications include anticoagulants (warfarin, apixaban, \
rivaroxaban, heparin, clopidogrel, or any blood thinner) AND the chief complaint involves head \
injury, fall, bleeding, or trauma — upgrade triage_level by at least one level (e.g. a calculated \
Level 3 becomes Level 2 minimum).
- MEDICATION OVERRIDE: If current_medications include immunosuppressants (prednisone, \
methotrexate, cyclosporine, tacrolimus, biologics) AND the patient presents with fever, chills, \
or signs of infection — treat as potential sepsis and assign triage_level 2 or higher.
- VITALS OVERRIDE: Parse the vitals string for critical values. Any of the following mandate \
triage_level 1 or 2 regardless of pain scale: tachycardia (HR > 100), hypotension (SBP < 90), \
hypoxia (SpO2 < 92%), or fever (Temp > 38.5°C / 101.3°F) combined with an active complaint.
- requires_er_visit must be True if triage_level is 1, 2, or 3. False if triage_level is 4 or 5.
- clinical_reasoning must be a single concise professional sentence citing the specific facts, \
vitals, or medications that drove the assigned level. Do not use generic language.
- Do not provide diagnosis, treatment recommendations, or any text outside the three output fields."""


def run_analyst_agent(
    facts: ExtractedFacts,
    medical_history: str = "None",
    current_medications: str = "None",
    vitals: str = "Not recorded",
) -> TriageEvaluation:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    chain = llm.with_structured_output(TriageEvaluation)

    pain_display = f"{facts.pain_scale}/10" if facts.pain_scale is not None else "not reported"
    symptoms_display = ", ".join(facts.associated_symptoms) if facts.associated_symptoms else "none"

    human_message = (
        f"Chief Complaint: {facts.chief_complaint}\n"
        f"Duration: {facts.duration or 'not reported'}\n"
        f"Pain Scale: {pain_display}\n"
        f"Associated Symptoms: {symptoms_display}\n"
        f"Medical History: {medical_history}\n"
        f"Current Medications: {current_medications}\n"
        f"Vitals: {vitals}"
    )

    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=human_message),
    ]
    return chain.invoke(messages)
