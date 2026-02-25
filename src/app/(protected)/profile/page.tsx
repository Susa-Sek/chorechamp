"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sparkles,
  User,
  Mail,
  Save,
  ArrowLeft,
  LogOut,
  Home,
  Users,
  Bell,
  Award,
  Trophy,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { useHousehold } from "@/components/household/household-provider";
import { profileSchema, ProfileFormData } from "@/lib/validations/auth";
import { LevelBadge, LevelProgressCompact } from "@/components/levels";
import {
  BadgeDefinition,
  UserBadge,
  getLevelFromPoints,
} from "@/types/levels";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { household, isAdmin } = useHousehold();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Gamification state
  const [isGamificationLoading, setIsGamificationLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [choresCompleted, setChoresCompleted] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || "",
    },
  });

  // Fetch gamification data
  const fetchGamificationData = useCallback(async () => {
    if (!user) return;

    setIsGamificationLoading(true);

    try {
      // Fetch total points
      const { data: balanceData } = await supabase
        .from("point_balances")
        .select("total_earned")
        .eq("user_id", user.id)
        .single();

      setTotalPoints(balanceData?.total_earned || 0);

      // Fetch chores completed count
      const { count } = await supabase
        .from("chore_completions")
        .select("*", { count: "exact", head: true })
        .eq("completed_by", user.id);

      setChoresCompleted(count || 0);

      // Fetch earned badges
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("*, badge:badge_definitions(*)")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false })
        .limit(6);

      const formattedBadges: UserBadge[] = (badgesData || []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        userId: b.user_id as string,
        badgeId: b.badge_id as string,
        earnedAt: b.earned_at as string,
        badge: b.badge as BadgeDefinition | undefined,
      }));

      setEarnedBadges(formattedBadges);
    } catch (error) {
      console.error("Error fetching gamification data:", error);
    } finally {
      setIsGamificationLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      fetchGamificationData();
    }
  }, [fetchGamificationData, user]);

  // Reset form when profile changes or canceling edit
  const handleCancel = () => {
    form.reset({ displayName: profile?.displayName || "" });
    setIsEditing(false);
    setError(null);
    setSuccess(false);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await updateProfile(data.displayName);

    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setIsEditing(false);
    }

    setIsLoading(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

  const currentLevel = getLevelFromPoints(totalPoints);

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

          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Zurueck
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Profil</h1>

        {/* Profile Card with Level */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(
                      profile?.displayName || "User"
                    )} flex items-center justify-center text-white text-2xl font-bold`}
                  >
                    {getInitials(profile?.displayName || "User")}
                  </div>
                  {/* Level badge overlay */}
                  {!isGamificationLoading && (
                    <div className="absolute -bottom-1 -right-1">
                      <LevelBadge level={currentLevel.level} size="sm" />
                    </div>
                  )}
                </div>
                <div>
                  <CardTitle>{profile?.displayName}</CardTitle>
                  <CardDescription>
                    Mitglied seit{" "}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("de-DE")
                      : "Unbekannt"}
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
            {isGamificationLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Abzeichen
                </CardTitle>
                <CardDescription>Deine errungenen Erfolge</CardDescription>
              </div>
              <Link href="/badges">
                <Button variant="outline" size="sm">
                  Alle anzeigen
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isGamificationLoading ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-14 h-14 rounded-full flex-shrink-0" />
                ))}
              </div>
            ) : earnedBadges.length === 0 ? (
              <div className="text-center py-6">
                <Award className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Noch keine Abzeichen verdient
                </p>
                <Link href="/badges">
                  <Button variant="link" size="sm" className="mt-2">
                    Verfuegbare Abzeichen ansehen
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {earnedBadges.map((ub) => (
                  <div
                    key={ub.id}
                    className="flex flex-col items-center gap-1 flex-shrink-0"
                    title={ub.badge?.name}
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
                    <span className="text-xs text-muted-foreground truncate w-14 text-center">
                      {ub.badge?.name || "Abzeichen"}
                    </span>
                  </div>
                ))}
                {earnedBadges.length >= 6 && (
                  <Link
                    href="/badges"
                    className="flex flex-col items-center justify-center flex-shrink-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      +{earnedBadges.length - 5}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">Mehr</span>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Household Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5" />
              Haushalt
            </CardTitle>
            <CardDescription>Dein aktueller Haushalt</CardDescription>
          </CardHeader>
          <CardContent>
            {household ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{household.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {isAdmin ? "Admin" : "Mitglied"}
                    </div>
                  </div>
                </div>
                <Link href="/household">
                  <Button variant="outline" size="sm" className="gap-2">
                    Verwalten
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-3">
                  Du bist noch keinem Haushalt beigetreten
                </p>
                <div className="flex gap-2 justify-center">
                  <Link href="/household/create">
                    <Button size="sm">Erstellen</Button>
                  </Link>
                  <Link href="/household/join">
                    <Button variant="outline" size="sm">
                      Beitreten
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Einstellungen
            </CardTitle>
            <CardDescription>
              Erinnerungen und Benachrichtigungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                Erinnerungen verwalten
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Profil bearbeiten</CardTitle>
            <CardDescription>
              Aktualisiere deine persoenlichen Informationen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
                    Profil erfolgreich aktualisiert!
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anzeigename</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="Dein Name" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="pl-10 bg-muted"
                      placeholder="E-Mail wird vom System verwaltet"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    E-Mail-Aenderungen werden ueber die Authentifizierungseinstellungen verwaltet.
                  </p>
                </div>

                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <Button type="submit" disabled={isLoading} className="gap-2">
                        <Save className="w-4 h-4" />
                        {isLoading ? "Speichern..." : "Speichern"}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Abbrechen
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => setIsEditing(true)}>
                      Profil bearbeiten
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Gefahrenbereich</CardTitle>
            <CardDescription>
              Aktionen, die nicht rueckgaengig gemacht werden koennen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full gap-2" onClick={signOut}>
              <LogOut className="w-4 h-4" />
              Abmelden
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}