"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Trophy, Users, CheckCircle, ArrowRight, Settings, Home, BarChart3, Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { useHousehold } from "@/components/household/household-provider";
import { usePoints } from "@/components/points/points-provider";
import { PointBalance } from "@/components/points/point-balance";
import { Leaderboard } from "@/components/points/leaderboard";
import { UserStatistics } from "@/types/points";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { profile } = useAuth();
  const { household, isLoading: isHouseholdLoading } = useHousehold();
  const { balance, streak, fetchStatistics } = usePoints();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (household) {
        setIsStatsLoading(true);
        const stats = await fetchStatistics();
        setStatistics(stats);
        setIsStatsLoading(false);
      }
    };
    loadStats();
  }, [fetchStatistics, household]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ChoreChamp</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {household && (
              <Link href="/household">
                <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
                  <Home className="w-4 h-4" />
                  {household.name}
                </Button>
                <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Haushalt">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <PointBalance size="sm" />
            <Link href="/profile">
              <Button variant="ghost" className="gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-medium">
                  {profile?.displayName?.charAt(0).toUpperCase() || "?"}
                </div>
                <span className="hidden sm:inline">{profile?.displayName}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Willkommen zuruck, {profile?.displayName || "Champ"}!
          </h1>
          <p className="text-muted-foreground">
            Hier ist deine Ubersicht fur heute.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Points Card */}
          <Card className="hover:shadow-md transition-shadow">
            <Link href="/points/history">
              <CardContent className="pt-6">
                {isStatsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <div className="text-2xl font-bold text-primary tabular-nums">
                        {(balance?.currentBalance || 0).toLocaleString("de-DE")}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">Punkte</div>
                  </>
                )}
              </CardContent>
            </Link>
          </Card>

          {/* Level Card - Placeholder for PROJ-7 */}
          <Card className="hover:shadow-md transition-shadow opacity-60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <div className="text-2xl font-bold">Level 1</div>
              </div>
              <div className="text-sm text-muted-foreground">Newcomer</div>
            </CardContent>
          </Card>

          {/* Chores Today Card */}
          <Card className="hover:shadow-md transition-shadow">
            <Link href="/chores">
              <CardContent className="pt-6">
                {isStatsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-8" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div className="text-2xl font-bold">
                        {statistics?.choresCompletedThisWeek || 0}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">Aufgaben diese Woche</div>
                  </>
                )}
              </CardContent>
            </Link>
          </Card>

          {/* Streak Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              {isStatsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <div className="text-2xl font-bold">
                      {statistics?.currentStreak || streak?.currentStreak || 0}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Tage Streak</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Household Section */}
        {isHouseholdLoading ? (
          <Card className="mb-8">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                Wird geladen...
              </div>
            </CardContent>
          </Card>
        ) : !household ? (
          /* No household - show create/join options */
          <Card className="border-dashed mb-8">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Haushalt erstellen</CardTitle>
              <CardDescription>
                Du bist noch keinem Haushalt beigetreten. Erstelle einen neuen Haushalt
                oder tritt einem bestehenden bei.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/household/create">
                <Button className="gap-2">
                  Haushalt erstellen
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/household/join">
                <Button variant="outline" className="gap-2">
                  Haushalt beitreten
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Has household - show household info */
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Home className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{household.name}</CardTitle>
                    <CardDescription>Dein Haushalt</CardDescription>
                  </div>
                </div>
                <Link href="/household">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Verwalten
                  </Button>
                </Link>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Quick Actions */}
        {household && (
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/chores" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Meine Aufgaben</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Verwalte und erledige deine Haushaltsaufgaben.
                  </p>
                  <div className="mt-3 flex items-center text-sm text-primary">
                    Zur Aufgabenliste
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/rewards" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-lg">Belohnungen</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Loese deine Punkte gegen Belohnungen ein.
                  </p>
                  <div className="mt-3 flex items-center text-sm text-primary">
                    Zu den Belohnungen
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/statistics" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <CardTitle className="text-lg">Leaderboard</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Vergleiche deine Punkte mit anderen Mitgliedern.
                  </p>
                  <div className="mt-3 flex items-center text-sm text-primary">
                    Zum Leaderboard
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/statistics" className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg">Statistiken</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sieh dir deine Aktivitaten und Fortschritte an.
                  </p>
                  <div className="mt-3 flex items-center text-sm text-primary">
                    Zu den Statistiken
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Coming Soon for users without household */}
        {!household && !isHouseholdLoading && (
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Meine Aufgaben</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Erstelle oder trete einem Haushalt bei, um Aufgaben zu verwalten.
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Belohnungen</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bald verfugbar: Loese Punkte gegen Belohnungen ein.
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Leaderboard</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bald verfugbar: Vergleiche deine Punkte mit anderen.
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Statistiken</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bald verfugbar: Sieh dir deine Aktivitaten an.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mini Leaderboard for household members */}
        {household && (
          <div className="mt-8">
            <Leaderboard
              title="Punkte-Rangliste"
              description="Deine Position im Haushalt"
              className="mb-8"
            />
          </div>
        )}
      </main>
    </div>
  );
}