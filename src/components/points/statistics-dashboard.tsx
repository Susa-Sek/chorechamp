"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Flame,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePoints } from "./points-provider";
import { UserStatistics } from "@/types/points";
import { cn } from "@/lib/utils";

interface StatisticsDashboardProps {
  className?: string;
}

export function StatisticsDashboard({ className }: StatisticsDashboardProps) {
  const { fetchStatistics, streak, balance } = usePoints();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStatistics = async () => {
      setIsLoading(true);
      const stats = await fetchStatistics();
      setStatistics(stats);
      setIsLoading(false);
    };

    loadStatistics();
  }, [fetchStatistics]);

  if (isLoading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 w-20 bg-muted rounded mb-2" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString("de-DE");
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const weeklyPointsChange = statistics
    ? getPercentageChange(statistics.pointsEarnedThisWeek, statistics.previousWeekPoints)
    : 0;

  const monthlyPointsChange = statistics
    ? getPercentageChange(statistics.pointsEarnedThisMonth, statistics.previousMonthPoints)
    : 0;

  const weeklyChoresChange = statistics
    ? getPercentageChange(statistics.choresCompletedThisWeek, statistics.previousWeekChores)
    : 0;

  const streakProgress = statistics
    ? Math.min((statistics.currentStreak / 7) * 100, 100)
    : 0;

  return (
    <div className={className}>
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Points This Week */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Punkte diese Woche</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">
                    {formatNumber(statistics?.pointsEarnedThisWeek || 0)}
                  </p>
                  {statistics && statistics.previousWeekPoints > 0 && (
                    <span
                      className={cn(
                        "text-xs flex items-center",
                        weeklyPointsChange >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {weeklyPointsChange >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                      )}
                      {Math.abs(weeklyPointsChange)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chores This Week */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aufgaben diese Woche</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">
                    {statistics?.choresCompletedThisWeek || 0}
                  </p>
                  {statistics && statistics.previousWeekChores > 0 && (
                    <span
                      className={cn(
                        "text-xs flex items-center",
                        weeklyChoresChange >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {weeklyChoresChange >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                      )}
                      {Math.abs(weeklyChoresChange)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktuelle Serie</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">
                    {statistics?.currentStreak || 0} Tage
                  </p>
                </div>
                <Progress value={streakProgress} className="h-1.5 mt-2" />
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Points */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamtpunkte</p>
                <p className="text-2xl font-bold">
                  {formatNumber(balance?.totalEarned || 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wochenvergleich</CardTitle>
            <CardDescription>
              Deine Punkte im Vergleich zur Vorwoche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* This Week Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Diese Woche</span>
                  <span className="font-medium">
                    {formatNumber(statistics?.pointsEarnedThisWeek || 0)} Punkte
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((statistics?.pointsEarnedThisWeek || 0) /
                          Math.max(
                            statistics?.pointsEarnedThisWeek || 1,
                            statistics?.previousWeekPoints || 1
                          )) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Previous Week Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Vorwoche</span>
                  <span className="font-medium">
                    {formatNumber(statistics?.previousWeekPoints || 0)} Punkte
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground/30 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((statistics?.previousWeekPoints || 0) /
                          Math.max(
                            statistics?.pointsEarnedThisWeek || 1,
                            statistics?.previousWeekPoints || 1
                          )) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monatsstatistik</CardTitle>
            <CardDescription>
              Deine Leistung diesen Monat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Punkte</p>
                <p className="text-xl font-bold">
                  {formatNumber(statistics?.pointsEarnedThisMonth || 0)}
                </p>
                {statistics && statistics.previousMonthPoints > 0 && (
                  <span
                    className={cn(
                      "text-xs flex items-center",
                      monthlyPointsChange >= 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {monthlyPointsChange >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(monthlyPointsChange)}% vs. Vormonat
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Aufgaben</p>
                <p className="text-xl font-bold">
                  {statistics?.choresCompletedThisMonth || 0}
                </p>
                {statistics && statistics.previousMonthChores > 0 && (
                  <span
                    className={cn(
                      "text-xs flex items-center",
                      monthlyPointsChange >= 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {Math.abs(
                      getPercentageChange(
                        statistics.choresCompletedThisMonth,
                        statistics.previousMonthChores
                      )
                    )}
                    % vs. Vormonat
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Langste Serie</p>
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <p className="text-xl font-bold">
                    {statistics?.longestStreak || 0} Tage
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gesamt erledigt</p>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-xl font-bold">
                    {statistics?.totalChoresCompleted || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Calendar Placeholder */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Aktivitatskalender
          </CardTitle>
          <CardDescription>
            Deine Aktivitat der letzten 7 Tage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StreakCalendar streak={statistics?.currentStreak || 0} />
        </CardContent>
      </Card>
    </div>
  );
}

// Simple streak calendar visualization
function StreakCalendar({ streak }: { streak: number }) {
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return date;
  });

  // Show activity based on streak - last 'streak' days have activity
  const getActivityLevel = (index: number): "none" | "low" | "medium" | "high" => {
    const daysFromToday = 6 - index;
    if (daysFromToday < streak) {
      // Recent days in streak show high activity
      if (daysFromToday < Math.min(streak, 3)) {
        return "high";
      }
      return "medium";
    }
    return "none";
  };

  return (
    <div className="flex justify-between gap-1">
      {last7Days.map((date, index) => {
        const activity = getActivityLevel(index);
        const isToday = index === 6;

        return (
          <div key={index} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs text-muted-foreground">
              {days[date.getDay() === 0 ? 6 : date.getDay() - 1]}
            </span>
            <div
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors",
                activity === "high" &&
                  "bg-green-500 text-white",
                activity === "medium" &&
                  "bg-green-300 text-green-800",
                activity === "low" &&
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                activity === "none" &&
                  "bg-muted text-muted-foreground",
                isToday && "ring-2 ring-primary ring-offset-2"
              )}
            >
              {date.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}