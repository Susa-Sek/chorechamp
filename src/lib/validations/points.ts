// Validation schemas for gamification points system
// Can be reused in React Native mobile app

import { z } from "zod";

// Transaction type validation
export const transactionTypeSchema = z.enum([
  "chore_completion",
  "bonus",
  "undo",
  "reward_redemption",
  "streak_bonus",
]);

// Leaderboard time period validation
export const timePeriodSchema = z.enum(["this_week", "this_month", "all_time"]);

// Transaction filter validation
export const transactionFilterSchema = z.enum(["all", "earned", "spent"]);

// Bonus points input validation
export const bonusPointsSchema = z.object({
  userId: z.string().uuid("Ungueltige Benutzer-ID"),
  points: z
    .number()
    .int("Punkte muessen eine ganze Zahl sein")
    .min(1, "Mindestens 1 Punkt erforderlich")
    .max(100, "Hoechstens 100 Punkte erlaubt"),
  reason: z
    .string()
    .max(200, "Grund darf maximal 200 Zeichen haben")
    .optional(),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Leaderboard query validation
export const leaderboardQuerySchema = z.object({
  period: timePeriodSchema.default("all_time"),
});

// History query validation
export const historyQuerySchema = z.object({
  filter: transactionFilterSchema.default("all"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Export types
export type BonusPointsFormData = z.infer<typeof bonusPointsSchema>;
export type TimePeriodFormData = z.infer<typeof timePeriodSchema>;
export type TransactionFilterFormData = z.infer<typeof transactionFilterSchema>;
export type PaginationFormData = z.infer<typeof paginationSchema>;
export type LeaderboardQueryFormData = z.infer<typeof leaderboardQuerySchema>;
export type HistoryQueryFormData = z.infer<typeof historyQuerySchema>;