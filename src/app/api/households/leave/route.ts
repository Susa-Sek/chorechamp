import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/households/leave - Leave current household
export async function POST() {
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

    // Get user's household membership
    const { data: membershipData, error: membershipError } = await supabase
      .from("household_members")
      .select("id, household_id, role")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membershipData) {
      return NextResponse.json(
        { error: "Du bist kein Mitglied eines Haushalts" },
        { status: 400 }
      );
    }

    // Get all members of the household
    const { data: allMembers, error: membersError } = await supabase
      .from("household_members")
      .select("id, role")
      .eq("household_id", membershipData.household_id);

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Mitglieder" },
        { status: 500 }
      );
    }

    // Check if admin with other members
    if (membershipData.role === "admin" && allMembers && allMembers.length > 1) {
      return NextResponse.json(
        { error: "Als Admin kannst du nicht gehen, während andere Mitglieder vorhanden sind. Übertrage zuerst die Admin-Rolle." },
        { status: 400 }
      );
    }

    // Delete membership
    const { error: deleteError } = await supabase
      .from("household_members")
      .delete()
      .eq("id", membershipData.id);

    if (deleteError) {
      console.error("Error leaving household:", deleteError);
      return NextResponse.json(
        { error: "Fehler beim Verlassen des Haushalts" },
        { status: 500 }
      );
    }

    // If last member, delete household
    if (allMembers && allMembers.length === 1) {
      const { error: deleteHouseholdError } = await supabase
        .from("households")
        .delete()
        .eq("id", membershipData.household_id);

      if (deleteHouseholdError) {
        console.error("Error deleting household:", deleteHouseholdError);
        // Don't fail - user has already left
      }
    }

    return NextResponse.json({
      success: true,
      message: "Haushalt erfolgreich verlassen",
    });
  } catch (error) {
    console.error("Error leaving household:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
