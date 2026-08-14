import React from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { useAuth } from "@/context/AuthContext"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { FileText, LogOut, User } from "lucide-react"

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname === "/login") {
    return null
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-lg">Resume</span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
              <Link
                to="/dashboard"
                className="transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              {user.source_resume_id && (
                <Link
                  to={`/workspace/${user.source_resume_id}`}
                  className="transition-colors hover:text-foreground"
                >
                  Source Resume
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-medium text-foreground leading-none">
                  {user.display_name || user.email.split("@")[0]}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {user.email}
                </span>
              </div>

              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name || "Avatar"}
                  className="h-8 w-8 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground border border-border">
                  <User className="h-4 w-4" />
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
