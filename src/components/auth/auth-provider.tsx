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
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return {
      id: data.id,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: getErrorMessage(error) };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      return { error: getErrorMessage(error) };
    }

    // Create profile after signup
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        display_name: displayName,
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    return { error: null };
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { error: getErrorMessage(error) };
    }

    return { error: null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { error: getErrorMessage(error) };
    }

    return { error: null };
  };

  const updateProfile = async (displayName: string, avatarUrl?: string) => {
    if (!state.user) {
      return { error: "Nicht angemeldet" };
    }

    const updateData: { display_name: string; avatar_url?: string; updated_at: string } = {
      display_name: displayName,
      updated_at: new Date().toISOString(),
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

// Helper to translate Supabase error messages to German
function getErrorMessage(error: { message: string }): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "Ungültige Anmeldedaten",
    "Email not confirmed": "E-Mail noch nicht bestätigt",
    "User already registered": "E-Mail bereits registriert",
    "Password should be at least 6 characters": "Passwort muss mindestens 6 Zeichen haben",
    "Unable to validate email address: invalid format": "Ungültiges E-Mail-Format",
    "Signups not allowed": "Registrierung nicht erlaubt",
  };

  return errorMap[error.message] || error.message;
}