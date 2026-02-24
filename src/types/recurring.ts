// Shared types for recurring tasks
// Can be reused in React Native mobile app

export type RecurrenceType = "daily" | "weekly" | "monthly" | "custom";

// Pattern for weekly recurrence - days of week (0 = Sunday, 1 = Monday, etc.)
export interface WeeklyPattern {
  days: number[]; // 0-6, where 0 = Sunday
}

// Pattern for monthly recurrence - day of month
export interface MonthlyPattern {
  dayOfMonth: number; // 1-31
}

// Pattern for custom recurrence - every X days
export interface CustomPattern {
  intervalDays: number; // Every N days
}

// Pattern for daily recurrence (every day, or every N days)
export interface DailyPattern {
  intervalDays?: number; // Optional, defaults to 1 (every day)
}

// Union type for recurrence patterns
export type RecurrencePattern =
  | DailyPattern
  | WeeklyPattern
  | MonthlyPattern
  | CustomPattern;

// Recurring chore template
export interface RecurringChore {
  id: string;
  householdId: string;
  choreId: string;
  recurrenceType: RecurrenceType;
  recurrencePattern: RecurrencePattern;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  chore?: {
    id: string;
    title: string;
    description: string | null;
    points: number;
    difficulty: "easy" | "medium" | "hard";
  };
}

// Reminder preferences
export type ReminderType = "day_before" | "morning_of" | "custom_hours_before";

export interface ReminderPreferences {
  id: string;
  userId: string;
  reminderType: ReminderType;
  customHours: number | null;
  pushEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
}

// Input types for creating/updating recurring chores
export interface CreateRecurringInput {
  choreId: string;
  recurrenceType: RecurrenceType;
  recurrencePattern: RecurrencePattern;
  startDate?: string;
  endDate?: string;
}

export interface UpdateRecurringInput {
  recurrenceType?: RecurrenceType;
  recurrencePattern?: RecurrencePattern;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

// Input for reminder preferences
export interface UpdateReminderPreferencesInput {
  reminderType?: ReminderType;
  customHours?: number;
  pushEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// Labels for recurrence types in German
export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  daily: "Täglich",
  weekly: "Wöchentlich",
  monthly: "Monatlich",
  custom: "Benutzerdefiniert",
};

// Day labels in German (for weekly pattern)
export const DAY_LABELS: Record<number, string> = {
  0: "So",
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa",
};

export const DAY_FULL_LABELS: Record<number, string> = {
  0: "Sonntag",
  1: "Montag",
  2: "Dienstag",
  3: "Mittwoch",
  4: "Donnerstag",
  5: "Freitag",
  6: "Samstag",
};

// Reminder type labels in German
export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  day_before: "Am Vortag",
  morning_of: "Am Morgen des Tages",
  custom_hours_before: "Benutzerdefinierte Stunden vorher",
};