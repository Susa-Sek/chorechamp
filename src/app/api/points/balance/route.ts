import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/points/balance - Get current user's point balance and streak
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

    // Get user's household membership
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

    // Get point balance
    const { data: balance, error: balanceError } = await supabase
      .from("point_balances")
      .select("id, user_id, household_id, current_balance, total_earned, total_spent, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (balanceError) {
      console.error("Error fetching balance:", balanceError);
      return NextResponse.json(
        { error: "Fehler beim Laden des Punktestands" },
        { status: 500 }
      );
    }

    // Get streak
    const { data: streak, error: streakError } = await supabase
      .from("user_streaks")
      .select("id, user_id, current_streak, longest_streak, last_completion_date, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (streakError) {
      console.error("Error fetching streak:", streakError);
      // Don't fail the request, just log the error
    }

    // Transform to camelCase
    const response = {
      balance: balance
        ? {
            id: balance.id,
            userId: balance.user_id,
            householdId: balance.household_id,
            currentBalance: balance.current_balance,
            totalEarned: balance.total_earned,
            totalSpent: balance.total_spent,
            updatedAt: balance.updated_at,
          }
        : null,
      streak: streak
        ? {
            id: streak.id,
            userId: streak.user_id,
            currentStreak: streak.current_streak,
            longestStreak: streak.longest_streak,
            lastCompletionDate: streak.last_completion_date,
            updatedAt: streak.updated_at,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching point balance:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}