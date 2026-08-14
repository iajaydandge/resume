import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# --- Identity Models (Private) ---
class IdentityName(BaseModel):
    display: str = ""
    first: str | None = None
    last: str | None = None


class IdentityContact(BaseModel):
    email: str = ""
    phone: str | None = None
    location: str | None = None


class IdentityOnline(BaseModel):
    github: str | None = None
    portfolio: str | None = None
    linkedin: str | None = None
    blog: str | None = None


class IdentitySchema(BaseModel):
    name: IdentityName = Field(default_factory=IdentityName)
    contact: IdentityContact = Field(default_factory=IdentityContact)
    online: IdentityOnline = Field(default_factory=IdentityOnline)


# --- Content Models (LLM Formatted) ---
class ExperienceEntry(BaseModel):
    title: str = Field(description="Role / Job title")
    organization: str = Field(description="Company or organization name")
    location: str | None = Field(None, description="City, State / Remote")
    dates: str | None = Field(None, description="e.g. May 2024 — Present")
    description: str | None = Field(
        None, description="Brief summary of the role if any"
    )
    highlights: list[str] = Field(
        default_factory=list,
        description="Bullet points following STAR/CAR/XYZ formula with quantifiable impact",
    )


class ProjectEntry(BaseModel):
    title: str = Field(description="Project name")
    organization: str | None = Field(
        None, description="Context / organization / hackathon"
    )
    location: str | None = Field(None, description="Location if applicable")
    dates: str | None = Field(None, description="Date or date range")
    description: str | None = Field(None, description="Short project overview")
    highlights: list[str] = Field(
        default_factory=list,
        description="Key bullet points with technical details and outcomes",
    )


class SkillCategory(BaseModel):
    name: str = Field(
        description="Category name, e.g. Languages, Frameworks, Developer Tools, Cloud"
    )
    skills: list[str] = Field(
        default_factory=list, description="List of skills in this category"
    )


class EducationEntry(BaseModel):
    institution: str = Field(description="University / College / School name")
    degree: str = Field(description="Degree and Major, e.g. B.S. in Computer Science")
    dates: str | None = Field(
        None, description="Graduation date or range, e.g. Aug 2020 — May 2024"
    )
    location: str | None = Field(None, description="Location of the institution")
    highlights: list[str] = Field(
        default_factory=list, description="Relevant coursework, GPA, honors"
    )


class ResumeDataSchema(BaseModel):
    summary: str | None = Field(None, description="Professional summary if requested")
    experience: list[ExperienceEntry] = Field(default_factory=list)
    projects: list[ProjectEntry] = Field(default_factory=list)
    skills: list[SkillCategory] = Field(default_factory=list)
    education: list[EducationEntry] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)


# --- API Request & Response Models ---
class UserProfileResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str | None = None
    avatar_url: str | None = None
    source_resume_id: uuid.UUID | None = None
    has_custom_api_key: bool = False


class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None
    google_api_key: str | None = None


class ResumeCreateRequest(BaseModel):
    name: str | None = None
    is_source: bool = False
    identity: IdentitySchema | None = None
    resume_data: ResumeDataSchema | None = None
    source_resume_id: uuid.UUID | None = None
    job_description: str | None = None
    auto_generate_name: bool = True


class ResumeUpdateRequest(BaseModel):
    name: str | None = None
    identity: IdentitySchema | None = None
    resume_data: ResumeDataSchema | None = None
    job_description: str | None = None


class ResumeResponse(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID
    name: str
    is_source: bool
    identity: dict[str, Any]
    resume_data: dict[str, Any]
    job_description: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResumeSummaryItem(BaseModel):
    id: uuid.UUID
    name: str
    is_source: bool
    job_description: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Onboarding Formatting Wizard Schemas ---
class RawExperienceInput(BaseModel):
    company: str
    role: str
    dates: str | None = None
    raw_points: str = Field(
        description="Raw unstructured text/draft describing the work"
    )


class RawProjectInput(BaseModel):
    name: str
    tools: str | None = None
    raw_points: str = Field(
        description="Raw unstructured text/draft describing the project"
    )


class OnboardFormatRequest(BaseModel):
    experiences: list[RawExperienceInput] = Field(default_factory=list)
    projects: list[RawProjectInput] = Field(default_factory=list)
    raw_skills: str | None = Field(
        None, description="Comma-separated or bulleted list of skills"
    )


class FormattedExperienceOutput(BaseModel):
    company: str
    role: str
    dates: str | None = None
    bullets: list[str] = Field(
        description="Formatted bullet points rewritten following STAR/CAR/XYZ patterns per CLAUDE.md"
    )


class FormattedProjectOutput(BaseModel):
    name: str
    tools: str | None = None
    bullets: list[str] = Field(
        description="Formatted bullet points rewritten following STAR/CAR/XYZ patterns per CLAUDE.md"
    )


class OnboardFormatResponse(BaseModel):
    formatted_experiences: list[FormattedExperienceOutput]
    formatted_projects: list[FormattedProjectOutput]
    categorized_skills: list[SkillCategory]


# --- Tailoring Schemas ---
class TailorRequest(BaseModel):
    job_description: str = Field(
        description="The full job description to tailor against"
    )
    name: str | None = Field(
        None, description="Optional custom name for the derived resume"
    )
    auto_generate_name: bool = True


class TailorOutput(BaseModel):
    derived_name: str = Field(
        description="Suggested identifier name, e.g. 'Google - Senior Frontend Engineer'"
    )
    tailored_resume_data: ResumeDataSchema = Field(
        description="Tailored and reordered resume content matching the JD"
    )
