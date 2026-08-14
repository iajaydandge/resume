import React, { useState } from "react"
import { useNavigate } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { resumesApi } from "@/lib/api"
import {
  Clock,
  Download,
  FileCode,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react"

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Tailor Modal State
  const [showTailorModal, setShowTailorModal] = useState<boolean>(false)
  const [jobDescription, setJobDescription] = useState<string>("")
  const [customName, setCustomName] = useState<string>("")
  const [tailorError, setTailorError] = useState<string | null>(null)

  // Queries
  const { data: resumes = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["resumes"],
    queryFn: resumesApi.list,
  })

  // Mutations
  const tailorMutation = useMutation({
    mutationFn: resumesApi.tailor,
    onSuccess: (tailored) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] })
      setShowTailorModal(false)
      navigate(`/workspace/${tailored.id}`)
    },
    onError: (err: any) => {
      setTailorError(err.message || "Failed to tailor resume.")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: resumesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] })
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete resume.")
    }
  })

  const handleTailorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobDescription.trim()) return
    setTailorError(null)
    tailorMutation.mutate({
      job_description: jobDescription,
      name: customName.trim() || undefined,
      auto_generate_name: !customName.trim(),
    })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return
    deleteMutation.mutate(id)
  }

  const error = queryError ? (queryError as any).message || "Failed to load resumes." : null
  const tailoring = tailorMutation.isPending

  const sourceResume = resumes.find((r) => r.is_source)
  const derivedResumes = resumes.filter((r) => !r.is_source)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your source profile and targeted resumes.
          </p>
        </div>

        <Button
          onClick={() => setShowTailorModal(true)}
          className="gap-2 font-semibold shadow-md self-start sm:self-auto"
        >
          <Sparkles className="h-4 w-4" /> Adapt for Job
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Source Resume Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Source Resume
              </h2>
            </div>

            {sourceResume ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {sourceResume.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3.5 w-3.5" /> Updated{" "}
                      {new Date(sourceResume.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/workspace/${sourceResume.id}`)}
                    className="gap-1.5 flex-1 sm:flex-initial"
                  >
                    <FileCode className="h-4 w-4" /> Open Editor
                  </Button>
                  <a
                    href={resumesApi.downloadPdfUrl(sourceResume.id)}
                    download
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  No source resume created yet.
                </p>
                <Button onClick={() => navigate("/onboarding")} size="sm">
                  Complete Onboarding
                </Button>
              </div>
            )}
          </div>

          {/* Derived Resumes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Targeted Resumes ({derivedResumes.length})
              </h2>
            </div>

            {derivedResumes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Wand2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  No targeted resumes yet
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Add a job description to generate a focused version of your resume.
                </p>
                <Button
                  onClick={() => setShowTailorModal(true)}
                  size="sm"
                  className="gap-1.5 mt-2"
                >
                  <Plus className="h-4 w-4" /> Create Targeted Resume
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {derivedResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground line-clamp-1">
                          {resume.name}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(resume.id, resume.name)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {resume.job_description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic bg-secondary/30 p-2 rounded-lg">
                          "{resume.job_description.slice(0, 120)}..."
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border mt-4 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(resume.updated_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={resumesApi.downloadPdfUrl(resume.id)}
                          download
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/workspace/${resume.id}`)}
                          className="text-xs h-7 px-3"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tailor Resume Modal */}
      {showTailorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    Adapt Resume for Job
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Generate a version focused on the target requirements.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTailorModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {tailorError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                {tailorError}
              </div>
            )}

            <form onSubmit={handleTailorSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Target Job Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste the job description or requirements here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Resume Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty for auto-naming"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTailorModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={tailoring || !jobDescription.trim()}
                  className="gap-2 font-semibold"
                >
                  {tailoring ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Adapting...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" /> Generate Resume
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
