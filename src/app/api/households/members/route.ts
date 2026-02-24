import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/households/members - List all members of user's household
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht angemeldet" },
        { status: 401 }
      );
    }

    // Get user's household
    const { data: membershipData, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membershipData) {
      return NextResponse.json(
        { error: "Du bist kein Mitglied eines Haushalts" },
        { status: 400 }
      );
    }

    // Fetch all members of the household with profile data
    const { data: membersData, error: membersError } = await supabase
      .from("household_members")
      .select(
        `
        id,
        household_id,
        user_id,
        role,
        joined_at,
        profiles (
          display_name,
          avatar_url
        )
      `
      )
      .eq("household_id", membershipData.household_id)
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Mitglieder" },
        { status: 500 }
      );
    }

    const members = (membersData || []).map((m) => {
      const profile = m.profiles as unknown as { display_name: string; avatar_url: string | null } | null;
      return {
        id: m.id,
        householdId: m.household_id,
        userId: m.user_id,
        role: m.role,
        joinedAt: m.joined_at,
        profile: {
          displayName: profile?.display_name || "Unbekannt",
          avatarUrl: profile?.avatar_url || null,
        },
      };
    });

    return NextResponse.json({
      members,
      isAdmin: membershipData.role === "admin",
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
