import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createHouseholdSchema } from "@/lib/validations/household";

// GET /api/households - Get current user's household
export async function GET() {
  try {
    const supabase = await createClient();

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

    // Fetch user's household membership with household details
    const { data: membershipData, error: membershipError } = await supabase
      .from("household_members")
      .select(
        `
        role,
        joined_at,
        household:households (
          id,
          name,
          created_by,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membershipData) {
      return NextResponse.json(
        { household: null, message: "Kein Haushalt gefunden" },
        { status: 200 }
      );
    }

    const household = membershipData.household as unknown as {
      id: string;
      name: string;
      created_by: string;
      created_at: string;
      updated_at: string;
    };

    // Get member count
    const { count: memberCount } = await supabase
      .from("household_members")
      .select("*", { count: "exact", head: true })
      .eq("household_id", household.id);

    return NextResponse.json({
      household: {
        id: household.id,
        name: household.name,
        createdBy: household.created_by,
        createdAt: household.created_at,
        updatedAt: household.updated_at,
      },
      membership: {
        role: membershipData.role,
        joinedAt: membershipData.joined_at,
      },
      memberCount: memberCount || 0,
    });
  } catch (error) {
    console.error("Error fetching household:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// POST /api/households - Create a new household
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createHouseholdSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || "Ungültige Eingabe" },
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

    // Check if user is already in a household
    const { data: existingMembership } = await supabase
      .from("household_members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "Du bist bereits Mitglied eines Haushalts" },
        { status: 400 }
      );
    }

    // Create household
    const { data: householdData, error: householdError } = await supabase
      .from("households")
      .insert({
        name,
        created_by: user.id,
      })
      .select()
      .single();

    if (householdError) {
      console.error("Error creating household:", householdError);
      return NextResponse.json(
        { error: "Fehler beim Erstellen des Haushalts" },
        { status: 500 }
      );
    }

    // Add user as admin member
    const { error: memberError } = await supabase
      .from("household_members")
      .insert({
        household_id: householdData.id,
        user_id: user.id,
        role: "admin",
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      // Rollback household creation
      await supabase.from("households").delete().eq("id", householdData.id);
      return NextResponse.json(
        { error: "Fehler beim Hinzufügen als Mitglied" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      household: {
        id: householdData.id,
        name: householdData.name,
        createdBy: householdData.created_by,
        createdAt: householdData.created_at,
        updatedAt: householdData.updated_at,
      },
    });
  } catch (error) {
    console.error("Error creating household:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
