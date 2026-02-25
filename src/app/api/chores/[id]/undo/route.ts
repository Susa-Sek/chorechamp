import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/chores/[id]/undo - Undo chore completion
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    // Get user's household
    const { data: membership, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Kein Haushalt gefunden" },
        { status: 400 }
      );
    }

    // Fetch chore
    const { data: chore, error: choreError } = await supabase
      .from("chores")
      .select("id, title, points, status, completed_at, completed_by, household_id")
      .eq("id", id)
      .eq("household_id", membership.household_id)
      .single();

    if (choreError || !chore) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Check if chore is completed
    if (chore.status !== "completed") {
      return NextResponse.json(
        { error: "Aufgabe ist nicht erledigt" },
        { status: 400 }
      );
    }

    // Check if within 24 hours
    if (!chore.completed_at) {
      return NextResponse.json(
        { error: "Kein Abschlussdatum gefunden" },
        { status: 400 }
      );
    }

    const completedAt = new Date(chore.completed_at);
    const now = new Date();
    const diffMs = now.getTime() - completedAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours > 24) {
      return NextResponse.json(
        { error: "Ruckgangigmachung nur innerhalb von 24 Stunden moglich" },
        { status: 400 }
      );
    }

    // Update chore back to pending
    const { error: updateError } = await supabase
      .from("chores")
      .update({
        status: "pending",
        completed_at: null,
        completed_by: null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error undoing chore:", updateError);
      return NextResponse.json(
        { error: "Fehler beim Ruckgangigmachen" },
        { status: 500 }
      );
    }

    // Update the completion record
    const { error: completionUpdateError } = await supabase
      .from("chore_completions")
      .update({
        undone_at: new Date().toISOString(),
        undone_by: user.id,
      })
      .eq("chore_id", id)
      .is("undone_at", null);

    if (completionUpdateError) {
      console.error("Error updating completion record:", completionUpdateError);
      // Don't fail the request, just log the error
    }

    // Deduct points from the user who completed the chore
    if (chore.completed_by) {
      const { error: pointsError } = await supabase.rpc(
        "subtract_points_from_user",
        {
          p_user_id: chore.completed_by,
          p_points: chore.points,
          p_transaction_type: "undo",
          p_reference_id: id,
          p_description: `Rueckgaengig gemacht: ${chore.title}`,
          p_created_by: user.id,
        }
      );

      if (pointsError) {
        console.error("Error deducting points:", pointsError);
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: `${chore.points} Punkte abgezogen`,
    });
  } catch (error) {
    console.error("Error undoing chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}