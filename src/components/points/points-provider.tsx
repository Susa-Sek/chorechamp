"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PointBalance,
  PointTransaction,
  UserStreak,
  UserStatistics,
  LeaderboardEntry,
  LeaderboardFilter,
  TransactionFilter,
  BonusPointsInput,
  PointsState,
} from "@/types/points";

interface PointsContextType extends PointsState {
  fetchBalance: () => Promise<void>;
  fetchTransactions: (filter: TransactionFilter) => Promise<{ transactions: PointTransaction[]; total: number }>;
  fetchStreak: () => Promise<void>;
  fetchStatistics: () => Promise<UserStatistics | null>;
  fetchLeaderboard: (filter: LeaderboardFilter) => Promise<LeaderboardEntry[]>;
  awardBonusPoints: (input: BonusPointsInput) => Promise<{ error: string | null }>;
  refreshPoints: () => Promise<void>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PointsState>({
    balance: null,
    transactions: [],
    streak: null,
    isLoading: true,
    error: null,
  });

  const supabase = createClient();

  const fetchBalance = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState((prev) => ({ ...prev, balance: null, isLoading: false }));
        return;
      }

      const { data, error } = await supabase
        .from("point_balances")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching balance:", error);
        return;
      }

      const balance: PointBalance | null = data
        ? {
            id: data.id as string,
            userId: data.user_id as string,
            householdId: data.household_id as string,
            currentBalance: data.current_balance as number,
            totalEarned: data.total_earned as number,
            totalSpent: data.total_spent as number,
            updatedAt: data.updated_at as string,
          }
        : null;

      setState((prev) => ({ ...prev, balance, isLoading: false }));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setState((prev) => ({ ...prev, isLoading: false, error: "Fehler beim Laden der Punkte" }));
    }
  }, [supabase]);

  const fetchTransactions = useCallback(
    async (filter: TransactionFilter): Promise<{ transactions: PointTransaction[]; total: number }> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return { transactions: [], total: 0 };
        }

        // Get user's household first
        const { data: membership } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .single();

        if (!membership) {
          return { transactions: [], total: 0 };
        }

        let query = supabase
          .from("point_transactions")
          .select(
            `
            id,
            user_id,
            household_id,
            points,
            transaction_type,
            reference_id,
            description,
            balance_after,
            created_by,
            created_at,
            profiles!point_transactions_user_id_fkey (
              display_name,
              avatar_url
            )
          `,
            { count: "exact" }
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        // Apply type filter
        if (filter.type === "earned") {
          query = query.gt("points", 0);
        } else if (filter.type === "spent") {
          query = query.lt("points", 0);
        }

        // Apply pagination
        const from = (filter.page - 1) * filter.limit;
        const to = from + filter.limit - 1;

        const { data, error, count } = await query.range(from, to);

        if (error) {
          console.error("Error fetching transactions:", error);
          return { transactions: [], total: 0 };
        }

        const transactions: PointTransaction[] = (data || []).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          userId: t.user_id as string,
          householdId: t.household_id as string,
          points: t.points as number,
          transactionType: t.transaction_type as PointTransaction["transactionType"],
          referenceId: t.reference_id as string | null,
          description: t.description as string | null,
          balanceAfter: t.balance_after as number,
          createdBy: t.created_by as string | null,
          createdAt: t.created_at as string,
          user: {
            id: t.user_id as string,
            displayName: (t.profiles as Record<string, unknown>)?.display_name as string || "Unbekannt",
            avatarUrl: (t.profiles as Record<string, unknown>)?.avatar_url as string | null,
          },
        }));

        return { transactions, total: count || 0 };
      } catch (error) {
        console.error("Error fetching transactions:", error);
        return { transactions: [], total: 0 };
      }
    },
    [supabase]
  );

  const fetchStreak = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState((prev) => ({ ...prev, streak: null }));
        return;
      }

      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching streak:", error);
        return;
      }

      const streak: UserStreak | null = data
        ? {
            id: data.id as string,
            userId: data.user_id as string,
            currentStreak: data.current_streak as number,
            longestStreak: data.longest_streak as number,
            lastCompletionDate: data.last_completion_date as string | null,
            updatedAt: data.updated_at as string,
          }
        : null;

      setState((prev) => ({ ...prev, streak }));
    } catch (error) {
      console.error("Error fetching streak:", error);
    }
  }, [supabase]);

  const fetchStatistics = useCallback(async (): Promise<UserStatistics | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      // Get user's household
      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .single();

      if (!membership) return null;

      const now = new Date();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startOfThisWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch point transactions for calculations
      const { data: transactions } = await supabase
        .from("point_transactions")
        .select("points, created_at, transaction_type")
        .eq("user_id", user.id);

      // Fetch chore completions
      const { data: completions } = await supabase
        .from("chore_completions")
        .select("completed_at")
        .eq("user_id", user.id);

      const txList = transactions || [];
      const completionList = completions || [];

      // Calculate points earned this week
      const pointsEarnedThisWeek = txList
        .filter((t: Record<string, unknown>) => {
          const createdAt = new Date(t.created_at as string);
          return t.points as number > 0 && createdAt >= startOfThisWeek;
        })
        .reduce((sum: number, t: Record<string, unknown>) => sum + (t.points as number), 0);

      // Calculate points earned this month
      const pointsEarnedThisMonth = txList
        .filter((t: Record<string, unknown>) => {
          const createdAt = new Date(t.created_at as string);
          return t.points as number > 0 && createdAt >= startOfThisMonth;
        })
        .reduce((sum: number, t: Record<string, unknown>) => sum + (t.points as number), 0);

      // Calculate previous week/month points
      const previousWeekPoints = txList
        .filter((t: Record<string, unknown>) => {
          const createdAt = new Date(t.created_at as string);
          return t.points as number > 0 && createdAt >= startOfLastWeek && createdAt < startOfThisWeek;
        })
        .reduce((sum: number, t: Record<string, unknown>) => sum + (t.points as number), 0);

      const previousMonthPoints = txList
        .filter((t: Record<string, unknown>) => {
          const createdAt = new Date(t.created_at as string);
          return t.points as number > 0 && createdAt >= startOfLastMonth && createdAt < startOfThisMonth;
        })
        .reduce((sum: number, t: Record<string, unknown>) => sum + (t.points as number), 0);

      // Calculate chores completed this week
      const choresCompletedThisWeek = completionList.filter((c: Record<string, unknown>) => {
        const completedAt = new Date(c.completed_at as string);
        return completedAt >= startOfThisWeek;
      }).length;

      // Calculate chores completed this month
      const choresCompletedThisMonth = completionList.filter((c: Record<string, unknown>) => {
        const completedAt = new Date(c.completed_at as string);
        return completedAt >= startOfThisMonth;
      }).length;

      // Calculate previous week/month chores
      const previousWeekChores = completionList.filter((c: Record<string, unknown>) => {
        const completedAt = new Date(c.completed_at as string);
        return completedAt >= startOfLastWeek && completedAt < startOfThisWeek;
      }).length;

      const previousMonthChores = completionList.filter((c: Record<string, unknown>) => {
        const completedAt = new Date(c.completed_at as string);
        return completedAt >= startOfLastMonth && completedAt < startOfThisMonth;
      }).length;

      // Get streak data
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", user.id)
        .single();

      // Total points and chores
      const totalPointsEarned = txList
        .filter((t: Record<string, unknown>) => t.points as number > 0)
        .reduce((sum: number, t: Record<string, unknown>) => sum + (t.points as number), 0);

      const totalChoresCompleted = completionList.length;

      return {
        pointsEarnedThisWeek,
        pointsEarnedThisMonth,
        choresCompletedThisWeek,
        choresCompletedThisMonth,
        previousWeekPoints,
        previousMonthPoints,
        previousWeekChores,
        previousMonthChores,
        currentStreak: streakData?.current_streak || 0,
        longestStreak: streakData?.longest_streak || 0,
        totalPointsEarned,
        totalChoresCompleted,
      };
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return null;
    }
  }, [supabase]);

  const fetchLeaderboard = useCallback(
    async (filter: LeaderboardFilter): Promise<LeaderboardEntry[]> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return [];

        // Get user's household
        const { data: membership } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .single();

        if (!membership) return [];

        const householdId = membership.household_id;

        // Calculate date filter based on time period
        let dateFilter: string | null = null;
        const now = new Date();

        if (filter.timePeriod === "this_week") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() + 1);
          startOfWeek.setHours(0, 0, 0, 0);
          dateFilter = startOfWeek.toISOString();
        } else if (filter.timePeriod === "this_month") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = startOfMonth.toISOString();
        }

        // Get all members of the household
        const { data: members } = await supabase
          .from("household_members")
          .select(
            `
            user_id,
            profiles (
              display_name,
              avatar_url
            )
          `
          )
          .eq("household_id", householdId);

        if (!members || members.length === 0) return [];

        // Get point balances for all members
        const { data: balances } = await supabase
          .from("point_balances")
          .select("user_id, total_earned, current_balance")
          .eq("household_id", householdId);

        // Calculate points by time period if needed
        let periodPoints: Record<string, number> = {};
        if (dateFilter) {
          const { data: periodTransactions } = await supabase
            .from("point_transactions")
            .select("user_id, points")
            .eq("household_id", householdId)
            .gt("points", 0)
            .gte("created_at", dateFilter);

          periodPoints = (periodTransactions || []).reduce(
            (acc: Record<string, number>, t: Record<string, unknown>) => {
              const userId = t.user_id as string;
              acc[userId] = (acc[userId] || 0) + (t.points as number);
              return acc;
            },
            {}
          );
        }

        // Build leaderboard entries
        const leaderboard: LeaderboardEntry[] = (members || [])
          .map((m: Record<string, unknown>) => {
            const userId = m.user_id as string;
            const profile = m.profiles as Record<string, unknown>;
            const balance = (balances || []).find(
              (b: Record<string, unknown>) => b.user_id === userId
            );

            const totalPoints = dateFilter
              ? periodPoints[userId] || 0
              : (balance?.total_earned as number) || 0;

            return {
              userId,
              displayName: profile?.display_name as string || "Unbekannt",
              avatarUrl: profile?.avatar_url as string | null,
              totalPoints,
              currentBalance: (balance?.current_balance as number) || 0,
              rank: 0,
              isCurrentUser: userId === user.id,
            };
          })
          .filter((entry) => entry.totalPoints > 0 || entry.isCurrentUser)
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        return leaderboard;
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
      }
    },
    [supabase]
  );

  const awardBonusPoints = useCallback(
    async (input: BonusPointsInput): Promise<{ error: string | null }> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return { error: "Nicht angemeldet" };
        }

        // Call the API endpoint
        const response = await fetch("/api/points/bonus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: input.userId,
            points: input.points,
            reason: input.reason,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: result.error || "Fehler beim Vergeben der Bonuspunkte" };
        }

        return { error: null };
      } catch (error) {
        console.error("Error awarding bonus points:", error);
        return { error: "Ein unerwarteter Fehler ist aufgetreten" };
      }
    },
    []
  );

  const refreshPoints = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    await Promise.all([fetchBalance(), fetchStreak()]);
  }, [fetchBalance, fetchStreak]);

  // Initialize on mount
  useEffect(() => {
    fetchBalance().then(() => {
      setState((prev) => ({ ...prev, isLoading: false }));
    });
  }, [fetchBalance]);

  return (
    <PointsContext.Provider
      value={{
        ...state,
        fetchBalance,
        fetchTransactions,
        fetchStreak,
        fetchStatistics,
        fetchLeaderboard,
        awardBonusPoints,
        refreshPoints,
      }}
    >
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error("usePoints must be used within a PointsProvider");
  }
  return context;
}