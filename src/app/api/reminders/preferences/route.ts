import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateReminderPreferencesSchema } from "@/lib/validations/recurring";

// GET /api/reminders/preferences - Get user's reminder preferences
export async function GET() {
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

    // Get reminder preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from("reminder_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If no preferences exist, return defaults
    if (preferencesError && preferencesError.code === "PGRST116") {
      return NextResponse.json({
        preferences: {
          id: null,
          userId: user.id,
          reminderType: "day_before",
          customHours: null,
          pushEnabled: false,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
        },
      });
    }

    if (preferencesError) {
      console.error("Error fetching preferences:", preferencesError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Einstellungen" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: {
        id: preferences.id,
        userId: preferences.user_id,
        reminderType: preferences.reminder_type,
        customHours: preferences.custom_hours,
        pushEnabled: preferences.push_enabled,
        quietHoursStart: preferences.quiet_hours_start,
        quietHoursEnd: preferences.quiet_hours_end,
      },
    });
  } catch (error) {
    console.error("Error fetching reminder preferences:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// PATCH /api/reminders/preferences - Update user's reminder preferences
export async function PATCH(request: Request) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateReminderPreferencesSchema.safeParse(body);

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
    const updateFields: Record<string, unknown> = {};
    if (updateData.reminderType !== undefined) {
      updateFields.reminder_type = updateData.reminderType;
    }
    if (updateData.customHours !== undefined) {
      updateFields.custom_hours = updateData.customHours;
    }
    if (updateData.pushEnabled !== undefined) {
      updateFields.push_enabled = updateData.pushEnabled;
    }
    if (updateData.quietHoursStart !== undefined) {
      updateFields.quiet_hours_start = updateData.quietHoursStart;
    }
    if (updateData.quietHoursEnd !== undefined) {
      updateFields.quiet_hours_end = updateData.quietHoursEnd;
    }

    // Upsert preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from("reminder_preferences")
      .upsert(
        {
          user_id: user.id,
          ...updateFields,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (preferencesError) {
      console.error("Error updating preferences:", preferencesError);
      return NextResponse.json(
        { error: "Fehler beim Speichern der Einstellungen" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: {
        id: preferences.id,
        userId: preferences.user_id,
        reminderType: preferences.reminder_type,
        customHours: preferences.custom_hours,
        pushEnabled: preferences.push_enabled,
        quietHoursStart: preferences.quiet_hours_start,
        quietHoursEnd: preferences.quiet_hours_end,
      },
    });
  } catch (error) {
    console.error("Error updating reminder preferences:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}