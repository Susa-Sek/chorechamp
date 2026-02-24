import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/statistics - Get user statistics
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

    // Try to use the RPC function first
    const { data: rpcStats, error: rpcError } = await supabase.rpc(
      "get_user_statistics",
      { p_user_id: user.id }
    );

    if (!rpcError && rpcStats) {
      // Transform RPC response to match our API format
      const statistics = {
        pointsEarnedThisWeek: rpcStats.weekly_points || 0,
        pointsEarnedThisMonth: rpcStats.monthly_points || 0,
        choresCompletedThisWeek: rpcStats.weekly_chores || 0,
        choresCompletedThisMonth: rpcStats.monthly_chores || 0,
        previousWeekPoints: rpcStats.prev_week_points || 0,
        previousMonthPoints: rpcStats.prev_month_points || 0,
        previousWeekChores: 0, // Not returned by RPC
        previousMonthChores: 0, // Not returned by RPC
        currentStreak: rpcStats.current_streak || 0,
        longestStreak: rpcStats.longest_streak || 0,
        totalPointsEarned: 0, // Will be fetched separately
        totalChoresCompleted: 0, // Will be fetched separately
      };

      // Get total points and chores
      const { data: balance } = await supabase
        .from("point_balances")
        .select("total_earned")
        .eq("user_id", user.id)
        .maybeSingle();

      statistics.totalPointsEarned = balance?.total_earned || 0;

      const { count: totalChores } = await supabase
        .from("chore_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("undone_at", null);

      statistics.totalChoresCompleted = totalChores || 0;

      return NextResponse.json({ statistics });
    }

    // Fallback: Manual queries if RPC doesn't exist
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get weekly points
    const { data: weeklyTx } = await supabase
      .from("point_transactions")
      .select("points")
      .eq("user_id", user.id)
      .gte("created_at", weekStart.toISOString());

    const pointsEarnedThisWeek = (weeklyTx || []).reduce(
      (sum, tx) => sum + tx.points,
      0
    );

    // Get monthly points
    const { data: monthlyTx } = await supabase
      .from("point_transactions")
      .select("points")
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString());

    const pointsEarnedThisMonth = (monthlyTx || []).reduce(
      (sum, tx) => sum + tx.points,
      0
    );

    // Get previous week points
    const { data: prevWeekTx } = await supabase
      .from("point_transactions")
      .select("points")
      .eq("user_id", user.id)
      .gte("created_at", prevWeekStart.toISOString())
      .lt("created_at", weekStart.toISOString());

    const previousWeekPoints = (prevWeekTx || []).reduce(
      (sum, tx) => sum + tx.points,
      0
    );

    // Get previous month points
    const { data: prevMonthTx } = await supabase
      .from("point_transactions")
      .select("points")
      .eq("user_id", user.id)
      .gte("created_at", prevMonthStart.toISOString())
      .lt("created_at", prevMonthEnd.toISOString());

    const previousMonthPoints = (prevMonthTx || []).reduce(
      (sum, tx) => sum + tx.points,
      0
    );

    // Get weekly chores
    const { count: choresCompletedThisWeek } = await supabase
      .from("chore_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", weekStart.toISOString())
      .is("undone_at", null);

    // Get monthly chores
    const { count: choresCompletedThisMonth } = await supabase
      .from("chore_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", monthStart.toISOString())
      .is("undone_at", null);

    // Get previous week chores
    const { count: previousWeekChores } = await supabase
      .from("chore_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", prevWeekStart.toISOString())
      .lt("completed_at", weekStart.toISOString())
      .is("undone_at", null);

    // Get previous month chores
    const { count: previousMonthChores } = await supabase
      .from("chore_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", prevMonthStart.toISOString())
      .lt("completed_at", prevMonthEnd.toISOString())
      .is("undone_at", null);

    // Get total points
    const { data: balance } = await supabase
      .from("point_balances")
      .select("total_earned")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get total chores
    const { count: totalChoresCompleted } = await supabase
      .from("chore_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("undone_at", null);

    // Get streak
    const { data: streak } = await supabase
      .from("user_streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", user.id)
      .maybeSingle();

    const statistics = {
      pointsEarnedThisWeek,
      pointsEarnedThisMonth,
      choresCompletedThisWeek: choresCompletedThisWeek || 0,
      choresCompletedThisMonth: choresCompletedThisMonth || 0,
      previousWeekPoints,
      previousMonthPoints,
      previousWeekChores: previousWeekChores || 0,
      previousMonthChores: previousMonthChores || 0,
      currentStreak: streak?.current_streak || 0,
      longestStreak: streak?.longest_streak || 0,
      totalPointsEarned: balance?.total_earned || 0,
      totalChoresCompleted: totalChoresCompleted || 0,
    };

    return NextResponse.json({ statistics });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}