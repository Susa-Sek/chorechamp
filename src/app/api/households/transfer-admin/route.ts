import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { transferAdminSchema } from "@/lib/validations/household";

// POST /api/households/transfer-admin - Transfer admin role to another member
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
    const validationResult = transferAdminSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || "Ungültige Eingabe" },
        { status: 400 }
      );
    }

    const { newAdminUserId } = validationResult.data;

    // Get user's household membership
    const { data: userMembership, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !userMembership) {
      return NextResponse.json(
        { error: "Du bist kein Mitglied eines Haushalts" },
        { status: 400 }
      );
    }

    // Verify user is admin
    if (userMembership.role !== "admin") {
      return NextResponse.json(
        { error: "Nur Admins können die Admin-Rolle übertragen" },
        { status: 403 }
      );
    }

    // Verify new admin is member of same household
    const { data: newAdminMembership, error: newAdminError } = await supabase
      .from("household_members")
      .select("id, role")
      .eq("user_id", newAdminUserId)
      .eq("household_id", userMembership.household_id)
      .single();

    if (newAdminError || !newAdminMembership) {
      return NextResponse.json(
        { error: "Das angegebene Mitglied wurde nicht gefunden" },
        { status: 404 }
      );
    }

    // Cannot transfer to self
    if (newAdminUserId === user.id) {
      return NextResponse.json(
        { error: "Du kannst die Admin-Rolle nicht an dich selbst übertragen" },
        { status: 400 }
      );
    }

    // Update current admin to member
    const { error: updateAdminError } = await supabase
      .from("household_members")
      .update({ role: "member" })
      .eq("user_id", user.id)
      .eq("household_id", userMembership.household_id);

    if (updateAdminError) {
      console.error("Error updating admin role:", updateAdminError);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren der Admin-Rolle" },
        { status: 500 }
      );
    }

    // Update new admin
    const { error: updateNewAdminError } = await supabase
      .from("household_members")
      .update({ role: "admin" })
      .eq("id", newAdminMembership.id);

    if (updateNewAdminError) {
      console.error("Error updating new admin role:", updateNewAdminError);
      // Rollback - restore admin role
      await supabase
        .from("household_members")
        .update({ role: "admin" })
        .eq("user_id", user.id)
        .eq("household_id", userMembership.household_id);

      return NextResponse.json(
        { error: "Fehler beim Übertragen der Admin-Rolle" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin-Rolle erfolgreich übertragen",
    });
  } catch (error) {
    console.error("Error transferring admin:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
