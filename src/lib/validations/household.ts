// Validation schemas for household management
// Can be reused in React Native mobile app

import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z
    .string()
    .min(3, "Haushaltsname muss mindestens 3 Zeichen haben")
    .max(50, "Haushaltsname darf maximal 50 Zeichen haben"),
});

export const joinHouseholdSchema = z.object({
  code: z
    .string()
    .length(6, "Einladungscode muss genau 6 Zeichen haben")
    .regex(/^[A-Z0-9]+$/, "Einladungscode darf nur Großbuchstaben und Zahlen enthalten"),
});

export const generateInviteCodeSchema = z.object({
  expiresInDays: z
    .number()
    .min(1, "Mindestens 1 Tag")
    .max(30, "Höchstens 30 Tage")
    .default(7),
});

export const transferAdminSchema = z.object({
  newAdminUserId: z
    .string()
    .uuid("Ungültige Benutzer-ID"),
});

export type CreateHouseholdFormData = z.infer<typeof createHouseholdSchema>;
export type JoinHouseholdFormData = z.infer<typeof joinHouseholdSchema>;
export type GenerateInviteCodeFormData = z.infer<typeof generateInviteCodeSchema>;
export type TransferAdminFormData = z.infer<typeof transferAdminSchema>;

// Helper to generate a random invite code
export function generateRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars: I, O, 0, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to format expiration date
export function formatExpirationDate(expiresAt: string): string {
  const date = new Date(expiresAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "Abgelaufen";
  } else if (diffDays === 0) {
    return "Läuft heute ab";
  } else if (diffDays === 1) {
    return "Läuft morgen ab";
  } else {
    return `Läuft in ${diffDays} Tagen ab`;
  }
}
