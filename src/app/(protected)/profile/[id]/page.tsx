"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Award,
  Trophy,
  Calendar,
  CheckCircle2,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LevelBadge, LevelProgressCompact } from "@/components/levels";
import {
  BadgeDefinition,
  UserBadge,
  getLevelFromPoints,
  LEVEL_DEFINITIONS,
} from "@/types/levels";
import { createClient } from "@/lib/supabase/client";
import { PointBalanceCompact } from "@/components/points/point-balance";

interface MemberProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export default function MemberProfilePage() {
  const params = useParams();
  const memberId = params.id as string;
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [choresCompleted, setChoresCompleted] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const getAvatarColor = (name: string) => {
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-yellow-500",
      "from-red-500 to-pink-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if viewing own profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsCurrentUser(user?.id === memberId);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, created_at")
        .eq("id", memberId)
        .single();

      if (profileError || !profileData) {
        setError("Profil nicht gefunden");
        setIsLoading(false);
        return;
      }

      setProfile({
        id: profileData.id as string,
        displayName: profileData.display_name as string,
        avatarUrl: profileData.avatar_url as string | null,
        createdAt: profileData.created_at as string,
      });

      // Fetch total points
      const { data: balanceData } = await supabase
        .from("point_balances")
        .select("total_earned")
        .eq("user_id", memberId)
        .single();

      setTotalPoints(balanceData?.total_earned || 0);

      // Fetch chores completed count
      const { count } = await supabase
        .from("chore_completions")
        .select("*", { count: "exact", head: true })
        .eq("completed_by", memberId);

      setChoresCompleted(count || 0);

      // Fetch earned badges
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("*, badge:badge_definitions(*)")
        .eq("user_id", memberId)
        .order("earned_at", { ascending: false });

      const formattedBadges: UserBadge[] = (badgesData || []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        userId: b.user_id as string,
        badgeId: b.badge_id as string,
        earnedAt: b.earned_at as string,
        badge: b.badge as BadgeDefinition | undefined,
      }));

      setEarnedBadges(formattedBadges);
    } catch (err) {
      console.error("Error fetching member profile:", err);
      setError("Fehler beim Laden des Profils");
    } finally {
      setIsLoading(false);
    }
  }, [memberId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentLevel = getLevelFromPoints(totalPoints);

  // Loading state
  if (isLoading) {
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
            <Link href="/household">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurueck
              </Button>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
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
            <Link href="/household">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurueck
              </Button>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <Alert variant="destructive">
            <AlertDescription>{error || "Profil nicht gefunden"}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Link href="/household">
              <Button>Zurueck zum Haushalt</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Redirect to own profile if viewing self
  if (isCurrentUser) {
    window.location.href = "/profile";
    return null;
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
            <Link href="/household">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurueck
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Mitglieder-Profil</h1>

        {/* Profile Card with Level */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(
                        profile.displayName
                      )} flex items-center justify-center text-white text-2xl font-bold`}
                    >
                      {getInitials(profile.displayName)}
                    </div>
                  )}
                  {/* Level badge overlay */}
                  <div className="absolute -bottom-1 -right-1">
                    <LevelBadge level={currentLevel.level} size="sm" />
                  </div>
                </div>
                <div>
                  <CardTitle>{profile.displayName}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Mitglied seit{" "}
                    {new Date(profile.createdAt).toLocaleDateString("de-DE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats & Level Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Level & Statistiken
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Level Progress */}
            <LevelProgressCompact currentPoints={totalPoints} />

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 rounded-lg bg-primary/5">
                <div className="text-2xl font-bold text-primary tabular-nums">
                  {totalPoints.toLocaleString("de-DE")}
                </div>
                <div className="text-xs text-muted-foreground">Punkte</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-accent/5">
                <div className="text-2xl font-bold tabular-nums">
                  {choresCompleted}
                </div>
                <div className="text-xs text-muted-foreground">Aufgaben</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/5">
                <div className="text-2xl font-bold tabular-nums">
                  {earnedBadges.length}
                </div>
                <div className="text-xs text-muted-foreground">Abzeichen</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5" />
              Abzeichen
            </CardTitle>
            <CardDescription>
              {earnedBadges.length} Abzeichen verdient
            </CardDescription>
          </CardHeader>
          <CardContent>
            {earnedBadges.length === 0 ? (
              <div className="text-center py-6">
                <Award className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Noch keine Abzeichen verdient
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {earnedBadges.map((ub) => (
                  <div
                    key={ub.id}
                    className="flex flex-col items-center gap-1.5"
                    title={ub.badge?.description}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl relative">
                      {ub.badge?.icon ? (
                        <span>{ub.badge.icon}</span>
                      ) : (
                        <Award className="w-5 h-5 text-primary" />
                      )}
                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                    <span className="text-xs text-center text-muted-foreground line-clamp-1">
                      {ub.badge?.name || "Abzeichen"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Level Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Level-System</CardTitle>
            <CardDescription>
              So funktioniert das Level-System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {LEVEL_DEFINITIONS.slice(
                Math.max(0, currentLevel.level - 2),
                Math.min(LEVEL_DEFINITIONS.length, currentLevel.level + 2)
              ).map((level) => (
                <div
                  key={level.level}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    level.level === currentLevel.level
                      ? "bg-primary/10 border border-primary/20"
                      : ""
                  }`}
                >
                  <LevelBadge level={level.level} size="sm" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{level.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {level.pointsRequired.toLocaleString("de-DE")} Punkte
                    </div>
                  </div>
                  {level.level === currentLevel.level && (
                    <span className="text-xs text-primary font-medium">Aktuell</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}