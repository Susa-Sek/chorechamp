"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Award, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHousehold } from "@/components/household/household-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { BadgeGrid } from "@/components/levels";
import { LevelProgress, LevelProgressSkeleton } from "@/components/levels";
import {
  BadgeDefinition,
  UserBadge,
  BadgeProgress,
  getLevelFromPoints,
} from "@/types/levels";
import { createClient } from "@/lib/supabase/client";
import { PointBalanceCompact } from "@/components/points/point-balance";

export default function BadgesPage() {
  const { household, isLoading: isHouseholdLoading } = useHousehold();
  const { user } = useAuth();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  const fetchData = useCallback(async () => {
    if (!household || !user) return;

    setIsLoading(true);

    try {
      // Fetch badge definitions
      const { data: badgeData, error: badgeError } = await supabase
        .from("badge_definitions")
        .select("*")
        .order("category", { ascending: true })
        .order("criteria->>value", { ascending: true });

      if (badgeError) throw badgeError;

      const formattedBadges: BadgeDefinition[] = (badgeData || []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        name: b.name as string,
        description: b.description as string,
        category: b.category as BadgeDefinition["category"],
        criteria: b.criteria as BadgeDefinition["criteria"],
        icon: b.icon as string,
        pointsReward: (b.points_reward as number) || 0,
        createdAt: b.created_at as string,
      }));

      setBadges(formattedBadges);

      // Fetch user's earned badges
      const { data: earnedData, error: earnedError } = await supabase
        .from("user_badges")
        .select("*, badge:badge_definitions(*)")
        .eq("user_id", user.id);

      if (earnedError) throw earnedError;

      const formattedEarned: UserBadge[] = (earnedData || []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        userId: e.user_id as string,
        badgeId: e.badge_id as string,
        earnedAt: e.earned_at as string,
        badge: e.badge as BadgeDefinition | undefined,
      }));

      setEarnedBadges(formattedEarned);

      // Fetch badge progress
      const { data: progressData, error: progressError } = await supabase
        .from("badge_progress")
        .select("*, badge:badge_definitions(*)")
        .eq("user_id", user.id);

      if (progressError) throw progressError;

      const formattedProgress: BadgeProgress[] = (progressData || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        userId: p.user_id as string,
        badgeId: p.badge_id as string,
        currentValue: p.current_value as number,
        updatedAt: p.updated_at as string,
        badge: p.badge as BadgeDefinition | undefined,
      }));

      setBadgeProgress(formattedProgress);

      // Fetch total points
      const { data: balanceData } = await supabase
        .from("point_balances")
        .select("total_earned")
        .eq("user_id", user.id)
        .single();

      setTotalPoints(balanceData?.total_earned || 0);
    } catch (error) {
      console.error("Error fetching badges data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [household, user, supabase]);

  useEffect(() => {
    if (household && user) {
      fetchData();
    }
  }, [fetchData, household, user]);

  // Loading state
  if (isHouseholdLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  // No household state
  if (!household) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">ChoreChamp</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurueck
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-lg">
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Kein Haushalt gefunden</CardTitle>
              <CardDescription>
                Tritt einem Haushalt bei, um Abzeichen zu sammeln.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

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

          <div className="flex items-center gap-4">
            <PointBalanceCompact />
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurueck
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Award className="w-8 h-8 text-primary" />
            Abzeichen
          </h1>
          <p className="text-muted-foreground">
            Sammle Abzeichen fuer deine Erfolge und schalte neue frei!
          </p>
        </div>

        {/* Level Progress */}
        {isLoading ? (
          <LevelProgressSkeleton />
        ) : (
          <LevelProgress currentPoints={totalPoints} className="mb-8" />
        )}

        {/* Badge Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Abzeichen-Sammlung</CardTitle>
            <CardDescription>
              Uebersicht aller verfuegbaren Abzeichen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BadgeGrid
              badges={badges}
              earnedBadges={earnedBadges}
              badgeProgress={badgeProgress}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}