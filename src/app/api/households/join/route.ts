import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { joinHouseholdSchema } from "@/lib/validations/household";

// POST /api/households/join - Join a household via invite code
export async function POST(request: Request) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = joinHouseholdSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || "Ungültige Eingabe" },
        { status: 400 }
      );
    }

    const { code } = validationResult.data;

    // Check if user is already in a household
    const { data: existingMembership } = await supabase
      .from("household_members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "Du bist bereits Mitglied eines Haushalts" },
        { status: 400 }
      );
    }

    // Validate invite code
    const { data: inviteCode, error: codeError } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (codeError || !inviteCode) {
      return NextResponse.json(
        { error: "Ungültiger oder abgelaufener Einladungscode" },
        { status: 400 }
      );
    }

    // Add user as member
    const { error: memberError } = await supabase
      .from("household_members")
      .insert({
        household_id: inviteCode.household_id,
        user_id: user.id,
        role: "member",
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json(
        { error: "Fehler beim Beitreten des Haushalts" },
        { status: 500 }
      );
    }

    // Mark code as used
    const { error: updateCodeError } = await supabase
      .from("invite_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", inviteCode.id);

    if (updateCodeError) {
      console.error("Error updating invite code:", updateCodeError);
      // Don't fail the request - user is already a member
    }

    return NextResponse.json({
      success: true,
      message: "Erfolgreich beigetreten",
    });
  } catch (error) {
    console.error("Error joining household:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
