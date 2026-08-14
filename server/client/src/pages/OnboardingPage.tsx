import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { resumesApi } from "@/lib/api"
import type {
  EducationEntry,
  ExperienceEntry,
  Identity,
  ProjectEntry,
  RawExperienceInput,
  RawProjectInput,
  SkillCategory,
} from "@/types"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileCheck,
  GraduationCap,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  User,
  Wand2,
} from "lucide-react"

export const OnboardingPage: React.FC = () => {
  const { user, checkAuth } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.source_resume_id) {
      navigate("/dashboard", { replace: true })
    }
  }, [user, navigate])

  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Identity
  const [identity, setIdentity] = useState<Identity>({
    name: { display: user?.display_name || "" },
    contact: { email: user?.email || "" },
    online: { github: "", linkedin: "", portfolio: "" },
  })

  // Step 2: Raw Inputs
  const [rawExperiences, setRawExperiences] = useState<RawExperienceInput[]>([
    {
      company: "Acme Corp",
      role: "Full Stack Engineer",
      dates: "Jan 2023 — Present",
      raw_points:
        "Built react dashboards, optimized postgres queries by 35%, deployed on aws with docker",
    },
  ])

  const [rawProjects, setRawProjects] = useState<RawProjectInput[]>([
    {
      name: "AI Resume Tailor",
      tools: "Python, FastAPI, React, PostgreSQL",
      raw_points:
        "Built a multi-tenant resume tailoring tool with reportlab pdf compiler and gemini integration",
    },
  ])

  const [rawSkills, setRawSkills] = useState<string>(
    "Python, TypeScript, React, Next.js, FastAPI, PostgreSQL, Docker, AWS, Git"
  )

  // Formatted Results from AI
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([])
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [skills, setSkills] = useState<SkillCategory[]>([])

  // Step 3: Education
  const [education, setEducation] = useState<EducationEntry[]>([
    {
      institution: "State University",
      degree: "B.S. in Computer Science",
      dates: "2019 — 2023",
      location: "San Francisco, CA",
      highlights: ["Dean's Honor List", "GPA: 3.8/4.0"],
    },
  ])

  const handleFormatWithAI = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await resumesApi.formatDrafts({
        experiences: rawExperiences,
        projects: rawProjects,
        raw_skills: rawSkills,
      })

      // Map AI formatted output to ResumeData structures
      setExperiences(
        res.formatted_experiences.map((exp) => ({
          organization: exp.company,
          title: exp.role,
          dates: exp.dates || "",
          highlights: exp.bullets,
        }))
      )

      setProjects(
        res.formatted_projects.map((proj) => ({
          title: proj.name,
          description: proj.tools ? `Technologies: ${proj.tools}` : undefined,
          highlights: proj.bullets,
        }))
      )

      setSkills(res.categorized_skills)
      setStep(3)
    } catch (err: any) {
      setError(err.message || "AI formatting failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSourceResume = async () => {
    try {
      setLoading(true)
      setError(null)
      await resumesApi.create({
        name: "Source Resume",
        is_source: true,
        identity,
        resume_data: {
          summary: null,
          experience: experiences,
          projects: projects,
          skills: skills,
          education: education,
        },
      })
      await checkAuth()
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to save source resume.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Progress Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Source Resume Setup
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your source resume from which future targeted versions will be generated.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Step {step} of 3
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* STEP 1: Candidate Identity */}
      {step === 1 && (
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Personal & Contact Details
              </h2>
              <p className="text-xs text-muted-foreground">
                This identity is stored privately and inserted into your final resumes.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={identity.name.display}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    name: { ...identity.name, display: e.target.value },
                  })
                }
                placeholder="Jane Doe"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Email Address <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={identity.contact.email}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    contact: { ...identity.contact, email: e.target.value },
                  })
                }
                placeholder="jane.doe@example.com"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Phone Number
              </label>
              <input
                type="text"
                value={identity.contact.phone || ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    contact: { ...identity.contact, phone: e.target.value },
                  })
                }
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Location (City, State)
              </label>
              <input
                type="text"
                value={identity.contact.location || ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    contact: { ...identity.contact, location: e.target.value },
                  })
                }
                placeholder="San Francisco, CA"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                GitHub Profile (e.g., github.com/username)
              </label>
              <input
                type="text"
                value={identity.online.github || ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    online: { ...identity.online, github: e.target.value },
                  })
                }
                placeholder="github.com/janedoe"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                LinkedIn Profile (e.g., linkedin.com/in/username)
              </label>
              <input
                type="text"
                value={identity.online.linkedin || ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    online: { ...identity.online, linkedin: e.target.value },
                  })
                }
                placeholder="linkedin.com/in/janedoe"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={() => setStep(2)}
              disabled={!identity.name.display || !identity.contact.email}
              className="gap-2"
            >
              Continue to Experience <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Raw Experience, Projects & Skills with AI Formatting */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Work Experience & Draft Notes
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Write raw bullet points or rough drafts — AI will format them with STAR/CAR/XYZ formulas.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setRawExperiences([
                    ...rawExperiences,
                    { company: "", role: "", dates: "", raw_points: "" },
                  ])
                }
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Role
              </Button>
            </div>

            {rawExperiences.map((exp, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">
                    Position #{idx + 1}
                  </span>
                  {rawExperiences.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setRawExperiences(
                          rawExperiences.filter((_, i) => i !== idx)
                        )
                      }
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={exp.company}
                    onChange={(e) => {
                      const updated = [...rawExperiences]
                      updated[idx].company = e.target.value
                      setRawExperiences(updated)
                    }}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Role / Title"
                    value={exp.role}
                    onChange={(e) => {
                      const updated = [...rawExperiences]
                      updated[idx].role = e.target.value
                      setRawExperiences(updated)
                    }}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dates (e.g. 2022 — Present)"
                    value={exp.dates || ""}
                    onChange={(e) => {
                      const updated = [...rawExperiences]
                      updated[idx].dates = e.target.value
                      setRawExperiences(updated)
                    }}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <textarea
                  rows={3}
                  placeholder="Paste rough notes, accomplishments, metrics, or technologies used..."
                  value={exp.raw_points}
                  onChange={(e) => {
                    const updated = [...rawExperiences]
                    updated[idx].raw_points = e.target.value
                    setRawExperiences(updated)
                  }}
                  className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Projects Drafts */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-base font-semibold text-foreground">
                Projects & Technical Highlights
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setRawProjects([
                    ...rawProjects,
                    { name: "", tools: "", raw_points: "" },
                  ])
                }
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Project
              </Button>
            </div>

            {rawProjects.map((proj, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={proj.name}
                    onChange={(e) => {
                      const updated = [...rawProjects]
                      updated[idx].name = e.target.value
                      setRawProjects(updated)
                    }}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Technologies / Tools Used"
                    value={proj.tools || ""}
                    onChange={(e) => {
                      const updated = [...rawProjects]
                      updated[idx].tools = e.target.value
                      setRawProjects(updated)
                    }}
                    className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Key features, scale, outcomes..."
                  value={proj.raw_points}
                  onChange={(e) => {
                    const updated = [...rawProjects]
                    updated[idx].raw_points = e.target.value
                    setRawProjects(updated)
                  }}
                  className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            ))}

            {/* Skills String */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-foreground">
                Technical Skills (Comma separated list)
              </label>
              <textarea
                rows={2}
                value={rawSkills}
                onChange={(e) => setRawSkills(e.target.value)}
                placeholder="Python, React, TypeScript, PostgreSQL, Docker, AWS..."
                className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            <Button
              onClick={handleFormatWithAI}
              disabled={loading}
              className="gap-2 font-semibold shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Formatting with AI...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> Format with AI & Review <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Education & Review */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Education & Degrees
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Add your academic background.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEducation([
                    ...education,
                    { institution: "", degree: "", dates: "", highlights: [] },
                  ])
                }
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Degree
              </Button>
            </div>

            {education.map((edu, idx) => (
              <div
                key={idx}
                className="grid gap-3 sm:grid-cols-3 rounded-xl border border-border bg-secondary/30 p-4"
              >
                <input
                  type="text"
                  placeholder="University / College"
                  value={edu.institution}
                  onChange={(e) => {
                    const updated = [...education]
                    updated[idx].institution = e.target.value
                    setEducation(updated)
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Degree & Major"
                  value={edu.degree}
                  onChange={(e) => {
                    const updated = [...education]
                    updated[idx].degree = e.target.value
                    setEducation(updated)
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Dates / Graduation Year"
                  value={edu.dates || ""}
                  onChange={(e) => {
                    const updated = [...education]
                    updated[idx].dates = e.target.value
                    setEducation(updated)
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* AI Formatted Review Preview */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  AI-Formatted Content Review
                </h2>
                <p className="text-xs text-muted-foreground">
                  Review the STAR/CAR/XYZ bullet points rewritten by the AI engine.
                </p>
              </div>
            </div>

            {/* Experience Review */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Experience Highlights
              </h3>
              {experiences.map((exp, i) => (
                <div key={i} className="space-y-1.5 rounded-lg border border-border/80 p-3.5 bg-secondary/20">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span>
                      {exp.title} &mdash; {exp.organization}
                    </span>
                    <span className="text-muted-foreground">{exp.dates}</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                    {exp.highlights.map((hl, j) => (
                      <li
                        key={j}
                        dangerouslySetInnerHTML={{ __html: hl }}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Skills Review */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categorized Skills
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {skills.map((cat, i) => (
                  <div key={i} className="rounded-lg border border-border/80 p-3 bg-secondary/20 text-xs">
                    <span className="font-semibold text-foreground">{cat.name}: </span>
                    <span className="text-muted-foreground">{cat.skills.join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Edit Drafts
            </Button>

            <Button
              onClick={handleSaveSourceResume}
              disabled={loading}
              className="gap-2 font-semibold shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> Save Source Resume & Launch Dashboard
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
