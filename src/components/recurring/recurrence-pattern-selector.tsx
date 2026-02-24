"use client";

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  RecurrenceType,
  RecurrencePattern,
  WeeklyPattern,
  DailyPattern,
  MonthlyPattern,
  CustomPattern,
  RECURRENCE_TYPE_LABELS,
  DAY_LABELS,
} from "@/types/recurring";
import { CalendarPreview } from "./calendar-preview";
import { calculateNextOccurrences } from "@/lib/validations/recurring";

interface RecurrencePatternSelectorProps {
  form: UseFormReturn<{
    recurrenceType: RecurrenceType;
    recurrencePattern: RecurrencePattern;
    startDate: string;
    endDate?: string | null | undefined;
  }>;
}

export function RecurrencePatternSelector({
  form,
}: RecurrencePatternSelectorProps) {
  const [previewDates, setPreviewDates] = useState<Date[]>([]);
  const recurrenceType = form.watch("recurrenceType");
  const recurrencePattern = form.watch("recurrencePattern");
  const startDate = form.watch("startDate");

  // Calculate preview dates when pattern changes
  useEffect(() => {
    const dates = calculateNextOccurrences(
      recurrenceType,
      recurrencePattern as unknown as Record<string, unknown>,
      startDate || new Date().toISOString(),
      5
    );
    setPreviewDates(dates);
  }, [recurrenceType, recurrencePattern, startDate]);

  const handleDayToggle = (day: number) => {
    const currentPattern = form.getValues("recurrencePattern") as WeeklyPattern;
    const currentDays = currentPattern?.days || [];

    let newDays: number[];
    if (currentDays.includes(day)) {
      newDays = currentDays.filter((d) => d !== day);
    } else {
      newDays = [...currentDays, day].sort((a, b) => a - b);
    }

    form.setValue("recurrencePattern", { days: newDays } as WeeklyPattern, {
      shouldValidate: true,
    });
  };

  const handleRecurrenceTypeChange = (value: RecurrenceType) => {
    form.setValue("recurrenceType", value);

    // Set default pattern based on type
    switch (value) {
      case "daily":
        form.setValue("recurrencePattern", { intervalDays: 1 } as DailyPattern);
        break;
      case "weekly":
        form.setValue(
          "recurrencePattern",
          { days: [1] } as WeeklyPattern // Default to Monday
        );
        break;
      case "monthly":
        form.setValue(
          "recurrencePattern",
          { dayOfMonth: 1 } as MonthlyPattern
        );
        break;
      case "custom":
        form.setValue("recurrencePattern", { intervalDays: 7 } as CustomPattern);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Recurrence Type */}
      <FormField
        control={form.control}
        name="recurrenceType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Wiederholung</FormLabel>
            <Select
              onValueChange={handleRecurrenceTypeChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Wähle Wiederholungstyp" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.entries(RECURRENCE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Wie oft soll die Aufgabe wiederholt werden?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Pattern-specific options */}
      {recurrenceType === "daily" && (
        <FormField
          control={form.control}
          name="recurrencePattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intervall</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    className="w-20"
                    value={(field.value as DailyPattern)?.intervalDays || 1}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      form.setValue(
                        "recurrencePattern",
                        { intervalDays: value } as DailyPattern,
                        { shouldValidate: true }
                      );
                    }}
                  />
                  <span className="text-sm text-muted-foreground">Tage</span>
                </div>
              </FormControl>
              <FormDescription>
                Alle wie viele Tage soll die Aufgabe wiederholt werden?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {recurrenceType === "weekly" && (
        <FormField
          control={form.control}
          name="recurrencePattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wochentage</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={
                        (field.value as WeeklyPattern)?.days?.includes(day)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleDayToggle(day)}
                      className="min-w-[40px]"
                    >
                      {DAY_LABELS[day]}
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormDescription>
                Wähle die Wochentage, an denen die Aufgabe fällig ist.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {recurrenceType === "monthly" && (
        <FormField
          control={form.control}
          name="recurrencePattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag des Monats</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    className="w-20"
                    value={(field.value as MonthlyPattern)?.dayOfMonth || 1}
                    onChange={(e) => {
                      const value = Math.min(31, Math.max(1, parseInt(e.target.value) || 1));
                      form.setValue(
                        "recurrencePattern",
                        { dayOfMonth: value } as MonthlyPattern,
                        { shouldValidate: true }
                      );
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    . des Monats
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                Bei Monaten mit weniger Tagen wird der letzte Tag verwendet.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {recurrenceType === "custom" && (
        <FormField
          control={form.control}
          name="recurrencePattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Benutzerdefiniertes Intervall</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    className="w-20"
                    value={(field.value as CustomPattern)?.intervalDays || 7}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 7;
                      form.setValue(
                        "recurrencePattern",
                        { intervalDays: value } as CustomPattern,
                        { shouldValidate: true }
                      );
                    }}
                  />
                  <span className="text-sm text-muted-foreground">Tage</span>
                </div>
              </FormControl>
              <FormDescription>
                Alle wie viele Tage soll die Aufgabe wiederholt werden?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Start Date */}
      <FormField
        control={form.control}
        name="startDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Startdatum</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormDescription>
              Ab wann soll die Aufgabe wiederholt werden?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* End Date */}
      <FormField
        control={form.control}
        name="endDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Enddatum (optional)</FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e.target.value || null);
                }}
              />
            </FormControl>
            <FormDescription>
              Leer lassen für unbegrenzte Wiederholung.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Calendar Preview */}
      {previewDates.length > 0 && (
        <CalendarPreview dates={previewDates} />
      )}
    </div>
  );
}