import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  createRecurringSchema,
  updateRecurringSchema,
  calculateNextOccurrences,
} from "@/lib/validations/recurring";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/chores/[id]/recurring - Get recurrence details for a chore
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

    // Verify chore belongs to user's household
    const { data: chore, error: choreError } = await supabase
      .from("chores")
      .select("id, household_id")
      .eq("id", id)
      .eq("household_id", membership.household_id)
      .single();

    if (choreError || !chore) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Get recurring chore data
    const { data: recurring, error: recurringError } = await supabase
      .from("recurring_chores")
      .select("*")
      .eq("chore_id", id)
      .eq("active", true)
      .single();

    if (recurringError && recurringError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching recurring chore:", recurringError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Wiederholung" },
        { status: 500 }
      );
    }

    if (!recurring) {
      return NextResponse.json({ recurring: null });
    }

    // Calculate upcoming occurrences
    const upcomingDates = calculateNextOccurrences(
      recurring.recurrence_type,
      recurring.recurrence_pattern as Record<string, unknown>,
      recurring.start_date,
      10
    );

    return NextResponse.json({
      recurring: {
        id: recurring.id,
        householdId: recurring.household_id,
        choreId: recurring.chore_id,
        recurrenceType: recurring.recurrence_type,
        recurrencePattern: recurring.recurrence_pattern,
        startDate: recurring.start_date,
        endDate: recurring.end_date,
        nextDueDate: recurring.next_due_date,
        active: recurring.active,
        createdBy: recurring.created_by,
        createdAt: recurring.created_at,
        updatedAt: recurring.updated_at,
        upcomingDates: upcomingDates.map((d) => d.toISOString()),
      },
    });
  } catch (error) {
    console.error("Error fetching recurring chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// POST /api/chores/[id]/recurring - Create recurring schedule for a chore
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

    // Verify chore belongs to user's household
    const { data: chore, error: choreError } = await supabase
      .from("chores")
      .select("id, household_id, due_date")
      .eq("id", id)
      .eq("household_id", membership.household_id)
      .single();

    if (choreError || !chore) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Check if recurring schedule already exists
    const { data: existingRecurring } = await supabase
      .from("recurring_chores")
      .select("id")
      .eq("chore_id", id)
      .eq("active", true)
      .single();

    if (existingRecurring) {
      return NextResponse.json(
        { error: "Diese Aufgabe hat bereits eine aktive Wiederholung" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createRecurringSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message || "Ungultige Eingabe",
        },
        { status: 400 }
      );
    }

    const { recurrenceType, recurrencePattern, startDate, endDate } =
      validationResult.data;

    // Calculate next due date
    const start = startDate ? new Date(startDate) : new Date();
    const nextDates = calculateNextOccurrences(
      recurrenceType,
      recurrencePattern as unknown as Record<string, unknown>,
      start.toISOString(),
      1
    );
    const nextDueDate = nextDates[0] || start;

    // Create recurring chore
    const { data: recurring, error: recurringError } = await supabase
      .from("recurring_chores")
      .insert({
        household_id: membership.household_id,
        chore_id: id,
        recurrence_type: recurrenceType,
        recurrence_pattern: recurrencePattern,
        start_date: start.toISOString(),
        end_date: endDate || null,
        next_due_date: nextDueDate.toISOString(),
        active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (recurringError) {
      console.error("Error creating recurring chore:", recurringError);
      return NextResponse.json(
        { error: "Fehler beim Erstellen der Wiederholung" },
        { status: 500 }
      );
    }

    // Update chore's due date to next occurrence
    await supabase
      .from("chores")
      .update({ due_date: nextDueDate.toISOString() })
      .eq("id", id);

    return NextResponse.json({
      recurring: {
        id: recurring.id,
        householdId: recurring.household_id,
        choreId: recurring.chore_id,
        recurrenceType: recurring.recurrence_type,
        recurrencePattern: recurring.recurrence_pattern,
        startDate: recurring.start_date,
        endDate: recurring.end_date,
        nextDueDate: recurring.next_due_date,
        active: recurring.active,
        createdBy: recurring.created_by,
        createdAt: recurring.created_at,
        updatedAt: recurring.updated_at,
      },
    });
  } catch (error) {
    console.error("Error creating recurring chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// PATCH /api/chores/[id]/recurring - Update recurrence pattern
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

    // Verify chore belongs to user's household
    const { data: chore, error: choreError } = await supabase
      .from("chores")
      .select("id, household_id")
      .eq("id", id)
      .eq("household_id", membership.household_id)
      .single();

    if (choreError || !chore) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Get existing recurring schedule
    const { data: existingRecurring, error: existingError } = await supabase
      .from("recurring_chores")
      .select("*")
      .eq("chore_id", id)
      .eq("active", true)
      .single();

    if (existingError || !existingRecurring) {
      return NextResponse.json(
        { error: "Keine aktive Wiederholung gefunden" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateRecurringSchema.safeParse(body);

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

    // Build update object
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updateData.recurrenceType) {
      updateFields.recurrence_type = updateData.recurrenceType;
    }
    if (updateData.recurrencePattern) {
      updateFields.recurrence_pattern = updateData.recurrencePattern;
    }
    if (updateData.startDate) {
      updateFields.start_date = updateData.startDate;
    }
    if (updateData.endDate !== undefined) {
      updateFields.end_date = updateData.endDate;
    }
    if (updateData.active !== undefined) {
      updateFields.active = updateData.active;
    }

    // Recalculate next due date if pattern changed
    if (updateData.recurrenceType || updateData.recurrencePattern) {
      const nextDates = calculateNextOccurrences(
        updateData.recurrenceType || existingRecurring.recurrence_type,
        (updateData.recurrencePattern || existingRecurring.recurrence_pattern) as Record<string, unknown>,
        updateData.startDate || existingRecurring.start_date,
        1
      );
      updateFields.next_due_date = nextDates[0]?.toISOString() || existingRecurring.next_due_date;
    }

    // Update recurring chore
    const { data: recurring, error: recurringError } = await supabase
      .from("recurring_chores")
      .update(updateFields)
      .eq("id", existingRecurring.id)
      .select()
      .single();

    if (recurringError) {
      console.error("Error updating recurring chore:", recurringError);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren der Wiederholung" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      recurring: {
        id: recurring.id,
        householdId: recurring.household_id,
        choreId: recurring.chore_id,
        recurrenceType: recurring.recurrence_type,
        recurrencePattern: recurring.recurrence_pattern,
        startDate: recurring.start_date,
        endDate: recurring.end_date,
        nextDueDate: recurring.next_due_date,
        active: recurring.active,
        createdBy: recurring.created_by,
        createdAt: recurring.created_at,
        updatedAt: recurring.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating recurring chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// DELETE /api/chores/[id]/recurring - Stop recurrence
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

    // Verify chore belongs to user's household
    const { data: chore, error: choreError } = await supabase
      .from("chores")
      .select("id, household_id")
      .eq("id", id)
      .eq("household_id", membership.household_id)
      .single();

    if (choreError || !chore) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Deactivate recurring schedule (soft delete)
    const { error: recurringError } = await supabase
      .from("recurring_chores")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("chore_id", id)
      .eq("active", true);

    if (recurringError) {
      console.error("Error deactivating recurring chore:", recurringError);
      return NextResponse.json(
        { error: "Fehler beim Stoppen der Wiederholung" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating recurring chore:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}