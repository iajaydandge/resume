import React, { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { authApi } from "@/lib/api"
import { X, Eye, EyeOff, Key, ShieldCheck, AlertCircle } from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

async function encryptApiKeyWithJwk(jwk: any, plaintext: string): Promise<string> {
  const publicKey = await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  )

  const plaintextBuffer = new TextEncoder().encode(plaintext)
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    plaintextBuffer
  )

  const encryptedBytes = new Uint8Array(encryptedBuffer)
  let binaryString = ""
  for (let i = 0; i < encryptedBytes.byteLength; i++) {
    binaryString += String.fromCharCode(encryptedBytes[i])
  }
  return window.btoa(binaryString)
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, checkAuth } = useAuth()
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen || !user) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const jwks = await authApi.getJwks()
      const jwk = jwks.keys.find((k) => k.use === "enc" && k.alg === "RSA-OAEP-256")
      if (!jwk) {
        throw new Error("Encryption key not found in system metadata.")
      }

      const encryptedKey = await encryptApiKeyWithJwk(jwk, apiKey.trim())
      await authApi.updateProfile({ google_api_key: encryptedKey })
      await checkAuth()
      setApiKey("")
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to update API key.")
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear your custom API key?")) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await authApi.updateProfile({ google_api_key: null })
      await checkAuth()
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to clear API key.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Key className="size-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">API Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Google API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  user.has_custom_api_key
                    ? "••••••••••••••••••••••••••••••••"
                    : "Enter your Google API key"
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
              Your API key is encrypted using RSA-2048 and stored securely. It is decrypted
              on-the-fly only when executing LLM tailoring prompts.
            </p>
          </div>

          <div className="rounded-lg border border-border p-3.5 bg-accent/40 space-y-2">
            <div className="flex items-start gap-2.5">
              {user.has_custom_api_key ? (
                <>
                  <ShieldCheck className="size-4 text-primary mt-0.5" />
                  <div className="text-xs leading-normal">
                    <span className="font-medium text-foreground">Securely Configured</span>
                    <p className="text-muted-foreground mt-0.5">
                      Your custom key is active and will be used for all alignment processes.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="size-4 text-amber-500 mt-0.5" />
                  <div className="text-xs leading-normal">
                    <span className="font-medium text-foreground">No Custom API Key</span>
                    <p className="text-muted-foreground mt-0.5">
                      The application requires you to configure an API key to execute AI operations.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-primary">
              API settings updated successfully.
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
            {user.has_custom_api_key ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={saving}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-destructive/30 bg-background px-3 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                Clear Key
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving || !apiKey.trim()}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Key"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
