// Shared types for gamification points system
// Can be reused in React Native mobile app

export type TransactionType =
  | "chore_completion"
  | "bonus"
  | "undo"
  | "reward_redemption"
  | "streak_bonus";

export interface PointBalance {
  id: string;
  userId: string;
  householdId: string;
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  householdId: string;
  points: number; // positive for earned, negative for spent
  transactionType: TransactionType;
  referenceId: string | null; // chore_id or reward_id
  description: string | null;
  balanceAfter: number;
  createdBy: string | null;
  createdAt: string;
  // Joined data
  user?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  creator?: {
    id: string;
    displayName: string;
  };
}

export interface UserStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  updatedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  currentBalance: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface UserStatistics {
  pointsEarnedThisWeek: number;
  pointsEarnedThisMonth: number;
  choresCompletedThisWeek: number;
  choresCompletedThisMonth: number;
  previousWeekPoints: number;
  previousMonthPoints: number;
  previousWeekChores: number;
  previousMonthChores: number;
  currentStreak: number;
  longestStreak: number;
  totalPointsEarned: number;
  totalChoresCompleted: number;
}

export interface PointsState {
  balance: PointBalance | null;
  transactions: PointTransaction[];
  streak: UserStreak | null;
  isLoading: boolean;
  error: string | null;
}

export interface LeaderboardFilter {
  timePeriod: "this_week" | "this_month" | "all_time";
}

export interface TransactionFilter {
  type: "all" | "earned" | "spent";
  page: number;
  limit: number;
}

export interface BonusPointsInput {
  userId: string;
  points: number;
  reason?: string;
}

// Point values by difficulty
export const POINTS_BY_DIFFICULTY: Record<string, number> = {
  easy: 10,
  medium: 20,
  hard: 50,
};

// Transaction type labels in German
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  chore_completion: "Aufgabe erledigt",
  bonus: "Bonuspunkte",
  undo: "Ruckgangig gemacht",
  reward_redemption: "Belohnung eingelost",
  streak_bonus: "Streak-Bonus",
};

// Time period labels in German
export const TIME_PERIOD_LABELS: Record<string, string> = {
  this_week: "Diese Woche",
  this_month: "Dieser Monat",
  all_time: "Alle Zeiten",
};