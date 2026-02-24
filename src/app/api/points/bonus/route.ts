import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { bonusPointsSchema } from "@/lib/validations/points";

// POST /api/points/bonus - Award bonus points (admin only)
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

    // Get user's household membership with role
    const { data: membership, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Kein Haushalt gefunden" },
        { status: 400 }
      );
    }

    // Check if user is admin
    if (membership.role !== "admin") {
      return NextResponse.json(
        { error: "Nur Administratoren koennen Bonuspunkte vergeben" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = bonusPointsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message || "Ungueltige Eingabe",
        },
        { status: 400 }
      );
    }

    const { userId, points, reason } = validationResult.data;

    // Verify target user is in the same household
    const { data: targetMembership, error: targetError } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("user_id", userId)
      .eq("household_id", membership.household_id)
      .single();

    if (targetError || !targetMembership) {
      return NextResponse.json(
        { error: "Benutzer nicht im Haushalt gefunden" },
        { status: 400 }
      );
    }

    // Award bonus points using RPC function
    const { data: result, error: pointsError } = await supabase.rpc(
      "add_points_to_user",
      {
        p_user_id: userId,
        p_points: points,
        p_transaction_type: "bonus",
        p_reference_id: null,
        p_description: reason || "Bonuspunkte vom Administrator",
        p_created_by: user.id,
      }
    );

    if (pointsError) {
      console.error("Error awarding bonus points:", pointsError);

      // Fallback: Direct insert if RPC doesn't exist
      return await awardBonusPointsFallback(
        supabase,
        userId,
        membership.household_id,
        points,
        reason,
        user.id
      );
    }

    const parsedResult = result as { success: boolean; new_balance?: number; error?: string };

    if (!parsedResult.success) {
      return NextResponse.json(
        { error: parsedResult.error || "Fehler beim Vergeben der Bonuspunkte" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pointsAwarded: points,
      newBalance: parsedResult.new_balance,
      message: `${points} Bonuspunkte erfolgreich vergeben`,
    });
  } catch (error) {
    console.error("Error awarding bonus points:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// Fallback function for awarding points if RPC doesn't exist
async function awardBonusPointsFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  householdId: string,
  points: number,
  reason: string | undefined,
  createdBy: string
) {
  // Get current balance
  const { data: currentBalance, error: balanceError } = await supabase
    .from("point_balances")
    .select("current_balance, total_earned")
    .eq("user_id", userId)
    .maybeSingle();

  if (balanceError) {
    console.error("Error fetching balance:", balanceError);
    return NextResponse.json(
      { error: "Fehler beim Abrufen des Punktestands" },
      { status: 500 }
    );
  }

  const newBalance = (currentBalance?.current_balance || 0) + points;
  const newTotalEarned = (currentBalance?.total_earned || 0) + points;

  // Upsert point balance
  const { error: upsertError } = await supabase
    .from("point_balances")
    .upsert(
      {
        user_id: userId,
        household_id: householdId,
        current_balance: newBalance,
        total_earned: newTotalEarned,
        total_spent: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("Error updating balance:", upsertError);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Punktestands" },
      { status: 500 }
    );
  }

  // Create transaction record
  const { error: txError } = await supabase.from("point_transactions").insert({
    user_id: userId,
    household_id: householdId,
    points: points,
    transaction_type: "bonus",
    reference_id: null,
    description: reason || "Bonuspunkte vom Administrator",
    balance_after: newBalance,
    created_by: createdBy,
  });

  if (txError) {
    console.error("Error creating transaction:", txError);
    // Don't fail, the balance was updated
  }

  return NextResponse.json({
    success: true,
    pointsAwarded: points,
    newBalance: newBalance,
    message: `${points} Bonuspunkte erfolgreich vergeben`,
  });
}