import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/leaderboard - Get household leaderboard
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all_time"; // this_week, this_month, all_time

    // Validate period
    const validPeriods = ["this_week", "this_month", "all_time"];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: "Ungueltiger Zeitraum" },
        { status: 400 }
      );
    }

    // Use the database function for leaderboard
    const { data: leaderboardData, error: leaderboardError } = await supabase.rpc(
      "get_household_leaderboard",
      {
        p_household_id: membership.household_id,
        p_period: period,
      }
    );

    if (leaderboardError) {
      console.error("Error fetching leaderboard:", leaderboardError);
      // Fall back to manual query if RPC doesn't exist yet
      return await getLeaderboardFallback(supabase, membership.household_id, user.id, period);
    }

    // Transform and mark current user
    const leaderboard = (leaderboardData || []).map(
      (entry: {
        user_id: string;
        display_name: string;
        avatar_url: string | null;
        current_balance: number;
        total_earned: number;
        rank: number;
      }) => ({
        userId: entry.user_id,
        displayName: entry.display_name,
        avatarUrl: entry.avatar_url,
        currentBalance: entry.current_balance,
        totalEarned: entry.total_earned,
        rank: entry.rank,
        isCurrentUser: entry.user_id === user.id,
      })
    );

    return NextResponse.json({
      leaderboard,
      period,
      currentUserId: user.id,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// Fallback leaderboard query if RPC is not available
async function getLeaderboardFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string,
  currentUserId: string,
  period: string
) {
  // Build date filter based on period
  let dateFilter: string | null = null;
  if (period === "this_week") {
    dateFilter = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();
  } else if (period === "this_month") {
    dateFilter = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
  }

  // Get all household members with their profiles
  const { data: members, error: membersError } = await supabase
    .from("household_members")
    .select(
      `
      user_id,
      profiles (
        id,
        display_name,
        avatar_url
      )
    `
    )
    .eq("household_id", householdId);

  if (membersError) {
    console.error("Error fetching members:", membersError);
    return NextResponse.json(
      { error: "Fehler beim Laden des Haushalts" },
      { status: 500 }
    );
  }

  // Get point balances for all members
  const { data: balances, error: balancesError } = await supabase
    .from("point_balances")
    .select("user_id, current_balance, total_earned")
    .in(
      "user_id",
      members.map((m) => m.user_id)
    );

  if (balancesError) {
    console.error("Error fetching balances:", balancesError);
  }

  // If period filter, get points from transactions
  let periodPoints: Record<string, number> = {};
  if (dateFilter) {
    const { data: transactions, error: txError } = await supabase
      .from("point_transactions")
      .select("user_id, points")
      .eq("household_id", householdId)
      .gte("created_at", dateFilter);

    if (!txError && transactions) {
      transactions.forEach((tx) => {
        if (!periodPoints[tx.user_id]) {
          periodPoints[tx.user_id] = 0;
        }
        periodPoints[tx.user_id] += tx.points;
      });
    }
  }

  // Build leaderboard
  const leaderboard = members
    .map((m) => {
      const profile = m.profiles as unknown as {
        id: string;
        display_name: string;
        avatar_url: string | null;
      } | null;
      const balance = balances?.find((b) => b.user_id === m.user_id);
      const totalEarned = dateFilter
        ? periodPoints[m.user_id] || 0
        : balance?.total_earned || 0;

      return {
        userId: m.user_id,
        displayName: profile?.display_name || "Unbekannt",
        avatarUrl: profile?.avatar_url || null,
        currentBalance: balance?.current_balance || 0,
        totalEarned,
        isCurrentUser: m.user_id === currentUserId,
      };
    })
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return NextResponse.json({
    leaderboard,
    period,
    currentUserId,
  });
}