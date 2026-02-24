import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateInviteCodeSchema } from "@/lib/validations/household";

// POST /api/households/invite-code - Generate a new invite code
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
    const validationResult = generateInviteCodeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || "Ungültige Eingabe" },
        { status: 400 }
      );
    }

    const { expiresInDays } = validationResult.data;

    // Get user's household and verify admin role
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

    if (membershipData.role !== "admin") {
      return NextResponse.json(
        { error: "Nur Admins können Einladungscodes erstellen" },
        { status: 403 }
      );
    }

    // Generate unique code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars: I, O, 0, 1
    let code = "";
    let attempts = 0;
    let codeCreated = false;

    while (!codeCreated && attempts < 10) {
      code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const { data: existingCode } = await supabase
        .from("invite_codes")
        .select("id")
        .eq("code", code)
        .single();

      if (!existingCode) {
        codeCreated = true;
      }
      attempts++;
    }

    if (!codeCreated) {
      return NextResponse.json(
        { error: "Fehler beim Generieren des Codes. Bitte versuche es erneut." },
        { status: 500 }
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Insert invite code
    const { data: inviteCodeData, error: insertError } = await supabase
      .from("invite_codes")
      .insert({
        code,
        household_id: membershipData.household_id,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating invite code:", insertError);
      return NextResponse.json(
        { error: "Fehler beim Erstellen des Einladungscodes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: inviteCodeData.code,
      expiresAt: inviteCodeData.expires_at,
      createdAt: inviteCodeData.created_at,
    });
  } catch (error) {
    console.error("Error generating invite code:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
