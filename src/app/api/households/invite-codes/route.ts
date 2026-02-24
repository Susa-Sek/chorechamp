import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/households/invite-codes - List active invite codes for admin
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

    // Get user's household membership
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

    // Only admins can see invite codes
    if (membershipData.role !== "admin") {
      return NextResponse.json(
        { error: "Nur Admins können Einladungscodes einsehen" },
        { status: 403 }
      );
    }

    // Fetch active invite codes
    const { data: codesData, error: codesError } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("household_id", membershipData.household_id)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (codesError) {
      console.error("Error fetching invite codes:", codesError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Einladungscodes" },
        { status: 500 }
      );
    }

    const inviteCodes = (codesData || []).map((c) => ({
      id: c.id,
      code: c.code,
      householdId: c.household_id,
      createdBy: c.created_by,
      expiresAt: c.expires_at,
      usedAt: c.used_at,
      createdAt: c.created_at,
    }));

    return NextResponse.json({
      inviteCodes,
    });
  } catch (error) {
    console.error("Error fetching invite codes:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
