import { useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { useAuth } from "@/context/AuthContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Settings,
} from "lucide-react"
import { SettingsModal } from "@/components/settings-modal"

function getWordmark(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase()
  }
  return "U"
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const { state } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)

  if (!user) return null

  const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: location.pathname === "/dashboard",
    },
    ...(user.source_resume_id
      ? [
          {
            title: "Source",
            url: `/workspace/${user.source_resume_id}`,
            icon: FileText,
            isActive: location.pathname === `/workspace/${user.source_resume_id}`,
          },
        ]
      : []),
    ...(!user.source_resume_id
      ? [
          {
            title: "Onboarding",
            url: "/onboarding",
            icon: Sparkles,
            isActive: location.pathname === "/onboarding",
          },
        ]
      : []),
  ]

  return (
    <Sidebar collapsible="icon">
      {/* Brand Header */}
      <SidebarHeader className="flex h-14 shrink-0 items-center justify-center border-b border-sidebar-border px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="hover:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <FileText className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight text-sidebar-foreground">
                  Resume
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={item.isActive}
                    onClick={() => navigate(item.url)}
                    tooltip={item.title}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          {state === "collapsed" ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <button
                onClick={() => setShowSettings(true)}
                title="API Settings"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Settings className="size-3.5" />
              </button>
              <button
                onClick={logout}
                title="Logout"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            <SidebarMenuItem>
              <div className="flex items-center justify-between gap-2 p-2">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-[11px] border border-primary/20 select-none">
                    {getWordmark(user.display_name, user.email)}
                  </div>
                  <div className="grid flex-1 text-left text-xs leading-tight truncate">
                    <span className="truncate font-medium text-foreground">
                      {user.display_name || user.email.split("@")[0]}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setShowSettings(true)}
                    title="API Settings"
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Settings className="size-3.5" />
                  </button>
                  <button
                    onClick={logout}
                    title="Logout"
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="size-3.5" />
                  </button>
                </div>
              </div>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </Sidebar>
  )
}
