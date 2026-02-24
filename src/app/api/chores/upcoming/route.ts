import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Type for profile data from Supabase
interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

// Type for recurring chore data
interface RecurringData {
  id: string;
  recurrence_type: string;
  recurrence_pattern: Record<string, unknown>;
  next_due_date: string;
  active: boolean;
}

// Type for chore data with joined profiles and recurring
interface ChoreWithJoins {
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
  recurring: RecurringData | null;
}

// Helper to transform chore data
function transformChore(chore: ChoreWithJoins) {
  return {
    id: chore.id,
    householdId: chore.household_id,
    title: chore.title,
    description: chore.description,
    assigneeId: chore.assignee_id,
    createdBy: chore.created_by,
    points: chore.points,
    difficulty: chore.difficulty,
    dueDate: chore.due_date,
    status: chore.status,
    completedAt: chore.completed_at,
    completedBy: chore.completed_by,
    createdAt: chore.created_at,
    updatedAt: chore.updated_at,
    assignee: chore.assignee
      ? {
          id: chore.assignee.id,
          displayName: chore.assignee.display_name,
          avatarUrl: chore.assignee.avatar_url,
        }
      : null,
    recurring: chore.recurring
      ? {
          id: chore.recurring.id,
          recurrenceType: chore.recurring.recurrence_type,
          recurrencePattern: chore.recurring.recurrence_pattern,
          nextDueDate: chore.recurring.next_due_date,
          active: chore.recurring.active,
        }
      : null,
  };
}

// GET /api/chores/upcoming - Get upcoming due chores
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Calculate date range
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    // Query for pending chores with due dates in the specified range
    const { data: chores, error: choresError } = await supabase
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
        recurring:recurring_chores (
          id,
          recurrence_type,
          recurrence_pattern,
          next_due_date,
          active
        )
      `
      )
      .eq("household_id", membership.household_id)
      .eq("status", "pending")
      .gte("due_date", now.toISOString())
      .lte("due_date", endDate.toISOString())
      .order("due_date", { ascending: true })
      .limit(limit);

    if (choresError) {
      console.error("Error fetching upcoming chores:", choresError);
      return NextResponse.json(
        { error: "Fehler beim Laden der anstehenden Aufgaben" },
        { status: 500 }
      );
    }

    // Also get overdue chores
    const { data: overdueChores, error: overdueError } = await supabase
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
        recurring:recurring_chores (
          id,
          recurrence_type,
          recurrence_pattern,
          next_due_date,
          active
        )
      `
      )
      .eq("household_id", membership.household_id)
      .eq("status", "pending")
      .lt("due_date", now.toISOString())
      .not("due_date", "is", null)
      .order("due_date", { ascending: true })
      .limit(limit);

    if (overdueError) {
      console.error("Error fetching overdue chores:", overdueError);
      // Continue without overdue chores
    }

    // Transform data
    const upcomingChores = (chores || []).map((chore) =>
      transformChore({
        ...chore,
        recurring: Array.isArray(chore.recurring)
          ? chore.recurring[0] || null
          : chore.recurring,
      } as unknown as ChoreWithJoins)
    );

    const transformedOverdueChores = (overdueChores || []).map((chore) =>
      transformChore({
        ...chore,
        recurring: Array.isArray(chore.recurring)
          ? chore.recurring[0] || null
          : chore.recurring,
      } as unknown as ChoreWithJoins)
    );

    return NextResponse.json({
      upcoming: upcomingChores,
      overdue: transformedOverdueChores,
      days,
      limit,
    });
  } catch (error) {
    console.error("Error fetching upcoming chores:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}