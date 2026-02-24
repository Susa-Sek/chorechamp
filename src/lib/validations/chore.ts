// Validation schemas for chore management
// Can be reused in React Native mobile app

import { z } from "zod";
import { DIFFICULTY_POINTS } from "@/types/chore";

export const choreDifficultySchema = z.enum(["easy", "medium", "hard"]);
export const choreStatusSchema = z.enum(["pending", "completed", "archived"]);

export const createChoreSchema = z.object({
  title: z
    .string()
    .min(2, "Titel muss mindestens 2 Zeichen haben")
    .max(100, "Titel darf maximal 100 Zeichen haben"),
  description: z
    .string()
    .max(500, "Beschreibung darf maximal 500 Zeichen haben")
    .optional()
    .or(z.literal("")),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  points: z
    .number()
    .min(1, "Punkte müssen mindestens 1 sein")
    .max(100, "Punkte dürfen maximal 100 sein"),
  difficulty: choreDifficultySchema,
  dueDate: z.string().optional().or(z.literal("")),
});

export const updateChoreSchema = z.object({
  title: z
    .string()
    .min(2, "Titel muss mindestens 2 Zeichen haben")
    .max(100, "Titel darf maximal 100 Zeichen haben")
    .optional(),
  description: z
    .string()
    .max(500, "Beschreibung darf maximal 500 Zeichen haben")
    .optional()
    .nullable(),
  assigneeId: z.string().uuid().optional().nullable().or(z.literal("")),
  points: z
    .number()
    .min(1, "Punkte müssen mindestens 1 sein")
    .max(100, "Punkte dürfen maximal 100 sein")
    .optional(),
  difficulty: choreDifficultySchema.optional(),
  dueDate: z.string().optional().nullable().or(z.literal("")),
  status: choreStatusSchema.optional(),
});

export const choreListFiltersSchema = z.object({
  status: z.union([choreStatusSchema, z.literal("all")]).optional(),
  assigneeId: z.string().optional(),
  difficulty: z.union([choreDifficultySchema, z.literal("all")]).optional(),
  search: z.string().optional(),
});

export const choreListSortSchema = z.object({
  field: z.enum(["dueDate", "createdAt", "points", "difficulty", "title"]),
  direction: z.enum(["asc", "desc"]),
});

export type CreateChoreFormData = z.infer<typeof createChoreSchema>;
export type UpdateChoreFormData = z.infer<typeof updateChoreSchema>;
export type ChoreListFiltersFormData = z.infer<typeof choreListFiltersSchema>;
export type ChoreListSortFormData = z.infer<typeof choreListSortSchema>;

// Helper to calculate points from difficulty
export function calculatePointsFromDifficulty(
  difficulty: "easy" | "medium" | "hard"
): number {
  return DIFFICULTY_POINTS[difficulty];
}

// Helper to format due date
export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "Kein Fälligkeitsdatum";

  const date = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = dueDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Überfällig (${Math.abs(diffDays)} Tage)`;
  } else if (diffDays === 0) {
    return "Heute fällig";
  } else if (diffDays === 1) {
    return "Morgen fällig";
  } else if (diffDays <= 7) {
    return `In ${diffDays} Tagen fällig`;
  } else {
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
}

// Helper to check if chore is overdue
export function isChoreOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "completed") return false;

  const date = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return dueDay < today;
}

// Helper to check if undo is available (within 24 hours)
export function isUndoAvailable(completedAt: string | null): boolean {
  if (!completedAt) return false;

  const completed = new Date(completedAt);
  const now = new Date();
  const diffMs = now.getTime() - completed.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours <= 24;
}