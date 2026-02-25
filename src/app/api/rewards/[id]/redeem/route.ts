import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/rewards/[id]/redeem - Redeem a reward
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

    // Try to use RPC function first
    const { data: result, error: redeemError } = await supabase.rpc(
      "redeem_reward",
      {
        p_reward_id: id,
        p_user_id: user.id,
      }
    );

    if (redeemError) {
      console.error("Error calling redeem_reward RPC:", redeemError);
      // Fallback to manual implementation
      return await redeemRewardFallback(supabase, id, user.id, membership.household_id);
    }

    const parsedResult = result as { success: boolean; points_spent?: number; new_balance?: number; error?: string };

    if (!parsedResult.success) {
      const statusCode = parsedResult.error?.includes("Nicht genuegend")
        ? 400
        : parsedResult.error?.includes("nicht gefunden")
        ? 404
        : 500;
      return NextResponse.json(
        { error: parsedResult.error || "Fehler beim Einloesen der Belohnung" },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      pointsSpent: parsedResult.points_spent,
      newBalance: parsedResult.new_balance,
      message: "Belohnung erfolgreich eingelöst",
    });
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// Fallback implementation if RPC doesn't exist
async function redeemRewardFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rewardId: string,
  userId: string,
  householdId: string
) {
  // Get reward details
  const { data: reward, error: rewardError } = await supabase
    .from("rewards")
    .select("id, household_id, point_cost, quantity_available, quantity_claimed, status")
    .eq("id", rewardId)
    .single();

  if (rewardError || !reward) {
    return NextResponse.json(
      { error: "Belohnung nicht gefunden" },
      { status: 404 }
    );
  }

  // Verify reward belongs to same household
  if (reward.household_id !== householdId) {
    return NextResponse.json(
      { error: "Belohnung nicht gefunden" },
      { status: 404 }
    );
  }

  // Check reward is published
  if (reward.status !== "published") {
    return NextResponse.json(
      { error: "Belohnung ist nicht verfügbar" },
      { status: 400 }
    );
  }

  // Check quantity if limited
  if (
    reward.quantity_available !== null &&
    reward.quantity_claimed >= reward.quantity_available
  ) {
    return NextResponse.json(
      { error: "Belohnung ist ausverkauft" },
      { status: 400 }
    );
  }

  // Get user's point balance
  const { data: balance, error: balanceError } = await supabase
    .from("point_balances")
    .select("current_balance, total_spent")
    .eq("user_id", userId)
    .maybeSingle();

  if (balanceError) {
    console.error("Error fetching balance:", balanceError);
    return NextResponse.json(
      { error: "Fehler beim Abrufen des Punktestands" },
      { status: 500 }
    );
  }

  const currentBalance = balance?.current_balance ?? 0;

  // Check if user has enough points
  if (currentBalance < reward.point_cost) {
    return NextResponse.json(
      { error: "Nicht genuegend Punkte" },
      { status: 400 }
    );
  }

  const newBalance = currentBalance - reward.point_cost;
  const newTotalSpent = (balance?.total_spent ?? 0) + reward.point_cost;

  // Update point balance
  const { error: updateBalanceError } = await supabase
    .from("point_balances")
    .update({
      current_balance: newBalance,
      total_spent: newTotalSpent,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateBalanceError) {
    console.error("Error updating balance:", updateBalanceError);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Punktestands" },
      { status: 500 }
    );
  }

  // Create transaction record
  const { error: txError } = await supabase.from("point_transactions").insert({
    user_id: userId,
    household_id: householdId,
    points: -reward.point_cost,
    transaction_type: "reward_redemption",
    reference_id: rewardId,
    description: "Belohnung eingelöst",
    balance_after: newBalance,
    created_by: userId,
  });

  if (txError) {
    console.error("Error creating transaction:", txError);
    // Continue anyway, balance was updated
  }

  // Create redemption record
  const { data: redemption, error: redemptionError } = await supabase
    .from("redemptions")
    .insert({
      reward_id: rewardId,
      user_id: userId,
      household_id: householdId,
      points_spent: reward.point_cost,
      status: "pending",
    })
    .select("id")
    .single();

  if (redemptionError) {
    console.error("Error creating redemption:", redemptionError);
    // Try to rollback point deduction
    await supabase
      .from("point_balances")
      .update({
        current_balance: currentBalance,
        total_spent: balance?.total_spent ?? 0,
      })
      .eq("user_id", userId);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Einloesung" },
      { status: 500 }
    );
  }

  // Increment quantity claimed if limited
  if (reward.quantity_available !== null) {
    await supabase
      .from("rewards")
      .update({ quantity_claimed: reward.quantity_claimed + 1 })
      .eq("id", rewardId);
  }

  return NextResponse.json({
    success: true,
    redemptionId: redemption?.id,
    pointsSpent: reward.point_cost,
    newBalance: newBalance,
    message: "Belohnung erfolgreich eingelöst",
  });
}