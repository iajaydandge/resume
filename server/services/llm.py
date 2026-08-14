from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama

from server.config import settings
from server.schemas import (
    OnboardFormatRequest,
    OnboardFormatResponse,
    TailorOutput,
)


def get_llm(model_name: str = "gemini-3.6-flash", api_key: str | None = None) -> BaseChatModel:
    """Returns ChatOllama(model='gemma4:e2b') in development, ChatGoogleGenerativeAI in production."""
    if not settings.is_production:
        return ChatOllama(model="gemma4:e2b")

    if not api_key:
        raise ValueError("Google API Key is missing. Please configure your custom API Key in Settings.")

    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=api_key,
    )


async def format_onboarding_drafts(
    raw_data: OnboardFormatRequest,
    api_key: str | None = None,
) -> OnboardFormatResponse:
    """Rewrites raw experience & project notes into high-impact STAR/CAR/XYZ bullets adhering to CLAUDE.md."""
    llm = get_llm(model_name="gemini-3.6-flash", api_key=api_key)
    structured_llm = llm.with_structured_output(OnboardFormatResponse)

    system_prompt = """You are an elite executive resume writer and engineering recruiter.
Your job is to transform raw, unstructured candidate notes into pristine, ATS-optimized resume bullet points.

CRITICAL FORMATTING GUIDELINES (from CLAUDE.md):
1. **Formula**: Structure every bullet point using one of:
   - **STAR**: (Situation, Task, Action, Result)
   - **CAR**: (Challenge, Action, Result)
   - **Google XYZ**: "Accomplished [X] as measured by [Y], by doing [Z]"
2. **Action Verbs**: Start every bullet with a powerful past-tense action verb (e.g., *Architected, Engineered, Spearheaded, Optimized, Designed, Automated, Streamlined*).
   - NEVER use weak verbs (e.g., *Assisted, Helped, Worked on, Responsible for*).
3. **Quantification**: Include measurable metrics and impact wherever possible (e.g., percentages, latencies, user count, load reduction, dollar values).
4. **Bold Tech Keywords**: Wrap technologies, tools, and key impact numbers in standard HTML bold tags `<b>...</b>` (e.g., `<b>Python</b>`, `<b>PostgreSQL</b>`, `<b>35% reduction</b>`).
5. **Length**: Each bullet point should be 1 to 2 lines (concise, high-density impact).
6. **Skills Categorization**: Group raw skills into standard categories (e.g., "Languages", "Frameworks & Libraries", "Cloud & Infrastructure", "Databases & Tools").
"""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            (
                "human",
                """Please rewrite and format the following raw experience drafts, project notes, and skills into professional resume entries:

Raw Experiences:
{experiences}

Raw Projects:
{projects}

Raw Skills:
{raw_skills}
""",
            ),
        ]
    )

    chain = prompt | structured_llm
    response = await chain.ainvoke(
        {
            "experiences": [exp.model_dump() for exp in raw_data.experiences],
            "projects": [proj.model_dump() for proj in raw_data.projects],
            "raw_skills": raw_data.raw_skills or "None provided",
        }
    )
    return response


async def tailor_resume_for_job(
    source_resume_data: dict[str, Any],
    job_description: str,
    custom_name: str | None = None,
    api_key: str | None = None,
) -> TailorOutput:
    """Tailors and reorders source resume data to align with a specific target Job Description."""
    llm = get_llm(model_name="gemini-3.6-flash", api_key=api_key)
    structured_llm = llm.with_structured_output(TailorOutput)

    system_prompt = """You are a senior technical hiring manager and resume tailoring specialist.
Your mission is to tailor a candidate's source resume to maximally highlight qualifications matching a specific target Job Description (JD).

GUIDELINES:
1. **Derive Name**: If the user did not specify a custom name, deduce a clean identifier from the JD (e.g., "Google - Senior Frontend Engineer" or "Stripe - Infrastructure SDE").
2. **Reorder & Prioritize**: Reorder bullet points within each role/project to emphasize experiences, tools, and achievements that directly match the JD requirements.
3. **Keyword Alignment**: Refine the wording of highlights to echo terminology used in the JD without fabricating any false experiences or claiming unearned skills.
4. **Skills Tuning**: Highlight and move skills required by the JD to the front of each skill category.
5. **Preserve Truth**: Never invent companies, roles, dates, or degrees. Keep all original roles and projects intact.
6. **Formatting**: Wrap technical keywords and quantifiable metrics in HTML bold tags `<b>...</b>`.
"""

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            (
                "human",
                """Source Resume Content:
{source_resume}

Target Job Description:
{job_description}

Custom Name Requested (if any):
{custom_name}
""",
            ),
        ]
    )

    chain = prompt | structured_llm
    response = await chain.ainvoke(
        {
            "source_resume": source_resume_data,
            "job_description": job_description,
            "custom_name": custom_name or "None",
        }
    )
    return response
