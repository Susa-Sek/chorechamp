"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Household,
  HouseholdMember,
  InviteCode,
  HouseholdState,
  CreateHouseholdInput,
  JoinHouseholdInput,
} from "@/types/household";

interface HouseholdContextType extends HouseholdState {
  fetchHousehold: () => Promise<void>;
  createHousehold: (input: CreateHouseholdInput) => Promise<{ error: string | null; household?: Household }>;
  joinHousehold: (input: JoinHouseholdInput) => Promise<{ error: string | null }>;
  leaveHousehold: () => Promise<{ error: string | null }>;
  removeMember: (memberId: string) => Promise<{ error: string | null }>;
  transferAdmin: (newAdminUserId: string) => Promise<{ error: string | null }>;
  generateInviteCode: (expiresInDays?: number) => Promise<{ error: string | null; code?: string }>;
  revokeInviteCode: (codeId: string) => Promise<{ error: string | null }>;
  clearError: () => void;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<HouseholdState>({
    household: null,
    members: [],
    inviteCodes: [],
    isLoading: true,
    isAdmin: false,
    error: null,
  });

  const supabase = createClient();

  const fetchHousehold = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({
          household: null,
          members: [],
          inviteCodes: [],
          isLoading: false,
          isAdmin: false,
          error: null,
        });
        return;
      }

      // Fetch user's household membership
      const { data: membershipData, error: membershipError } = await supabase
        .from("household_members")
        .select(`
          role,
          joined_at,
          household:households (
            id,
            name,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (membershipError || !membershipData) {
        setState({
          household: null,
          members: [],
          inviteCodes: [],
          isLoading: false,
          isAdmin: false,
          error: null,
        });
        return;
      }

      const household = membershipData.household as unknown as Household;
      const isAdmin = membershipData.role === "admin";

      // Fetch all members of the household
      const { data: membersData } = await supabase
        .from("household_members")
        .select(`
          id,
          household_id,
          user_id,
          role,
          joined_at,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq("household_id", household.id)
        .order("joined_at", { ascending: true });

      const members: HouseholdMember[] = (membersData || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        householdId: m.household_id as string,
        userId: m.user_id as string,
        role: m.role as "admin" | "member",
        joinedAt: m.joined_at as string,
        profile: {
          displayName: (m.profiles as Record<string, unknown>)?.display_name as string || "Unbekannt",
          avatarUrl: (m.profiles as Record<string, unknown>)?.avatar_url as string | null,
        },
      }));

      // Fetch invite codes if admin
      let inviteCodes: InviteCode[] = [];
      if (isAdmin) {
        const { data: codesData } = await supabase
          .from("invite_codes")
          .select("*")
          .eq("household_id", household.id)
          .is("used_at", null)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });

        inviteCodes = (codesData || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          code: c.code as string,
          householdId: c.household_id as string,
          createdBy: c.created_by as string,
          expiresAt: c.expires_at as string,
          usedAt: c.used_at as string | null,
          createdAt: c.created_at as string,
        }));
      }

      setState({
        household,
        members,
        inviteCodes,
        isLoading: false,
        isAdmin,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching household:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Fehler beim Laden des Haushalts",
      }));
    }
  }, [supabase]);

  // Initialize household on mount
  useEffect(() => {
    fetchHousehold();
  }, [fetchHousehold]);

  const createHousehold = async (input: CreateHouseholdInput) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Nicht angemeldet" };
      }

      // Create household
      const { data: householdData, error: householdError } = await supabase
        .from("households")
        .insert({
          name: input.name,
          created_by: user.id,
        })
        .select()
        .single();

      if (householdError) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: "Fehler beim Erstellen des Haushalts" };
      }

      // Add user as admin member
      const { error: memberError } = await supabase.from("household_members").insert({
        household_id: householdData.id,
        user_id: user.id,
        role: "admin",
      });

      if (memberError) {
        // Rollback household creation
        await supabase.from("households").delete().eq("id", householdData.id);
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: "Fehler beim Hinzufügen als Mitglied" };
      }

      await fetchHousehold();

      return { error: null, household: householdData as Household };
    } catch (error) {
      console.error("Error creating household:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const joinHousehold = async (input: JoinHouseholdInput) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Nicht angemeldet" };
      }

      // Check if user is already in a household
      const { data: existingMembership } = await supabase
        .from("household_members")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingMembership) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: "Du bist bereits Mitglied eines Haushalts" };
      }

      // Validate invite code
      const { data: inviteCode, error: codeError } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", input.code.toUpperCase())
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (codeError || !inviteCode) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: "Ungültiger oder abgelaufener Einladungscode" };
      }

      // Add user as member
      const { error: memberError } = await supabase.from("household_members").insert({
        household_id: inviteCode.household_id,
        user_id: user.id,
        role: "member",
      });

      if (memberError) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: "Fehler beim Beitreten des Haushalts" };
      }

      // Mark code as used
      await supabase
        .from("invite_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", inviteCode.id);

      await fetchHousehold();

      return { error: null };
    } catch (error) {
      console.error("Error joining household:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const leaveHousehold = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !state.household) {
        return { error: "Nicht angemeldet oder kein Haushalt" };
      }

      // Check if admin with other members
      if (state.isAdmin && state.members.length > 1) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: "Als Admin kannst du nicht gehen, während andere Mitglieder vorhanden sind. Übertrage zuerst die Admin-Rolle." };
      }

      // Delete membership
      const { error: deleteError } = await supabase
        .from("household_members")
        .delete()
        .eq("user_id", user.id)
        .eq("household_id", state.household.id);

      if (deleteError) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: "Fehler beim Verlassen des Haushalts" };
      }

      // If last member, delete household
      if (state.members.length === 1) {
        await supabase.from("households").delete().eq("id", state.household.id);
      }

      setState({
        household: null,
        members: [],
        inviteCodes: [],
        isLoading: false,
        isAdmin: false,
        error: null,
      });

      return { error: null };
    } catch (error) {
      console.error("Error leaving household:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const removeMember = async (memberId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!state.isAdmin) {
        return { error: "Nur Admins können Mitglieder entfernen" };
      }

      const { error: deleteError } = await supabase
        .from("household_members")
        .delete()
        .eq("id", memberId);

      if (deleteError) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: "Fehler beim Entfernen des Mitglieds" };
      }

      await fetchHousehold();

      return { error: null };
    } catch (error) {
      console.error("Error removing member:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const transferAdmin = async (newAdminUserId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!state.isAdmin || !state.household) {
        return { error: "Nur Admins können die Admin-Rolle übertragen" };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Nicht angemeldet" };
      }

      // Update current admin to member
      const { error: updateAdminError } = await supabase
        .from("household_members")
        .update({ role: "member" })
        .eq("user_id", user.id)
        .eq("household_id", state.household.id);

      if (updateAdminError) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: "Fehler beim Aktualisieren der Admin-Rolle" };
      }

      // Update new admin
      const { error: updateNewAdminError } = await supabase
        .from("household_members")
        .update({ role: "admin" })
        .eq("user_id", newAdminUserId)
        .eq("household_id", state.household.id);

      if (updateNewAdminError) {
        // Rollback
        await supabase
          .from("household_members")
          .update({ role: "admin" })
          .eq("user_id", user.id)
          .eq("household_id", state.household.id);
        setState((prev) => ({ ...prev, isLoading: false }));
        return { error: "Fehler beim Übertragen der Admin-Rolle" };
      }

      await fetchHousehold();

      return { error: null };
    } catch (error) {
      console.error("Error transferring admin:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const generateInviteCode = async (expiresInDays = 7) => {
    setState((prev) => ({ ...prev, error: null }));

    try {
      if (!state.isAdmin || !state.household) {
        return { error: "Nur Admins können Einladungscodes erstellen" };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { error: "Nicht angemeldet" };
      }

      // Generate code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { error: insertError } = await supabase.from("invite_codes").insert({
        code,
        household_id: state.household.id,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      });

      if (insertError) {
        return { error: "Fehler beim Erstellen des Einladungscodes" };
      }

      await fetchHousehold();

      return { error: null, code };
    } catch (error) {
      console.error("Error generating invite code:", error);
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const revokeInviteCode = async (codeId: string) => {
    setState((prev) => ({ ...prev, error: null }));

    try {
      if (!state.isAdmin) {
        return { error: "Nur Admins können Einladungscodes widerrufen" };
      }

      const { error: deleteError } = await supabase
        .from("invite_codes")
        .delete()
        .eq("id", codeId);

      if (deleteError) {
        return { error: "Fehler beim Widerrufen des Einladungscodes" };
      }

      await fetchHousehold();

      return { error: null };
    } catch (error) {
      console.error("Error revoking invite code:", error);
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return (
    <HouseholdContext.Provider
      value={{
        ...state,
        fetchHousehold,
        createHousehold,
        joinHousehold,
        leaveHousehold,
        removeMember,
        transferAdmin,
        generateInviteCode,
        revokeInviteCode,
        clearError,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
}
