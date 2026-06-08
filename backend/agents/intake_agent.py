from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from backend.schemas.models import ExtractedFacts

_SYSTEM_PROMPT = """You are a clinical data extraction engine. Your only job is to parse a patient's \
free-text symptom description and extract four specific facts.

Rules:
- Extract ONLY what the patient explicitly states. Never infer, embellish, or guess.
- chief_complaint: The primary symptom or reason for the visit (required, always present).
- duration: How long the symptom has been present (e.g. "2 days", "1 week"). Return null if not mentioned.
- pain_scale: A numeric pain intensity from 1 (minimal) to 10 (worst imaginable). Return null if not mentioned.
- associated_symptoms: A list of any secondary symptoms mentioned. Return an empty list if none.
- Do not provide medical advice, diagnosis, or any text outside the structured output."""


def run_intake_agent(raw_symptoms: str) -> ExtractedFacts:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    chain = llm.with_structured_output(ExtractedFacts)
    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=raw_symptoms),
    ]
    return chain.invoke(messages)
