"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { User, Profile, AuthState } from "@/types/auth";

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (displayName: string, avatarUrl?: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const supabase = createClient();

  // Convert Supabase user to our User type
  const mapUser = (user: SupabaseUser): User => ({
    id: user.id,
    email: user.email || "",
    emailConfirmed: user.email_confirmed_at !== null,
    createdAt: user.created_at,
  });

  // Fetch profile from our profiles table
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Profile might not exist yet (created by trigger async)
        // Return a default profile based on user metadata
        console.log("Profile not found, using default:", error.message);
        return null;
      }

      return {
        id: data.id,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      console.error("Error fetching profile:", err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({
          user: mapUser(session.user),
          profile,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({
          user: mapUser(session.user),
          profile,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: getErrorMessage(error) };
      }

      // Immediately update auth state on successful login
      // This prevents race condition with onAuthStateChange
      if (data.session?.user) {
        const profile = await fetchProfile(data.session.user.id);
        setState({
          user: mapUser(data.session.user),
          profile,
          isLoading: false,
          isAuthenticated: true,
        });
      }

      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      if (isNetworkError(err)) {
        return { error: "Netzwerkfehler - Bitte überprüfe deine Internetverbindung" };
      }
      return { error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut." };
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          // Redirect to callback route for email confirmation (if enabled)
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { error: getErrorMessage(error) };
      }

      // Helper to fetch profile with retries
      const fetchProfileWithRetry = async (userId: string, retries = 3): Promise<Profile | null> => {
        for (let i = 0; i < retries; i++) {
          const profile = await fetchProfile(userId);
          if (profile) return profile;
          // Wait a bit before retrying (profile is created by trigger)
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        return null;
      };

      // If no session returned, try to sign in directly
      // (This happens when email confirmation is disabled but signUp doesn't auto-login)
      if (!data.session) {
        const signInResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInResult.error) {
          // User created but can't auto-login - they'll need to login manually
          console.error("Auto-login after signup failed:", signInResult.error);
        } else if (signInResult.data.session?.user) {
          // Update auth state immediately after auto-login
          // Use display name from user metadata as fallback
          const profile = await fetchProfileWithRetry(signInResult.data.session.user.id);
          setState({
            user: mapUser(signInResult.data.session.user),
            profile: profile || {
              id: signInResult.data.session.user.id,
              displayName: signInResult.data.session.user.user_metadata?.display_name || displayName,
              avatarUrl: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isLoading: false,
            isAuthenticated: true,
          });
        }
      } else if (data.session?.user) {
        // Session was returned - update auth state immediately
        // Use display name from user metadata as fallback
        const profile = await fetchProfileWithRetry(data.session.user.id);
        setState({
          user: mapUser(data.session.user),
          profile: profile || {
            id: data.session.user.id,
            displayName: data.session.user.user_metadata?.display_name || displayName,
            avatarUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          isLoading: false,
          isAuthenticated: true,
        });
      }

      // Profile is created automatically by the database trigger
      return { error: null };
    } catch (err) {
      console.error("Sign up error:", err);
      if (isNetworkError(err)) {
        return { error: "Netzwerkfehler - Bitte überprüfe deine Internetverbindung" };
      }
      return { error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
    });
    window.location.href = "/";
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error: getErrorMessage(error) };
      }

      return { error: null };
    } catch (err) {
      console.error("Reset password error:", err);
      if (isNetworkError(err)) {
        return { error: "Netzwerkfehler - Bitte überprüfe deine Internetverbindung" };
      }
      return { error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut." };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        return { error: getErrorMessage(error) };
      }

      return { error: null };
    } catch (err) {
      console.error("Update password error:", err);
      if (isNetworkError(err)) {
        return { error: "Netzwerkfehler - Bitte überprüfe deine Internetverbindung" };
      }
      return { error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut." };
    }
  };

  const updateProfile = async (displayName: string, avatarUrl?: string) => {
    if (!state.user) {
      return { error: "Nicht angemeldet" };
    }

    try {
      const updateData: { display_name: string; avatar_url?: string } = {
        display_name: displayName,
      };

      if (avatarUrl !== undefined) {
        updateData.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", state.user.id);

      if (error) {
        return { error: "Fehler beim Speichern des Profils" };
      }

      // Refresh profile
      await refreshProfile();

      return { error: null };
    } catch (err) {
      console.error("Update profile error:", err);
      if (isNetworkError(err)) {
        return { error: "Netzwerkfehler - Bitte überprüfe deine Internetverbindung" };
      }
      return { error: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut." };
    }
  };

  const refreshProfile = async () => {
    if (!state.user) return;

    const profile = await fetchProfile(state.user.id);
    setState((prev) => ({ ...prev, profile }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper to check if an error is a network error
function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  // Check for TypeError (fetch failed)
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("abort")
    );
  }

  // Check for Supabase network errors
  if (typeof error === "object" && error !== null) {
    const err = error as { message?: string; status?: number };
    if (err.message) {
      const message = err.message.toLowerCase();
      if (
        message.includes("network") ||
        message.includes("failed to fetch") ||
        message.includes("timeout") ||
        message.includes("connection refused") ||
        message.includes("cors")
      ) {
        return true;
      }
    }
    // Check for status codes that indicate network issues
    if (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) {
      return true;
    }
  }

  return false;
}

// Helper to translate Supabase error messages to German
function getErrorMessage(error: { message: string }): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "Ungültige Anmeldedaten",
    "Email not confirmed": "E-Mail noch nicht bestätigt",
    "User already registered": "E-Mail bereits registriert",
    "Password should be at least 6 characters": "Passwort muss mindestens 6 Zeichen haben",
    "Unable to validate email address: invalid format": "Ungültiges E-Mail-Format",
    "Signups not allowed": "Registrierung nicht erlaubt",
    "Network request failed": "Netzwerkfehler - Bitte überprüfe deine Internetverbindung",
    "Failed to fetch": "Netzwerkfehler - Bitte überprüfe deine Internetverbindung",
    "Timeout": "Zeitüberschreitung - Bitte versuche es erneut",
  };

  return errorMap[error.message] || error.message;
}