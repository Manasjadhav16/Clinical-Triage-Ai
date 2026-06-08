from langgraph.graph import StateGraph, START, END

from backend.schemas.models import GraphState
from backend.agents.intake_agent import run_intake_agent
from backend.agents.analyst_agent import run_analyst_agent
from backend.agents.router_agent import run_router_agent


def node_intake(state: GraphState) -> dict:
    facts = run_intake_agent(state["raw_symptoms"])
    return {"extracted_facts": facts}


def node_analyst(state: GraphState) -> dict:
    evaluation = run_analyst_agent(
        state["extracted_facts"],
        medical_history=state["medical_history"],
        current_medications=state["current_medications"],
        vitals=state["vitals"],
    )
    return {"triage_evaluation": evaluation}


def node_router(state: GraphState) -> dict:
    note = run_router_agent(
        state["extracted_facts"],
        state["triage_evaluation"],
        patient_age=state["patient_age"],
        patient_sex=state["patient_sex"],
        medical_history=state["medical_history"],
        current_medications=state["current_medications"],
        allergies=state["allergies"],
        vitals=state["vitals"],
    )
    return {"clinical_note": note}


builder = StateGraph(GraphState)

builder.add_node("intake",  node_intake)
builder.add_node("analyst", node_analyst)
builder.add_node("router",  node_router)

builder.add_edge(START,     "intake")
builder.add_edge("intake",  "analyst")
builder.add_edge("analyst", "router")
builder.add_edge("router",  END)

triage_graph = builder.compile()
