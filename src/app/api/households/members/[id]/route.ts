import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// DELETE /api/households/members/[id] - Remove a member from household
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: memberId } = await params;

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

    // Get the member to remove
    const { data: memberToRemove, error: memberError } = await supabase
      .from("household_members")
      .select("id, household_id, user_id, role")
      .eq("id", memberId)
      .single();

    if (memberError || !memberToRemove) {
      return NextResponse.json(
        { error: "Mitglied nicht gefunden" },
        { status: 404 }
      );
    }

    // Get user's membership and verify admin role
    const { data: userMembership, error: membershipError } = await supabase
      .from("household_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("household_id", memberToRemove.household_id)
      .single();

    if (membershipError || !userMembership) {
      return NextResponse.json(
        { error: "Du bist kein Mitglied dieses Haushalts" },
        { status: 403 }
      );
    }

    // Allow self-removal or admin removal
    if (memberToRemove.user_id !== user.id && userMembership.role !== "admin") {
      return NextResponse.json(
        { error: "Nur Admins können andere Mitglieder entfernen" },
        { status: 403 }
      );
    }

    // Cannot remove the last admin
    if (memberToRemove.role === "admin") {
      const { count: adminCount } = await supabase
        .from("household_members")
        .select("*", { count: "exact", head: true })
        .eq("household_id", memberToRemove.household_id)
        .eq("role", "admin");

      if (adminCount === 1) {
        return NextResponse.json(
          { error: "Der letzte Admin kann nicht entfernt werden. Übertrage zuerst die Admin-Rolle." },
          { status: 400 }
        );
      }
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from("household_members")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      console.error("Error removing member:", deleteError);
      return NextResponse.json(
        { error: "Fehler beim Entfernen des Mitglieds" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mitglied erfolgreich entfernt",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
