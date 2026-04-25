import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import * as Linking from "expo-linking"
import type { Session } from "@supabase/supabase-js"

import { uploadAvatar } from "@/services/supabase/avatar"
import { supabase } from "@/services/supabase/supabase"

export type AuthContextType = {
  isAuthenticated: boolean
  isRecovering: boolean
  session: Session | null
  authEmail: string | undefined
  avatarUrl: string | undefined
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  resetPassword: (email: string) => Promise<string | null>
  updatePassword: (password: string) => Promise<string | null>
  clearRecovery: () => void
  logout: () => void
  uploadAvatar: (base64: string, mimeType: string) => Promise<string | null>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export interface AuthProviderProps {}

const RESET_REDIRECT_URL = Linking.createURL("reset-password")

export const AuthProvider: FC<PropsWithChildren<AuthProviderProps>> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [isRecovering, setIsRecovering] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        supabase.auth.signOut()
      }
      setSession(initialSession)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, updatedSession) => {
      setSession(updatedSession)
      if (event === "PASSWORD_RECOVERY") setIsRecovering(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle deep links that carry a recovery token (from the password-reset email)
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url) return
      const parsed = Linking.parse(url)
      if (parsed.path !== "reset-password") return

      // Supabase appends tokens as a URL fragment (#access_token=…&refresh_token=…&type=recovery)
      const hashIndex = url.indexOf("#")
      if (hashIndex === -1) return
      const fragment = url.slice(hashIndex + 1)
      const params = new URLSearchParams(fragment)
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      const type = params.get("type")
      if (type !== "recovery" || !accessToken || !refreshToken) return

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (!error) setIsRecovering(true)
    }

    Linking.getInitialURL().then((url) => { if (url) handleUrl(url) })
    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url))
    return () => subscription.remove()
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: RESET_REDIRECT_URL,
    })
    return error?.message ?? null
  }, [])

  const updatePassword = useCallback(async (password: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password })
    return error?.message ?? null
  }, [])

  const clearRecovery = useCallback(() => {
    setIsRecovering(false)
  }, [])

  const logout = useCallback(() => {
    supabase.auth.signOut()
    setIsRecovering(false)
  }, [])

  const handleUploadAvatar = useCallback(
    async (base64: string, mimeType: string): Promise<string | null> => {
      const userId = session?.user?.id
      if (!userId) return "Not authenticated"
      try {
        const url = await uploadAvatar(userId, base64, mimeType)
        const { error } = await supabase.auth.updateUser({ data: { avatar_url: url } })
        return error?.message ?? null
      } catch (e: any) {
        return e?.message ?? "Upload failed"
      }
    },
    [session?.user?.id],
  )

  const value: AuthContextType = {
    isAuthenticated: !!session,
    isRecovering,
    session,
    authEmail: session?.user?.email,
    avatarUrl: session?.user?.user_metadata?.avatar_url,
    isLoading,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    clearRecovery,
    logout,
    uploadAvatar: handleUploadAvatar,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
