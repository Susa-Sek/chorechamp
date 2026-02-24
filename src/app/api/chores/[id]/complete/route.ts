import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calculateNextOccurrences } from "@/lib/validations/recurring";

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

    // Fetch chore with recurring data
    const { data: chore, error: choreError } = await supabase
      .from("chores")
      .select(
        `
        id,
        title,
        points,
        status,
        household_id,
        recurring:recurring_chores(
          id,
          recurrence_type,
          recurrence_pattern,
          start_date,
          end_date,
          next_due_date,
          active
        )
      `
      )
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

    // Check if this is an active recurring chore
    const recurringData = chore.recurring as unknown as {
      id: string;
      recurrence_type: string;
      recurrence_pattern: Record<string, unknown>;
      start_date: string;
      end_date: string | null;
      next_due_date: string;
      active: boolean;
    } | null;

    const isRecurring = recurringData && recurringData.active;

    // Check if recurring schedule has ended
    if (isRecurring && recurringData.end_date) {
      const endDate = new Date(recurringData.end_date);
      if (endDate < new Date()) {
        // Recurrence has ended, mark as completed normally
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

        // Record completion
        await supabase.from("chore_completions").insert({
          chore_id: id,
          user_id: user.id,
          points_awarded: chore.points,
        });

        // Update points (ignore errors if RPC not available)
        const { error: pointsError } = await supabase.rpc("add_points_to_user", {
          user_id: user.id,
          points_to_add: chore.points,
        });
        if (pointsError) {
          console.log("Note: Points RPC not available:", pointsError.message);
        }

        return NextResponse.json({
          success: true,
          pointsEarned: chore.points,
          message: `${chore.points} Punkte verdient!`,
        });
      }
    }

    let nextDueDateResponse: string | null = null;

    if (isRecurring) {
      // Calculate next due date for recurring chore
      const nextDates = calculateNextOccurrences(
        recurringData.recurrence_type,
        recurringData.recurrence_pattern,
        recurringData.start_date,
        2 // Get next 2 occurrences to find the one after current
      );

      // Find the next occurrence after now
      const now = new Date();
      const nextDueDate = nextDates.find((date) => date > now) || nextDates[0];

      if (!nextDueDate) {
        // No more occurrences, complete normally
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

        // Record completion
        await supabase.from("chore_completions").insert({
          chore_id: id,
          user_id: user.id,
          points_awarded: chore.points,
        });

        // Update points (ignore errors if RPC not available)
        const { error: pointsError } = await supabase.rpc("add_points_to_user", {
          user_id: user.id,
          points_to_add: chore.points,
        });
        if (pointsError) {
          console.log("Note: Points RPC not available:", pointsError.message);
        }

        return NextResponse.json({
          success: true,
          pointsEarned: chore.points,
          message: `${chore.points} Punkte verdient!`,
        });
      }

      // Reset chore for next occurrence (keep status as pending)
      const { error: updateError } = await supabase
        .from("chores")
        .update({
          status: "pending",
          due_date: nextDueDate.toISOString(),
          completed_at: new Date().toISOString(),
          completed_by: user.id,
        })
        .eq("id", id);

      if (updateError) {
        console.error("Error resetting recurring chore:", updateError);
        return NextResponse.json(
          { error: "Fehler beim Zuruecksetzen der Aufgabe" },
          { status: 500 }
        );
      }

      // Update next_due_date in recurring_chores table
      const { error: recurringUpdateError } = await supabase
        .from("recurring_chores")
        .update({
          next_due_date: nextDueDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", recurringData.id);

      if (recurringUpdateError) {
        console.error("Error updating recurring schedule:", recurringUpdateError);
        // Don't fail the request, just log the error
      }

      nextDueDateResponse = nextDueDate.toISOString();
    } else {
      // Regular chore - mark as completed
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
      message: nextDueDateResponse
        ? `${chore.points} Punkte verdient! Naechste Faelligkeit: ${new Date(nextDueDateResponse).toLocaleDateString("de-DE")}`
        : `${chore.points} Punkte verdient!`,
      isRecurring: isRecurring,
      nextDueDate: nextDueDateResponse,
    });
  } catch (error) {
    console.error("Error completing chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}