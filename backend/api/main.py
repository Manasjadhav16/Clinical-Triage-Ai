from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.schemas.models import PatientIntake, IntakeResponse
from backend.workflow.graph import triage_graph

app = FastAPI(title="Clinical Triage AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/intake", response_model=IntakeResponse)
def intake(payload: PatientIntake):
    final_state = triage_graph.invoke({
        "raw_symptoms":        payload.raw_symptoms,
        "patient_age":         payload.patient_age,
        "patient_sex":         payload.patient_sex,
        "medical_history":     payload.medical_history,
        "current_medications": payload.current_medications,
        "allergies":           payload.allergies,
        "vitals":              payload.vitals,
    })
    return IntakeResponse(
        extracted_facts=final_state["extracted_facts"],
        triage_evaluation=final_state["triage_evaluation"],
        clinical_note=final_state["clinical_note"],
    )
