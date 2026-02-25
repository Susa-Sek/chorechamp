"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Gift,
  History,
  Loader2,
  Sparkles,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHousehold } from "@/components/household/household-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { PointBalanceCompact } from "@/components/points/point-balance";
import { RedemptionItem, RedemptionItemSkeleton } from "@/components/rewards";
import { Redemption, RedemptionStatus, REDEMPTION_STATUS_LABELS } from "@/types/rewards";
import { createClient } from "@/lib/supabase/client";

export default function RedemptionsPage() {
  const router = useRouter();
  const { household, isLoading: isHouseholdLoading } = useHousehold();
  const { user } = useAuth();
  const supabase = createClient();

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RedemptionStatus | "all">("all");

  const fetchRedemptions = useCallback(async () => {
    if (!household || !user) return;

    setIsLoading(true);

    try {
      let query = supabase
        .from("redemptions")
        .select(`
          id,
          reward_id,
          user_id,
          household_id,
          points_spent,
          status,
          fulfilled_at,
          fulfilled_by,
          fulfillment_notes,
          created_at,
          rewards (
            id,
            name,
            image_url
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      let redemptionsList: Redemption[] = (data || []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        rewardId: r.reward_id as string,
        userId: r.user_id as string,
        householdId: r.household_id as string,
        pointsSpent: r.points_spent as number,
        status: r.status as RedemptionStatus,
        fulfilledAt: r.fulfilled_at as string | null,
        fulfilledBy: r.fulfilled_by as string | null,
        fulfillmentNotes: r.fulfillment_notes as string | null,
        createdAt: r.created_at as string,
        reward: r.rewards ? {
          id: (r.rewards as Record<string, unknown>).id as string,
          name: (r.rewards as Record<string, unknown>).name as string,
          imageUrl: (r.rewards as Record<string, unknown>).image_url as string | null,
        } : undefined,
      }));

      // Apply status filter
      if (filter !== "all") {
        redemptionsList = redemptionsList.filter((r) => r.status === filter);
      }

      setRedemptions(redemptionsList);
    } catch (error) {
      console.error("Error fetching redemptions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [household, user, supabase, filter]);

  useEffect(() => {
    if (household && user) {
      fetchRedemptions();
    }
  }, [fetchRedemptions, household, user]);

  // Stats
  const totalRedemptions = redemptions.length;
  const pendingCount = redemptions.filter((r) => r.status === "pending").length;
  const fulfilledCount = redemptions.filter((r) => r.status === "fulfilled").length;
  const totalPointsSpent = redemptions.reduce((sum, r) => sum + r.pointsSpent, 0);

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
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Kein Haushalt gefunden</CardTitle>
              <CardDescription>
                Tritt einem Haushalt bei, um deine Einloesungen zu sehen.
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <History className="w-8 h-8 text-primary" />
            Meine Einloesungen
          </h1>
          <p className="text-muted-foreground">
            Uebersicht aller deiner eingeloeesten Belohnungen
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Einloesungen</p>
                  <p className="text-xl font-bold">{totalRedemptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ausstehend</p>
                  <p className="text-xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Erfuellt</p>
                  <p className="text-xl font-bold">{fulfilledCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ausgegeben</p>
                  <p className="text-xl font-bold text-red-600">
                    {totalPointsSpent.toLocaleString("de-DE")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Redemptions List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Einloesungen</CardTitle>
                <CardDescription>
                  Alle deine eingeloeesten Belohnungen
                </CardDescription>
              </div>
              <Tabs
                value={filter}
                onValueChange={(v) => setFilter(v as RedemptionStatus | "all")}
              >
                <TabsList>
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="pending">Ausstehend</TabsTrigger>
                  <TabsTrigger value="fulfilled">Erfuellt</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <RedemptionItemSkeleton key={i} />
                ))}
              </div>
            ) : redemptions.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">
                  {filter === "all"
                    ? "Noch keine Einloesungen vorhanden"
                    : `Keine ${REDEMPTION_STATUS_LABELS[filter as RedemptionStatus]} Einloesungen`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Loese Punkte gegen Belohnungen ein!
                </p>
                <Link href="/rewards">
                  <Button className="mt-4 gap-2">
                    <Gift className="w-4 h-4" />
                    Zu den Belohnungen
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {redemptions.map((redemption) => (
                  <RedemptionItem key={redemption.id} redemption={redemption} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}