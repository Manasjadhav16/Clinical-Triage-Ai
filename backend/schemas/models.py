from typing import Optional, TypedDict
from pydantic import BaseModel, Field


class PatientIntake(BaseModel):
    patient_name: str
    patient_age: int
    patient_sex: str
    raw_symptoms: str
    medical_history: str = "None"
    current_medications: str = "None"
    allergies: str = "None"
    vitals: str = "Not recorded"


class ExtractedFacts(BaseModel):
    chief_complaint: str
    duration: Optional[str] = None
    pain_scale: Optional[int] = Field(default=None, ge=1, le=10)
    associated_symptoms: list[str] = []


class TriageEvaluation(BaseModel):
    triage_level: int = Field(ge=1, le=5)
    clinical_reasoning: str
    requires_er_visit: bool


class ClinicalNote(BaseModel):
    executive_summary: str
    red_flags: list[str] = []
    formatted_dashboard_note: str
    recommended_specialist: str


class IntakeResponse(BaseModel):
    extracted_facts: ExtractedFacts
    triage_evaluation: TriageEvaluation
    clinical_note: ClinicalNote


class GraphState(TypedDict):
    raw_symptoms: str
    patient_age: int
    patient_sex: str
    medical_history: str
    current_medications: str
    allergies: str
    vitals: str
    extracted_facts: Optional[ExtractedFacts]
    triage_evaluation: Optional[TriageEvaluation]
    clinical_note: Optional[ClinicalNote]
