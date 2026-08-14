export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  source_resume_id: string | null
  has_custom_api_key: boolean
}

export interface IdentityName {
  display: string
  first?: string
  last?: string
}

export interface IdentityContact {
  email: string
  phone?: string
  location?: string
}

export interface IdentityOnline {
  github?: string
  portfolio?: string
  linkedin?: string
  blog?: string
}

export interface Identity {
  name: IdentityName
  contact: IdentityContact
  online: IdentityOnline
}

export interface ExperienceEntry {
  title: string
  organization: string
  location?: string
  dates?: string
  description?: string
  highlights: string[]
}

export interface ProjectEntry {
  title: string
  organization?: string
  location?: string
  dates?: string
  description?: string
  highlights: string[]
}

export interface SkillCategory {
  name: string
  skills: string[]
}

export interface EducationEntry {
  institution: string
  degree: string
  dates?: string
  location?: string
  highlights: string[]
}

export interface ResumeData {
  summary?: string | null
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  skills: SkillCategory[]
  education: EducationEntry[]
  certifications?: string[]
  achievements?: string[]
}

export interface Resume {
  id: string
  profile_id: string
  name: string
  is_source: boolean
  identity: Identity
  resume_data: ResumeData
  job_description?: string | null
  created_at: string
  updated_at: string
}

export interface ResumeSummaryItem {
  id: string
  name: string
  is_source: boolean
  job_description?: string | null
  created_at: string
  updated_at: string
}

export interface RawExperienceInput {
  company: string
  role: string
  dates?: string
  raw_points: string
}

export interface RawProjectInput {
  name: string
  tools?: string
  raw_points: string
}

export interface OnboardFormatRequest {
  experiences: RawExperienceInput[]
  projects: RawProjectInput[]
  raw_skills?: string
}

export interface FormattedExperienceOutput {
  company: string
  role: string
  dates?: string
  bullets: string[]
}

export interface FormattedProjectOutput {
  name: string
  tools?: string
  bullets: string[]
}

export interface OnboardFormatResponse {
  formatted_experiences: FormattedExperienceOutput[]
  formatted_projects: FormattedProjectOutput[]
  categorized_skills: SkillCategory[]
}

export interface TailorRequest {
  job_description: string
  name?: string
  auto_generate_name?: boolean
}
