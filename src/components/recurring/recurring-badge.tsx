"use client";

import { Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RecurrenceType,
  RecurrencePattern,
  WeeklyPattern,
  DailyPattern,
  MonthlyPattern,
  CustomPattern,
} from "@/types/recurring";

interface RecurringBadgeProps {
  recurrenceType: RecurrenceType;
  recurrencePattern: RecurrencePattern;
  active?: boolean;
  showLabel?: boolean;
}

export function RecurringBadge({
  recurrenceType,
  recurrencePattern,
  active = true,
  showLabel = false,
}: RecurringBadgeProps) {
  const getLabel = (): string => {
    switch (recurrenceType) {
      case "daily": {
        const pattern = recurrencePattern as DailyPattern;
        const interval = pattern?.intervalDays || 1;
        return interval === 1 ? "Täglich" : `Alle ${interval} Tage`;
      }

      case "weekly": {
        const pattern = recurrencePattern as WeeklyPattern;
        const days = pattern?.days || [];
        if (days.length === 7) return "Täglich";
        if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
          return "Werktags";
        }
        if (days.length === 2 && days.includes(0) && days.includes(6)) {
          return "Wochenende";
        }
        return "Wöchentlich";
      }

      case "monthly": {
        const pattern = recurrencePattern as MonthlyPattern;
        return `Monatlich`;
      }

      case "custom": {
        const pattern = recurrencePattern as CustomPattern;
        const interval = pattern?.intervalDays || 1;
        return `Alle ${interval} Tage`;
      }

      default:
        return "Wiederkehrend";
    }
  };

  const getTooltipText = (): string => {
    switch (recurrenceType) {
      case "daily": {
        const pattern = recurrencePattern as DailyPattern;
        const interval = pattern?.intervalDays || 1;
        return interval === 1
          ? "Wird jeden Tag wiederholt"
          : `Wird alle ${interval} Tage wiederholt`;
      }

      case "weekly": {
        const pattern = recurrencePattern as WeeklyPattern;
        const days = pattern?.days || [];
        const dayNames = days.map(
          (d) => ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d]
        );
        return `Wird jeden ${dayNames.join(", ")} wiederholt`;
      }

      case "monthly": {
        const pattern = recurrencePattern as MonthlyPattern;
        const day = pattern?.dayOfMonth || 1;
        return `Wird am ${day}. jedes Monats wiederholt`;
      }

      case "custom": {
        const pattern = recurrencePattern as CustomPattern;
        const interval = pattern?.intervalDays || 1;
        return `Wird alle ${interval} Tage wiederholt`;
      }

      default:
        return "Wiederkehrende Aufgabe";
    }
  };

  if (!active) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="gap-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800"
          >
            <Repeat className="w-3 h-3" />
            {showLabel && <span>{getLabel()}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}