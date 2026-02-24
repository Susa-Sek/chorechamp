import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createChoreSchema, choreListFiltersSchema } from "@/lib/validations/chore";

// Type for profile data from Supabase
interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

// Type for recurring chore data
type RecurringData = {
  id: string;
  recurrence_type: string;
  recurrence_pattern: Record<string, unknown>;
  next_due_date: string;
  active: boolean;
} | null;

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
  recurring: RecurringData[] | null;
}

// Helper to transform chore data
function transformChore(chore: ChoreWithProfiles) {
  // Extract recurring data (it comes as an array from Supabase join)
  const recurringData = chore.recurring && chore.recurring.length > 0 ? chore.recurring[0] : null;

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
    creator: {
      id: chore.creator.id,
      displayName: chore.creator.display_name,
      avatarUrl: chore.creator.avatar_url,
    },
    completer: chore.completer
      ? {
          id: chore.completer.id,
          displayName: chore.completer.display_name,
          avatarUrl: chore.completer.avatar_url,
        }
      : null,
    recurring: recurringData
      ? {
          id: recurringData.id,
          recurrenceType: recurringData.recurrence_type,
          recurrencePattern: recurringData.recurrence_pattern,
          nextDueDate: recurringData.next_due_date,
          active: recurringData.active,
        }
      : null,
  };
}

// GET /api/chores - List chores with filters and pagination
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
    const filters = choreListFiltersSchema.parse({
      status: searchParams.get("status") || "all",
      assigneeId: searchParams.get("assigneeId") || undefined,
      difficulty: searchParams.get("difficulty") || "all",
      search: searchParams.get("search") || undefined,
    });

    const sortField = searchParams.get("sortField") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
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
        ),
        recurring:recurring_chores(
          id,
          recurrence_type,
          recurrence_pattern,
          next_due_date,
          active
        )
      `,
        { count: "exact" }
      )
      .eq("household_id", membership.household_id);

    // Apply filters
    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    } else {
      // By default, exclude archived chores
      query = query.neq("status", "archived");
    }

    if (filters.assigneeId) {
      query = query.eq("assignee_id", filters.assigneeId);
    }

    if (filters.difficulty && filters.difficulty !== "all") {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }

    // Apply sorting
    const sortColumnMap: Record<string, string> = {
      dueDate: "due_date",
      createdAt: "created_at",
      points: "points",
      difficulty: "difficulty",
      title: "title",
    };

    const column = sortColumnMap[sortField] || "created_at";
    query = query.order(column, { ascending: sortDirection === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: chores, error: choresError, count } = await query;

    if (choresError) {
      console.error("Error fetching chores:", choresError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Aufgaben" },
        { status: 500 }
      );
    }

    // Transform data to match our type
    const transformedChores = (chores || []).map((chore) =>
      transformChore(chore as unknown as ChoreWithProfiles)
    );

    return NextResponse.json({
      chores: transformedChores,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching chores:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// POST /api/chores - Create a new chore
export async function POST(request: Request) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createChoreSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message || "Ungultige Eingabe",
        },
        { status: 400 }
      );
    }

    const { title, description, assigneeId, points, difficulty, dueDate } =
      validationResult.data;

    // Validate assignee is in the same household if provided
    if (assigneeId) {
      const { data: assigneeMembership } = await supabase
        .from("household_members")
        .select("id")
        .eq("user_id", assigneeId)
        .eq("household_id", membership.household_id)
        .single();

      if (!assigneeMembership) {
        return NextResponse.json(
          { error: "Zugewiesener Benutzer nicht im Haushalt gefunden" },
          { status: 400 }
        );
      }
    }

    // Create chore
    const { data: chore, error: choreError } = await supabase
      .from("chores")
      .insert({
        household_id: membership.household_id,
        title,
        description: description || null,
        assignee_id: assigneeId || null,
        created_by: user.id,
        points,
        difficulty,
        due_date: dueDate || null,
        status: "pending",
      })
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
        )
      `
      )
      .single();

    if (choreError) {
      console.error("Error creating chore:", choreError);
      return NextResponse.json(
        { error: "Fehler beim Erstellen der Aufgabe" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      chore: transformChore(chore as unknown as ChoreWithProfiles),
    });
  } catch (error) {
    console.error("Error creating chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}