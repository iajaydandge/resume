import type {
  Identity,
  OnboardFormatRequest,
  OnboardFormatResponse,
  Resume,
  ResumeData,
  ResumeSummaryItem,
  TailorRequest,
  UserProfile,
} from "@/types"

export const API_BASE = import.meta.env.VITE_API_URL || ""

export function getToken(): string | null {
  return localStorage.getItem("token")
}

export function setToken(token: string): void {
  localStorage.setItem("token", token)
}

export function removeToken(): void {
  localStorage.removeItem("token")
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`
  const token = getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  })

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`
    try {
      const data = await res.json()
      if (data.detail) errorDetail = data.detail
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  if (res.status === 204) {
    return {} as T
  }

  return res.json()
}

export const authApi = {
  getGoogleLoginUrl: () => `${API_BASE}/api/auth/google/authorize`,

  getMe: async (): Promise<UserProfile> => {
    return apiFetch<UserProfile>("/api/users/me")
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" })
    } finally {
      removeToken()
    }
  },

  updateProfile: async (payload: {
    display_name?: string
    avatar_url?: string
    google_api_key?: string | null
  }): Promise<UserProfile> => {
    return apiFetch<UserProfile>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  getJwks: async (): Promise<{ keys: any[] }> => {
    return apiFetch<{ keys: any[] }>("/.well-known/jwks.json")
  },
}

export const resumesApi = {
  list: async (): Promise<ResumeSummaryItem[]> => {
    return apiFetch<ResumeSummaryItem[]>("/api/resumes")
  },

  get: async (id: string): Promise<Resume> => {
    return apiFetch<Resume>(`/api/resumes/${id}`)
  },

  create: async (payload: {
    name?: string
    is_source?: boolean
    identity?: Identity
    resume_data?: ResumeData
    source_resume_id?: string
    job_description?: string
  }): Promise<Resume> => {
    return apiFetch<Resume>("/api/resumes", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  update: async (
    id: string,
    payload: {
      name?: string
      identity?: Identity
      resume_data?: ResumeData
      job_description?: string
    }
  ): Promise<Resume> => {
    return apiFetch<Resume>(`/api/resumes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },

  delete: async (id: string): Promise<void> => {
    await apiFetch(`/api/resumes/${id}`, { method: "DELETE" })
  },

  tailor: async (payload: TailorRequest): Promise<Resume> => {
    return apiFetch<Resume>("/api/resumes", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  downloadPdfUrl: (id: string) => `${API_BASE}/api/resumes/${id}/pdf`,

  previewPdf: async (
    id: string,
    payload: {
      identity: Identity
      resume_data: ResumeData
      filename?: string
    }
  ): Promise<Blob> => {
    const token = getToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}/api/resumes/${id}/previews`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error("Failed to generate PDF preview")
    }
    return res.blob()
  },

  formatDrafts: async (
    payload: OnboardFormatRequest
  ): Promise<OnboardFormatResponse> => {
    return apiFetch<OnboardFormatResponse>("/api/resumes/formatted-drafts", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
}
