"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Gift,
  CheckCircle,
  Clock,
  Loader2,
  Lock,
  Sparkles,
  Users,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useHousehold } from "@/components/household/household-provider";
import { PointBalanceCompact } from "@/components/points/point-balance";
import { RedemptionItem, RedemptionItemSkeleton } from "@/components/rewards";
import { Redemption, RedemptionStatus, REDEMPTION_STATUS_LABELS } from "@/types/rewards";
import { createClient } from "@/lib/supabase/client";

export default function AdminRedemptionsPage() {
  const { household, isAdmin, isLoading: isHouseholdLoading } = useHousehold();
  const supabase = createClient();

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RedemptionStatus | "all">("pending");

  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);
  const [fulfillmentNotes, setFulfillmentNotes] = useState("");
  const [isFulfilling, setIsFulfilling] = useState(false);

  const fetchRedemptions = useCallback(async () => {
    if (!household) return;

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
          ),
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq("household_id", household.id)
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
        user: r.profiles ? {
          id: (r.profiles as Record<string, unknown>).id as string,
          displayName: (r.profiles as Record<string, unknown>).display_name as string,
          avatarUrl: (r.profiles as Record<string, unknown>).avatar_url as string | null,
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
  }, [household, supabase, filter]);

  useEffect(() => {
    if (household) {
      fetchRedemptions();
    }
  }, [fetchRedemptions, household]);

  const handleFulfill = async () => {
    if (!selectedRedemption) return;

    setIsFulfilling(true);

    try {
      const response = await fetch(`/api/redemptions/${selectedRedemption.id}/fulfill`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fulfillmentNotes }),
      });

      if (!response.ok) {
        const result = await response.json();
        alert(result.error || "Fehler beim Erfuellen der Einloesung");
        return;
      }

      setShowFulfillDialog(false);
      setSelectedRedemption(null);
      setFulfillmentNotes("");
      fetchRedemptions();
    } catch (error) {
      console.error("Error fulfilling redemption:", error);
      alert("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsFulfilling(false);
    }
  };

  // Stats
  const totalRedemptions = redemptions.length;
  const pendingCount = redemptions.filter((r) => r.status === "pending").length;
  const fulfilledCount = redemptions.filter((r) => r.status === "fulfilled").length;

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

  // Not admin state
  if (!isAdmin) {
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
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>Kein Zugriff</CardTitle>
              <CardDescription>
                Nur Admins koennen Einloesungen verwalten.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/household">
                <Button className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Zum Haushalt
                </Button>
              </Link>
            </CardContent>
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Gift className="w-8 h-8 text-primary" />
            Einloesungen verwalten
          </h1>
          <p className="text-muted-foreground">
            Uebersicht aller Einloesungen in deinem Haushalt
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt</p>
                  <p className="text-xl font-bold">{totalRedemptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ausstehend</p>
                  <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Erfuellt</p>
                  <p className="text-xl font-bold">{fulfilledCount}</p>
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
                <CardTitle>Alle Einloesungen</CardTitle>
                <CardDescription>
                  Verwalte die Einloesungen deiner Haushaltsmitglieder
                </CardDescription>
              </div>
              <Tabs
                value={filter}
                onValueChange={(v) => setFilter(v as RedemptionStatus | "all")}
              >
                <TabsList>
                  <TabsTrigger value="pending" className="gap-1.5">
                    <Clock className="w-4 h-4" />
                    Ausstehend
                  </TabsTrigger>
                  <TabsTrigger value="fulfilled">Erfuellt</TabsTrigger>
                  <TabsTrigger value="all">Alle</TabsTrigger>
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
                    : filter === "pending"
                    ? "Keine ausstehenden Einloesungen"
                    : "Keine erfuellten Einloesungen"}
                </p>
                {filter === "pending" && (
                  <p className="text-sm text-muted-foreground">
                    Wunderbar! Alle Einloesungen wurden erfuellt.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {redemptions.map((redemption) => (
                  <RedemptionItem
                    key={redemption.id}
                    redemption={redemption}
                    isAdmin
                    showUser
                    onFulfill={() => {
                      setSelectedRedemption(redemption);
                      setShowFulfillDialog(true);
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Fulfill Dialog */}
      <Dialog open={showFulfillDialog} onOpenChange={setShowFulfillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Einloesung erfuellen</DialogTitle>
            <DialogDescription>
              Markiere diese Einloesung als erfuellt. Das Mitglied wird benachrichtigt.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="notes">Erfuellungsnotiz (optional)</Label>
            <Textarea
              id="notes"
              placeholder="z.B. Wurde am 15.03. uebergeben"
              value={fulfillmentNotes}
              onChange={(e) => setFulfillmentNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Max. 500 Zeichen
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFulfillDialog(false);
                setSelectedRedemption(null);
                setFulfillmentNotes("");
              }}
              disabled={isFulfilling}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleFulfill}
              disabled={isFulfilling}
              className="gap-2"
            >
              {isFulfilling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird erfuellt...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Als erfuellt markieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}