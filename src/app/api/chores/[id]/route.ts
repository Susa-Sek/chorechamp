import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateChoreSchema } from "@/lib/validations/chore";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Type for profile data from Supabase
interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

// Type for chore data with joined profiles
interface ChoreWithProfiles {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  created_by: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  due_date: string | null;
  status: "pending" | "completed" | "archived";
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  assignee: ProfileData | null;
  creator: ProfileData;
  completer: ProfileData | null;
}

// GET /api/chores/[id] - Get chore details
export async function GET(request: Request, { params }: RouteParams) {
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
      .select(
        `
        id,
        household_id,
        title,
        description,
        assignee_id,
        created_by,
        points,
        difficulty,
        due_date,
        status,
        completed_at,
        completed_by,
        created_at,
        updated_at,
        assignee:profiles!chores_assignee_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        creator:profiles!chores_created_by_fkey (
          id,
          display_name,
          avatar_url
        ),
        completer:profiles!chores_completed_by_fkey (
          id,
          display_name,
          avatar_url
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

    // Cast to our type
    const typedChore = chore as unknown as ChoreWithProfiles;

    return NextResponse.json({
      chore: {
        id: typedChore.id,
        householdId: typedChore.household_id,
        title: typedChore.title,
        description: typedChore.description,
        assigneeId: typedChore.assignee_id,
        createdBy: typedChore.created_by,
        points: typedChore.points,
        difficulty: typedChore.difficulty,
        dueDate: typedChore.due_date,
        status: typedChore.status,
        completedAt: typedChore.completed_at,
        completedBy: typedChore.completed_by,
        createdAt: typedChore.created_at,
        updatedAt: typedChore.updated_at,
        assignee: typedChore.assignee
          ? {
              id: typedChore.assignee.id,
              displayName: typedChore.assignee.display_name,
              avatarUrl: typedChore.assignee.avatar_url,
            }
          : null,
        creator: {
          id: typedChore.creator.id,
          displayName: typedChore.creator.display_name,
          avatarUrl: typedChore.creator.avatar_url,
        },
        completer: typedChore.completer
          ? {
              id: typedChore.completer.id,
              displayName: typedChore.completer.display_name,
              avatarUrl: typedChore.completer.avatar_url,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// PATCH /api/chores/[id] - Update chore
export async function PATCH(request: Request, { params }: RouteParams) {
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

    // Check if chore exists and belongs to user's household
    const { data: existingChore, error: existingError } = await supabase
      .from("chores")
      .select("id, status")
      .eq("id", id)
      .eq("household_id", membership.household_id)
      .single();

    if (existingError || !existingChore) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateChoreSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message || "Ungultige Eingabe",
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Validate assignee is in the same household if provided
    if (updateData.assigneeId) {
      const { data: assigneeMembership } = await supabase
        .from("household_members")
        .select("id")
        .eq("user_id", updateData.assigneeId)
        .eq("household_id", membership.household_id)
        .single();

      if (!assigneeMembership) {
        return NextResponse.json(
          { error: "Zugewiesener Benutzer nicht im Haushalt gefunden" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateFields: Record<string, unknown> = {};
    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.description !== undefined)
      updateFields.description = updateData.description;
    if (updateData.assigneeId !== undefined)
      updateFields.assignee_id = updateData.assigneeId;
    if (updateData.points !== undefined) updateFields.points = updateData.points;
    if (updateData.difficulty !== undefined)
      updateFields.difficulty = updateData.difficulty;
    if (updateData.dueDate !== undefined)
      updateFields.due_date = updateData.dueDate;
    if (updateData.status !== undefined) updateFields.status = updateData.status;

    // Update chore
    const { data: chore, error: choreError } = await supabase
      .from("chores")
      .update(updateFields)
      .eq("id", id)
      .select(
        `
        id,
        household_id,
        title,
        description,
        assignee_id,
        created_by,
        points,
        difficulty,
        due_date,
        status,
        completed_at,
        completed_by,
        created_at,
        updated_at,
        assignee:profiles!chores_assignee_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        creator:profiles!chores_created_by_fkey (
          id,
          display_name,
          avatar_url
        ),
        completer:profiles!chores_completed_by_fkey (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (choreError) {
      console.error("Error updating chore:", choreError);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren der Aufgabe" },
        { status: 500 }
      );
    }

    // Cast to our type
    const typedChore = chore as unknown as ChoreWithProfiles;

    return NextResponse.json({
      chore: {
        id: typedChore.id,
        householdId: typedChore.household_id,
        title: typedChore.title,
        description: typedChore.description,
        assigneeId: typedChore.assignee_id,
        createdBy: typedChore.created_by,
        points: typedChore.points,
        difficulty: typedChore.difficulty,
        dueDate: typedChore.due_date,
        status: typedChore.status,
        completedAt: typedChore.completed_at,
        completedBy: typedChore.completed_by,
        createdAt: typedChore.created_at,
        updatedAt: typedChore.updated_at,
        assignee: typedChore.assignee
          ? {
              id: typedChore.assignee.id,
              displayName: typedChore.assignee.display_name,
              avatarUrl: typedChore.assignee.avatar_url,
            }
          : null,
        creator: {
          id: typedChore.creator.id,
          displayName: typedChore.creator.display_name,
          avatarUrl: typedChore.creator.avatar_url,
        },
        completer: typedChore.completer
          ? {
              id: typedChore.completer.id,
              displayName: typedChore.completer.display_name,
              avatarUrl: typedChore.completer.avatar_url,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error updating chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// DELETE /api/chores/[id] - Delete chore
export async function DELETE(request: Request, { params }: RouteParams) {
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

    // Delete chore (RLS will ensure it belongs to user's household)
    const { error: deleteError } = await supabase
      .from("chores")
      .delete()
      .eq("id", id)
      .eq("household_id", membership.household_id);

    if (deleteError) {
      console.error("Error deleting chore:", deleteError);
      return NextResponse.json(
        { error: "Fehler beim Loschen der Aufgabe" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}