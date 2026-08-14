import React, { useEffect } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "@/context/AuthContext"
import { ModeToggle } from "@/components/mode-toggle"
import { LoginForm } from "@/components/login-form"
import { FileText } from "lucide-react"

export const LoginPage: React.FC = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      if (user.source_resume_id) {
        navigate("/dashboard", { replace: true })
      } else {
        navigate("/onboarding", { replace: true })
      }
    }
  }, [user, loading, navigate])

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Column: Login Form */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-background text-foreground">
        {/* Brand Header & Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold tracking-tight text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-lg">Resume</span>
          </div>
          <ModeToggle />
        </div>

        {/* Centered Login Box (login-02) */}
        <div className="mx-auto w-full max-w-sm py-12">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="text-center space-y-1 text-xs text-muted-foreground">
          <p>By continuing, you agree to our Terms and Privacy Policy.</p>
          <p>© 2026 Resume</p>
        </div>
      </div>

      {/* Right Column: Hero Banner with high contrast in Light and rich depth in Dark */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden border-l border-zinc-800 bg-zinc-950 p-12 text-white dark:bg-zinc-900/70 dark:border-border">
        {/* Ambient Gradient Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

        <div />

        <div className="relative z-10 space-y-3 max-w-md">
          <blockquote className="text-2xl font-semibold leading-snug tracking-tight text-zinc-100">
            &ldquo;Target your resume to any role in seconds.&rdquo;
          </blockquote>
          <p className="text-sm text-zinc-400">
            Instant alignment with clean PDF export.
          </p>
        </div>

        <div />
      </div>
    </div>
  )
}
