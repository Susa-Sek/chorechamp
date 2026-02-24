"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface CalendarPreviewProps {
  dates: Date[];
  title?: string;
}

export function CalendarPreview({
  dates,
  title = "Vorschau der nächsten Termine",
}: CalendarPreviewProps) {
  if (dates.length === 0) {
    return null;
  }

  const formatDate = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return "Heute";
    }

    if (dateOnly.getTime() === tomorrow.getTime()) {
      return "Morgen";
    }

    const diffDays = Math.ceil(
      (dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 7) {
      return `In ${diffDays} Tagen`;
    }

    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatFullDate = (date: Date): string => {
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getRelativeBadge = (date: Date): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return "Heute";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateOnly.getTime() === tomorrow.getTime()) {
      return "Morgen";
    }

    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {dates.map((date, index) => {
            const relativeBadge = getRelativeBadge(date);
            const dayOfWeek = date.toLocaleDateString("de-DE", { weekday: "long" });

            return (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    <span className="text-lg font-bold leading-none">
                      {date.getDate()}
                    </span>
                    <span className="text-xs">
                      {date.toLocaleDateString("de-DE", { month: "short" })}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{dayOfWeek}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFullDate(date)}
                    </p>
                  </div>
                </div>
                {relativeBadge && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {relativeBadge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}