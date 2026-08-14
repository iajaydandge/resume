import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { resumesApi } from "@/lib/api"
import type { Resume } from "@/types"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Check,
  Download,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react"

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeTab, setActiveTab } = useWorkspaceStore()

  const [resume, setResume] = useState<Resume | null>(null)
  const [lastSavedJson, setLastSavedJson] = useState<string>("")

  const { data: serverResume, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["resume", id],
    queryFn: () => resumesApi.get(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (serverResume) {
      setResume(serverResume)
      if (!lastSavedJson) {
        setLastSavedJson(JSON.stringify({
          name: serverResume.name,
          identity: serverResume.identity,
          resume_data: serverResume.resume_data,
          job_description: serverResume.job_description,
        }))
      }
    }
  }, [serverResume, lastSavedJson])

  const saveMutation = useMutation({
    mutationFn: (payload: {
      id: string
      name: string
      identity: any
      resume_data: any
      job_description?: string
    }) => resumesApi.update(payload.id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["resume", id], updated)
      setResume(updated)
      setLastSavedJson(JSON.stringify({
        name: updated.name,
        identity: updated.identity,
        resume_data: updated.resume_data,
        job_description: updated.job_description,
      }))
    },
    onError: (err: any) => {
      console.error("Auto-save failed:", err.message || err)
    },
  })

  useEffect(() => {
    if (!resume) return

    const currentJson = JSON.stringify({
      name: resume.name,
      identity: resume.identity,
      resume_data: resume.resume_data,
      job_description: resume.job_description,
    })

    if (currentJson === lastSavedJson) return

    const timer = setTimeout(() => {
      saveMutation.mutate({
        id: resume.id,
        name: resume.name,
        identity: resume.identity,
        resume_data: resume.resume_data,
        job_description: resume.job_description || undefined,
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [resume, lastSavedJson, saveMutation])

  const handleSave = async () => {
    if (!resume) return
    const currentJson = JSON.stringify({
      name: resume.name,
      identity: resume.identity,
      resume_data: resume.resume_data,
      job_description: resume.job_description,
    })
    saveMutation.mutate({
      id: resume.id,
      name: resume.name,
      identity: resume.identity,
      resume_data: resume.resume_data,
      job_description: resume.job_description || undefined,
    })
    setLastSavedJson(currentJson)
  }

  const hasUnsavedChanges = resume ? JSON.stringify({
    name: resume.name,
    identity: resume.identity,
    resume_data: resume.resume_data,
    job_description: resume.job_description,
  }) !== lastSavedJson : false

  const saving = saveMutation.isPending
  const error = queryError ? (queryError as any).message || "Failed to load resume." : null

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-4rem)] p-6 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-full w-full max-w-[600px] rounded-md" />
        </div>
      </div>
    )
  }

  if (error || !resume) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center space-y-4">
        <p className="text-sm text-destructive">{error || "Resume not found."}</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Workspace Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <input
              type="text"
              value={resume.name}
              onChange={(e) => setResume({ ...resume, name: e.target.value })}
              className="font-bold text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 text-foreground"
            />
            <Badge variant={resume.is_source ? "default" : "secondary"} className="ml-2.5 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5">
              {resume.is_source ? "Source" : "Targeted"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
            variant={hasUnsavedChanges ? "default" : "secondary"}
            className="gap-1.5 h-8 text-xs font-semibold"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : hasUnsavedChanges ? (
              <Save className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {saving
              ? "Saving..."
              : hasUnsavedChanges
              ? "Save Now"
              : "Auto-saved"}
          </Button>

          <a
            href={resumesApi.downloadPdfUrl(resume.id)}
            download
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 h-8 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Download PDF
          </a>
        </div>
      </div>

      {/* Split Pane: Editor Left, Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden">
        {/* Left Pane: Editor */}
        <ScrollArea className="h-[calc(100vh-7.5rem)] border-r border-border bg-background/50 p-4 sm:p-6">
          <div className="space-y-5 pr-3">
            {/* Section Tabs */}
            <div className="flex items-center gap-1.5 border-b border-border pb-3 overflow-x-auto text-xs font-medium">
            {(["experience", "projects", "skills", "education", "identity"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* EXPERIENCE TAB */}
          {activeTab === "experience" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Experience Entries ({resume.resume_data.experience.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = { ...resume }
                    updated.resume_data.experience.push({
                      title: "New Role",
                      organization: "Company Name",
                      dates: "2024 — Present",
                      highlights: ["Accomplished [X] by doing [Y]"],
                    })
                    setResume(updated)
                  }}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Position
                </Button>
              </div>

              {resume.resume_data.experience.map((exp, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">Position #{idx + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = { ...resume }
                        updated.resume_data.experience.splice(idx, 1)
                        setResume(updated)
                      }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Role / Title"
                      value={exp.title}
                      onChange={(e) => {
                        const updated = { ...resume }
                        updated.resume_data.experience[idx].title = e.target.value
                        setResume(updated)
                      }}
                      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.organization}
                      onChange={(e) => {
                        const updated = { ...resume }
                        updated.resume_data.experience[idx].organization = e.target.value
                        setResume(updated)
                      }}
                      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Dates"
                      value={exp.dates || ""}
                      onChange={(e) => {
                        const updated = { ...resume }
                        updated.resume_data.experience[idx].dates = e.target.value
                        setResume(updated)
                      }}
                      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>

                  {/* Highlights Bullet Points */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Bullet Points (HTML &lt;b&gt; tags supported)
                    </label>
                    {exp.highlights.map((hl, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <textarea
                          rows={2}
                          value={hl}
                          onChange={(e) => {
                            const updated = { ...resume }
                            updated.resume_data.experience[idx].highlights[j] = e.target.value
                            setResume(updated)
                          }}
                          className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = { ...resume }
                            updated.resume_data.experience[idx].highlights.splice(j, 1)
                            setResume(updated)
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = { ...resume }
                        updated.resume_data.experience[idx].highlights.push("Accomplished [X] with [Y]")
                        setResume(updated)
                      }}
                      className="h-6 text-[11px] gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Bullet
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Projects ({resume.resume_data.projects.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = { ...resume }
                    updated.resume_data.projects.push({
                      title: "New Project",
                      dates: "2024",
                      highlights: ["Developed core engine with Python and React"],
                    })
                    setResume(updated)
                  }}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Project
                </Button>
              </div>

              {resume.resume_data.projects.map((proj, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">Project #{idx + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = { ...resume }
                        updated.resume_data.projects.splice(idx, 1)
                        setResume(updated)
                      }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={proj.title}
                      onChange={(e) => {
                        const updated = { ...resume }
                        updated.resume_data.projects[idx].title = e.target.value
                        setResume(updated)
                      }}
                      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Dates"
                      value={proj.dates || ""}
                      onChange={(e) => {
                        const updated = { ...resume }
                        updated.resume_data.projects[idx].dates = e.target.value
                        setResume(updated)
                      }}
                      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1.5">
                    {proj.highlights.map((hl, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <textarea
                          rows={2}
                          value={hl}
                          onChange={(e) => {
                            const updated = { ...resume }
                            updated.resume_data.projects[idx].highlights[j] = e.target.value
                            setResume(updated)
                          }}
                          className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = { ...resume }
                            updated.resume_data.projects[idx].highlights.splice(j, 1)
                            setResume(updated)
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = { ...resume }
                        updated.resume_data.projects[idx].highlights.push("Built feature with <b>React</b>")
                        setResume(updated)
                      }}
                      className="h-6 text-[11px] gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Highlight
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SKILLS TAB */}
          {activeTab === "skills" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Technical Skill Categories
              </h3>
              {resume.resume_data.skills.map((cat, idx) => (
                <div key={idx} className="space-y-1.5 rounded-xl border border-border bg-card p-3.5">
                  <label className="text-xs font-semibold text-foreground">{cat.name}</label>
                  <input
                    type="text"
                    value={cat.skills.join(", ")}
                    onChange={(e) => {
                      const updated = { ...resume }
                      updated.resume_data.skills[idx].skills = e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                      setResume(updated)
                    }}
                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Education Entries ({resume.resume_data.education.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const updated = { ...resume }
                    updated.resume_data.education.push({
                      institution: "University Name",
                      degree: "Degree / Program",
                      dates: "2020 — 2024",
                      location: "City, State",
                      highlights: [],
                    })
                    setResume(updated)
                  }}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Education
                </Button>
              </div>

              {resume.resume_data.education.map((edu, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">Education #{idx + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = { ...resume }
                        updated.resume_data.education.splice(idx, 1)
                        setResume(updated)
                      }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Institution / School"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = { ...resume }
                        updated.resume_data.education[idx].institution = e.target.value
                        setResume(updated)
                      }}
                      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Degree / Program"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = { ...resume }
                        updated.resume_data.education[idx].degree = e.target.value
                        setResume(updated)
                      }}
                      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Dates"
                      value={edu.dates || ""}
                      onChange={(e) => {
                        const updated = { ...resume }
                        updated.resume_data.education[idx].dates = e.target.value
                        setResume(updated)
                      }}
                      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={edu.location || ""}
                      onChange={(e) => {
                        const updated = { ...resume }
                        updated.resume_data.education[idx].location = e.target.value
                        setResume(updated)
                      }}
                      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    {edu.highlights.map((hl, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <textarea
                          rows={2}
                          value={hl}
                          onChange={(e) => {
                            const updated = { ...resume }
                            updated.resume_data.education[idx].highlights[j] = e.target.value
                            setResume(updated)
                          }}
                          className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = { ...resume }
                            updated.resume_data.education[idx].highlights.splice(j, 1)
                            setResume(updated)
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = { ...resume }
                        updated.resume_data.education[idx].highlights.push("GPA: 3.9/4.0")
                        setResume(updated)
                      }}
                      className="h-6 text-[11px] gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Highlight
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* IDENTITY TAB */}
          {activeTab === "identity" && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Candidate Contact Details
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={resume.identity.name.display}
                  onChange={(e) => {
                    const updated = { ...resume }
                    updated.identity.name.display = e.target.value
                    setResume(updated)
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={resume.identity.contact.email}
                  onChange={(e) => {
                    const updated = { ...resume }
                    updated.identity.contact.email = e.target.value
                    setResume(updated)
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={resume.identity.contact.phone || ""}
                  onChange={(e) => {
                    const updated = { ...resume }
                    updated.identity.contact.phone = e.target.value
                    setResume(updated)
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                />
                <input
                  type="text"
                  placeholder="GitHub (e.g. github.com/username)"
                  value={resume.identity.online.github || ""}
                  onChange={(e) => {
                    const updated = { ...resume }
                    updated.identity.online.github = e.target.value
                    setResume(updated)
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                />
                <input
                  type="text"
                  placeholder="LinkedIn (e.g. linkedin.com/in/username)"
                  value={resume.identity.online.linkedin || ""}
                  onChange={(e) => {
                    const updated = { ...resume }
                    updated.identity.online.linkedin = e.target.value
                    setResume(updated)
                  }}
                  className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
                />
              </div>
            </div>
          )}
          </div>
        </ScrollArea>

        {/* Right Pane: Live ReportLab-Matching HTML ATS Document Preview */}
        <ScrollArea className="h-[calc(100vh-7.5rem)] bg-muted/40 p-4 sm:p-8">
          <div className="flex justify-center">
            <div className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 shadow-xl rounded-sm p-[36pt] font-sans text-[11px] leading-relaxed select-text">
              {/* Candidate Header */}
            <div className="text-center space-y-1 pb-2">
              <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
                {resume.identity.name.display || "CANDIDATE NAME"}
              </h1>
              <div className="text-[10px] text-slate-600 flex flex-wrap justify-center items-center gap-2">
                {resume.identity.contact.email && <span>{resume.identity.contact.email}</span>}
                {resume.identity.contact.phone && <span>• &nbsp;{resume.identity.contact.phone}</span>}
                {resume.identity.contact.location && <span>• &nbsp;{resume.identity.contact.location}</span>}
                {resume.identity.online.github && (
                  <span>• &nbsp;{resume.identity.online.github.replace(/https?:\/\//, "")}</span>
                )}
                {resume.identity.online.linkedin && (
                  <span>• &nbsp;{resume.identity.online.linkedin.replace(/https?:\/\//, "")}</span>
                )}
              </div>
            </div>

            {/* EXPERIENCE SECTION */}
            {resume.resume_data.experience.length > 0 && (
              <div className="mt-3">
                <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-2">
                  EXPERIENCE
                </h2>
                <div className="space-y-3">
                  {resume.resume_data.experience.map((exp, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline text-[11px]">
                        <div>
                          <span className="font-bold">{exp.title}</span>
                          {exp.organization && <span className="italic font-medium"> &mdash; {exp.organization}</span>}
                        </div>
                        <span className="text-[10px] text-slate-600">{exp.dates}</span>
                      </div>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10.5px] text-slate-800 leading-snug">
                        {exp.highlights.map((hl, j) => (
                          <li key={j} dangerouslySetInnerHTML={{ __html: hl }} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROJECTS SECTION */}
            {resume.resume_data.projects.length > 0 && (
              <div className="mt-3">
                <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-2">
                  PROJECTS
                </h2>
                <div className="space-y-3">
                  {resume.resume_data.projects.map((proj, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline text-[11px]">
                        <div>
                          <span className="font-bold">{proj.title}</span>
                          {proj.description && <span className="text-slate-600"> &mdash; {proj.description}</span>}
                        </div>
                        <span className="text-[10px] text-slate-600">{proj.dates}</span>
                      </div>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10.5px] text-slate-800 leading-snug">
                        {proj.highlights.map((hl, j) => (
                          <li key={j} dangerouslySetInnerHTML={{ __html: hl }} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SKILLS SECTION */}
            {resume.resume_data.skills.length > 0 && (
              <div className="mt-3">
                <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-2">
                  TECHNICAL SKILLS
                </h2>
                <div className="space-y-1 text-[10.5px]">
                  {resume.resume_data.skills.map((cat, i) => (
                    <div key={i}>
                      <span className="font-bold">{cat.name}: </span>
                      <span>{cat.skills.join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EDUCATION SECTION */}
            {resume.resume_data.education.length > 0 && (
              <div className="mt-3">
                <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-2">
                  EDUCATION
                </h2>
                <div className="space-y-2">
                  {resume.resume_data.education.map((edu, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline text-[11px]">
                        <div>
                          <span className="font-bold">{edu.institution}</span>
                          <span className="italic"> &mdash; {edu.degree}</span>
                        </div>
                        <span className="text-[10px] text-slate-600">{edu.dates}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
