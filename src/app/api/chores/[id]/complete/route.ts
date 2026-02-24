import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/chores/[id]/complete - Mark chore as complete
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
      .select("id, title, points, status, household_id")
      .eq("id", id)
      .eq("household_id", membership.household_id)
      .single();

    if (choreError || !chore) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Check if already completed
    if (chore.status === "completed") {
      return NextResponse.json(
        { error: "Aufgabe bereits erledigt" },
        { status: 400 }
      );
    }

    // Update chore to completed
    const { error: updateError } = await supabase
      .from("chores")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: user.id,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error completing chore:", updateError);
      return NextResponse.json(
        { error: "Fehler beim Abschliessen der Aufgabe" },
        { status: 500 }
      );
    }

    // Record completion for undo/history
    const { error: completionError } = await supabase
      .from("chore_completions")
      .insert({
        chore_id: id,
        user_id: user.id,
        points_awarded: chore.points,
      });

    if (completionError) {
      console.error("Error recording completion:", completionError);
      // Don't fail the request, just log the error
    }

    // Update user's points (add to their profile)
    // This could be done via a database trigger, but we'll do it here for clarity
    const { error: pointsError } = await supabase.rpc("add_points_to_user", {
      user_id: user.id,
      points_to_add: chore.points,
    });

    // If the RPC doesn't exist, we'll just log the error
    // The points system will be properly implemented in PROJ-5
    if (pointsError) {
      console.log(
        "Note: Points RPC not available. Points will be tracked in PROJ-5"
      );
    }

    return NextResponse.json({
      success: true,
      pointsEarned: chore.points,
      message: `${chore.points} Punkte verdient!`,
    });
  } catch (error) {
    console.error("Error completing chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}