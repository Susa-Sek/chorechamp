// Validation schemas for recurring tasks
// Can be reused in React Native mobile app

import { z } from "zod";

export const recurrenceTypeSchema = z.enum([
  "daily",
  "weekly",
  "monthly",
  "custom",
]);

// Weekly pattern: array of days (0-6, Sunday = 0)
export const weeklyPatternSchema = z.object({
  days: z
    .array(z.number().min(0).max(6))
    .min(1, "Mindestens ein Tag muss ausgewählt werden")
    .max(7),
});

// Monthly pattern: day of month (1-31)
export const monthlyPatternSchema = z.object({
  dayOfMonth: z.number().min(1).max(31),
});

// Custom pattern: every N days
export const customPatternSchema = z.object({
  intervalDays: z.number().min(1).max(365),
});

// Daily pattern: optional interval (defaults to 1)
export const dailyPatternSchema = z.object({
  intervalDays: z.number().min(1).max(365).optional(),
});

// Union type for all patterns
export const recurrencePatternSchema = z.union([
  dailyPatternSchema,
  weeklyPatternSchema,
  monthlyPatternSchema,
  customPatternSchema,
]);

export const createRecurringSchema = z.object({
  choreId: z.string().uuid(),
  recurrenceType: recurrenceTypeSchema,
  recurrencePattern: recurrencePatternSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
});

// Form schema without choreId (for dialog component)
export const recurringFormSchema = z.object({
  recurrenceType: recurrenceTypeSchema,
  recurrencePattern: recurrencePatternSchema,
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
});

export const updateRecurringSchema = z.object({
  recurrenceType: recurrenceTypeSchema.optional(),
  recurrencePattern: recurrencePatternSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const reminderTypeSchema = z.enum([
  "day_before",
  "morning_of",
  "custom_hours_before",
]);

export const updateReminderPreferencesSchema = z.object({
  reminderType: reminderTypeSchema.optional(),
  customHours: z.number().min(1).max(168).optional().nullable(),
  pushEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

// Form schema with all required fields (for form component)
export const reminderPreferencesFormSchema = z.object({
  reminderType: reminderTypeSchema,
  customHours: z.number().min(1).max(168).nullable(),
  pushEnabled: z.boolean(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

export type CreateRecurringFormData = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringFormData = z.infer<typeof updateRecurringSchema>;
export type UpdateReminderPreferencesFormData = z.infer<
  typeof updateReminderPreferencesSchema
>;

// Helper function to calculate next occurrence dates
export function calculateNextOccurrences(
  recurrenceType: string,
  pattern: Record<string, unknown>,
  startDate: string,
  count: number = 5
): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  const now = new Date();

  // Find the next occurrence after now
  let current = new Date(start);
  if (current < now) {
    current = new Date(now);
  }

  // Set to start of day
  current.setHours(0, 0, 0, 0);

  switch (recurrenceType) {
    case "daily": {
      const interval = (pattern as { intervalDays?: number }).intervalDays || 1;
      // Find next occurrence
      const daysSinceStart = Math.floor(
        (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysUntilNext =
        Math.ceil(daysSinceStart / interval) * interval - daysSinceStart;
      current = new Date(now);
      current.setDate(current.getDate() + daysUntilNext);
      current.setHours(0, 0, 0, 0);

      for (let i = 0; i < count; i++) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + interval);
      }
      break;
    }

    case "weekly": {
      const days = (pattern as { days: number[] }).days.sort((a, b) => a - b);
      if (days.length === 0) return dates;

      // Find next occurrence
      const currentDay = current.getDay();
      let nextDay = days.find((d) => d >= currentDay);
      if (nextDay === undefined) {
        nextDay = days[0];
        current.setDate(current.getDate() + (7 - currentDay + nextDay));
      } else {
        current.setDate(current.getDate() + (nextDay - currentDay));
      }

      let weekOffset = 0;
      while (dates.length < count) {
        for (const day of days) {
          if (dates.length >= count) break;
          const date = new Date(current);
          date.setDate(date.getDate() - currentDay + day + weekOffset * 7);
          if (date >= now) {
            dates.push(date);
          }
        }
        weekOffset++;
      }
      break;
    }

    case "monthly": {
      const dayOfMonth = (pattern as { dayOfMonth: number }).dayOfMonth;

      // Start from the beginning of the current month
      current = new Date(now.getFullYear(), now.getMonth(), 1);

      while (dates.length < count) {
        const daysInMonth = new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          0
        ).getDate();
        const day = Math.min(dayOfMonth, daysInMonth);
        const candidateDate = new Date(
          current.getFullYear(),
          current.getMonth(),
          day
        );

        if (candidateDate >= now) {
          dates.push(candidateDate);
        }

        current.setMonth(current.getMonth() + 1);
      }
      break;
    }

    case "custom": {
      const interval = (pattern as { intervalDays: number }).intervalDays;

      // Find next occurrence
      const daysSinceStart = Math.floor(
        (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysUntilNext =
        Math.ceil(daysSinceStart / interval) * interval - daysSinceStart;
      current = new Date(now);
      current.setDate(current.getDate() + daysUntilNext);
      current.setHours(0, 0, 0, 0);

      for (let i = 0; i < count; i++) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + interval);
      }
      break;
    }
  }

  return dates;
}

// Helper to format recurrence pattern as human-readable text
export function formatRecurrencePattern(
  recurrenceType: string,
  pattern: Record<string, unknown>
): string {
  switch (recurrenceType) {
    case "daily": {
      const interval = (pattern as { intervalDays?: number }).intervalDays || 1;
      return interval === 1 ? "Täglich" : `Alle ${interval} Tage`;
    }

    case "weekly": {
      const days = (pattern as { days: number[] }).days;
      const dayNames = days.map((d) => ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d]);
      if (days.length === 7) return "Täglich";
      if (days.length === 5 && !days.includes(0) && !days.includes(6))
        return "Werktags";
      if (days.length === 2 && days.includes(0) && days.includes(6))
        return "Wochenende";
      return `Jeden ${dayNames.join(", ")}`;
    }

    case "monthly": {
      const dayOfMonth = (pattern as { dayOfMonth: number }).dayOfMonth;
      return `Am ${dayOfMonth}. jedes Monats`;
    }

    case "custom": {
      const interval = (pattern as { intervalDays: number }).intervalDays;
      return `Alle ${interval} Tage`;
    }

    default:
      return "Unbekannt";
  }
}