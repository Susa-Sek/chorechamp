// Validation schemas for rewards system
// Can be reused in React Native mobile app

import { z } from "zod";

export const rewardStatusSchema = z.enum(["draft", "published", "archived"]);
export const redemptionStatusSchema = z.enum(["pending", "fulfilled", "cancelled"]);

export const createRewardSchema = z.object({
  name: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen haben")
    .max(100, "Name darf maximal 100 Zeichen haben"),
  description: z
    .string()
    .max(500, "Beschreibung darf maximal 500 Zeichen haben")
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .string()
    .url("Ungueltige URL")
    .optional()
    .or(z.literal("")),
  pointCost: z
    .number()
    .min(1, "Punkte muessen mindestens 1 sein")
    .max(10000, "Punkte duerfen maximal 10000 sein"),
  quantityAvailable: z
    .number()
    .min(0, "Anzahl muss mindestens 0 sein")
    .optional()
    .nullable(),
  status: rewardStatusSchema.optional().default("published"),
});

export const updateRewardSchema = z.object({
  name: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen haben")
    .max(100, "Name darf maximal 100 Zeichen haben")
    .optional(),
  description: z
    .string()
    .max(500, "Beschreibung darf maximal 500 Zeichen haben")
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url("Ungueltige URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  pointCost: z
    .number()
    .min(1, "Punkte muessen mindestens 1 sein")
    .max(10000, "Punkte duerfen maximal 10000 sein")
    .optional(),
  quantityAvailable: z
    .number()
    .min(0, "Anzahl muss mindestens 0 sein")
    .optional()
    .nullable(),
  status: rewardStatusSchema.optional(),
});

export const fulfillRedemptionSchema = z.object({
  notes: z
    .string()
    .max(500, "Notizen duerfen maximal 500 Zeichen haben")
    .optional()
    .nullable(),
});

export const rewardListFiltersSchema = z.object({
  status: z.union([rewardStatusSchema, z.literal("all")]).optional(),
  affordable: z.boolean().optional(),
  search: z.string().optional(),
});

export const rewardListSortSchema = z.object({
  field: z.enum(["pointCost", "name", "createdAt"]),
  direction: z.enum(["asc", "desc"]),
});

export const redemptionListFiltersSchema = z.object({
  status: z.union([redemptionStatusSchema, z.literal("all")]).optional(),
});

// API query schemas (aliases for backwards compatibility)
export const rewardListQuerySchema = z.object({
  status: z.enum(["draft", "published", "archived", "all"]).default("published"),
  affordable: z.boolean().optional(),
  sortBy: z.enum(["point_cost", "name", "newest"]).default("newest"),
});

export const redemptionListQuerySchema = z.object({
  status: z.enum(["pending", "fulfilled", "cancelled", "all"]).default("all"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type CreateRewardFormData = z.infer<typeof createRewardSchema>;
export type UpdateRewardFormData = z.infer<typeof updateRewardSchema>;
export type FulfillRedemptionFormData = z.infer<typeof fulfillRedemptionSchema>;
export type RewardListFiltersFormData = z.infer<typeof rewardListFiltersSchema>;
export type RedemptionListFiltersFormData = z.infer<typeof redemptionListFiltersSchema>;