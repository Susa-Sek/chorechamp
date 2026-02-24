import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// DELETE /api/households/invite-codes/[id] - Revoke an invite code
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: codeId } = await params;

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

    // Get the invite code
    const { data: inviteCode, error: codeError } = await supabase
      .from("invite_codes")
      .select("id, household_id")
      .eq("id", codeId)
      .single();

    if (codeError || !inviteCode) {
      return NextResponse.json(
        { error: "Einladungscode nicht gefunden" },
        { status: 404 }
      );
    }

    // Verify user is admin of the household
    const { data: membershipData, error: membershipError } = await supabase
      .from("household_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("household_id", inviteCode.household_id)
      .single();

    if (membershipError || !membershipData) {
      return NextResponse.json(
        { error: "Du bist kein Mitglied dieses Haushalts" },
        { status: 403 }
      );
    }

    if (membershipData.role !== "admin") {
      return NextResponse.json(
        { error: "Nur Admins können Einladungscodes widerrufen" },
        { status: 403 }
      );
    }

    // Delete the invite code
    const { error: deleteError } = await supabase
      .from("invite_codes")
      .delete()
      .eq("id", codeId);

    if (deleteError) {
      console.error("Error deleting invite code:", deleteError);
      return NextResponse.json(
        { error: "Fehler beim Widerrufen des Einladungscodes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Einladungscode erfolgreich widerrufen",
    });
  } catch (error) {
    console.error("Error revoking invite code:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
