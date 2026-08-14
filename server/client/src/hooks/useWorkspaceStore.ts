import { create } from "zustand"

export type WorkspaceTab = "experience" | "projects" | "skills" | "education" | "identity"

interface WorkspaceState {
  activeTab: WorkspaceTab
  setActiveTab: (tab: WorkspaceTab) => void
  isEditingName: boolean
  setIsEditingName: (editing: boolean) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeTab: "experience",
  setActiveTab: (tab) => set({ activeTab: tab }),
  isEditingName: false,
  setIsEditingName: (editing) => set({ isEditingName: editing }),
}))
