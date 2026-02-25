// Validation schemas for gamification levels and badges system
// Can be reused in React Native mobile app

import { z } from "zod";

// Badge category validation
export const badgeCategorySchema = z.enum([
  "completion",
  "streak",
  "points",
  "special",
]);

// Badge criteria type validation
export const badgeCriteriaTypeSchema = z.enum([
  "chores_completed",
  "streak_days",
  "total_points",
  "special",
]);

// Badge criteria validation
export const badgeCriteriaSchema = z.object({
  type: badgeCriteriaTypeSchema,
  value: z.number().int().min(1, "Wert muss mindestens 1 sein"),
});

// Badge filter validation
export const badgeFilterSchema = z.enum(["all", "earned", "locked", "in_progress"]);

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Profile ID validation
export const profileIdSchema = z.object({
  id: z.string().uuid("Ungueltige Benutzer-ID"),
});

// Export types
export type BadgeCategoryFormData = z.infer<typeof badgeCategorySchema>;
export type BadgeCriteriaTypeFormData = z.infer<typeof badgeCriteriaTypeSchema>;
export type BadgeCriteriaFormData = z.infer<typeof badgeCriteriaSchema>;
export type BadgeFilterFormData = z.infer<typeof badgeFilterSchema>;
export type PaginationFormData = z.infer<typeof paginationSchema>;
export type ProfileIdFormData = z.infer<typeof profileIdSchema>;