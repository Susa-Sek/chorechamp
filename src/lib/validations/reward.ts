// Validation schemas for rewards system
// Can be reused in React Native mobile app

import { z } from "zod";

// Reward status validation
export const rewardStatusSchema = z.enum(["draft", "published", "archived"]);

// Redemption status validation
export const redemptionStatusSchema = z.enum(["pending", "fulfilled", "cancelled"]);

// Create reward validation
export const createRewardSchema = z.object({
  name: z
    .string()
    .min(2, "Belohnungsname muss mindestens 2 Zeichen haben")
    .max(100, "Belohnungsname darf maximal 100 Zeichen haben"),
  description: z
    .string()
    .max(500, "Beschreibung darf maximal 500 Zeichen haben")
    .optional(),
  imageUrl: z
    .string()
    .url("Ungueltige URL")
    .optional()
    .nullable(),
  pointCost: z
    .number()
    .int("Punkte muessen eine ganze Zahl sein")
    .min(1, "Mindestens 1 Punkt erforderlich")
    .max(10000, "Hoechstens 10000 Punkte erlaubt"),
  quantityAvailable: z
    .number()
    .int("Menge muss eine ganze Zahl sein")
    .min(1, "Menge muss mindestens 1 sein")
    .optional()
    .nullable(),
  status: rewardStatusSchema.default("published"),
});

// Update reward validation
export const updateRewardSchema = z.object({
  name: z
    .string()
    .min(2, "Belohnungsname muss mindestens 2 Zeichen haben")
    .max(100, "Belohnungsname darf maximal 100 Zeichen haben")
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
    .nullable(),
  pointCost: z
    .number()
    .int("Punkte muessen eine ganze Zahl sein")
    .min(1, "Mindestens 1 Punkt erforderlich")
    .max(10000, "Hoechstens 10000 Punkte erlaubt")
    .optional(),
  quantityAvailable: z
    .number()
    .int("Menge muss eine ganze Zahl sein")
    .min(0, "Menge darf nicht negativ sein")
    .optional()
    .nullable(),
  status: rewardStatusSchema.optional(),
});

// Redeem reward validation
export const redeemRewardSchema = z.object({});

// Fulfill redemption validation
export const fulfillRedemptionSchema = z.object({
  notes: z
    .string()
    .max(500, "Notizen duerfen maximal 500 Zeichen haben")
    .optional()
    .nullable(),
});

// Reward list query validation
export const rewardListQuerySchema = z.object({
  status: z.enum(["draft", "published", "archived", "all"]).default("published"),
  affordable: z.boolean().optional(),
  sortBy: z.enum(["point_cost", "name", "newest"]).default("newest"),
});

// Redemption list query validation
export const redemptionListQuerySchema = z.object({
  status: z.enum(["pending", "fulfilled", "cancelled", "all"]).default("all"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Export types
export type CreateRewardFormData = z.infer<typeof createRewardSchema>;
export type UpdateRewardFormData = z.infer<typeof updateRewardSchema>;
export type RedeemRewardFormData = z.infer<typeof redeemRewardSchema>;
export type FulfillRedemptionFormData = z.infer<typeof fulfillRedemptionSchema>;
export type RewardStatusFormData = z.infer<typeof rewardStatusSchema>;
export type RedemptionStatusFormData = z.infer<typeof redemptionStatusSchema>;
export type RewardListQueryFormData = z.infer<typeof rewardListQuerySchema>;
export type RedemptionListQueryFormData = z.infer<typeof redemptionListQuerySchema>;