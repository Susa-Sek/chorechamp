"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gift,
  ArrowLeft,
  Plus,
  Search,
  Trophy,
  Filter,
  Loader2,
  Sparkles,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePoints } from "@/components/points/points-provider";
import { useHousehold } from "@/components/household/household-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { PointBalanceCompact } from "@/components/points/point-balance";
import {
  RewardCard,
  RewardCardSkeleton,
  RedemptionConfirmDialog,
} from "@/components/rewards";
import { Reward } from "@/types/rewards";
import { createClient } from "@/lib/supabase/client";

type SortOption = "newest" | "oldest" | "points_asc" | "points_desc" | "name";

export default function RewardsPage() {
  const router = useRouter();
  const { balance } = usePoints();
  const { household, isAdmin, isLoading: isHouseholdLoading } = useHousehold();
  const { user } = useAuth();
  const supabase = createClient();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [filterAffordable, setFilterAffordable] = useState<"all" | "affordable">("all");

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const fetchRewards = useCallback(async () => {
    if (!household) return;

    setIsLoading(true);

    try {
      let query = supabase
        .from("rewards")
        .select("*")
        .eq("household_id", household.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      let rewardsList: Reward[] = (data || []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        householdId: r.household_id as string,
        name: r.name as string,
        description: r.description as string | null,
        imageUrl: r.image_url as string | null,
        pointCost: r.point_cost as number,
        quantityAvailable: r.quantity_available as number | null,
        quantityClaimed: r.quantity_claimed as number,
        status: r.status as Reward["status"],
        createdBy: r.created_by as string,
        createdAt: r.created_at as string,
        updatedAt: r.updated_at as string,
      }));

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        rewardsList = rewardsList.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.description?.toLowerCase().includes(query)
        );
      }

      // Apply affordable filter
      if (filterAffordable === "affordable") {
        const userPoints = balance?.currentBalance || 0;
        rewardsList = rewardsList.filter((r) => r.pointCost <= userPoints);
      }

      // Apply sorting
      rewardsList.sort((a, b) => {
        switch (sortOption) {
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "points_asc":
            return a.pointCost - b.pointCost;
          case "points_desc":
            return b.pointCost - a.pointCost;
          case "name":
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });

      setRewards(rewardsList);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setIsLoading(false);
    }
  }, [household, supabase, searchQuery, filterAffordable, sortOption, balance?.currentBalance]);

  useEffect(() => {
    if (household) {
      fetchRewards();
    }
  }, [fetchRewards, household]);

  const handleRedeem = async () => {
    if (!selectedReward || !user) return;

    setIsRedeeming(true);

    try {
      const response = await fetch(`/api/rewards/${selectedReward.id}/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Fehler beim Einloesen der Belohnung");
        return;
      }

      setShowRedeemDialog(false);
      setSelectedReward(null);
      fetchRewards();
      // Refresh points
      window.location.reload();
    } catch (error) {
      console.error("Error redeeming reward:", error);
      alert("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsRedeeming(false);
    }
  };

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
                Tritt einem Haushalt bei, um Belohnungen zu sehen.
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Gift className="w-8 h-8 text-primary" />
              Belohnungen
            </h1>
            <p className="text-muted-foreground">
              Loese deine Punkte gegen tolle Belohnungen ein
            </p>
          </div>

          {isAdmin && (
            <Link href="/rewards/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Neue Belohnung
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Belohnung suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter */}
              <Tabs
                value={filterAffordable}
                onValueChange={(v) => setFilterAffordable(v as "all" | "affordable")}
              >
                <TabsList>
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="affordable" className="gap-1.5">
                    <Trophy className="w-4 h-4" />
                    Bezahlbar
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Sort */}
              <Select
                value={sortOption}
                onValueChange={(v) => setSortOption(v as SortOption)}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sortieren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Neueste zuerst</SelectItem>
                  <SelectItem value="oldest">Aelteste zuerst</SelectItem>
                  <SelectItem value="points_asc">Punkte (niedrig)</SelectItem>
                  <SelectItem value="points_desc">Punkte (hoch)</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <RewardCardSkeleton key={i} />
            ))}
          </div>
        ) : rewards.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Keine Belohnungen gefunden</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterAffordable === "affordable"
                  ? "Versuche andere Filteroptionen"
                  : "Es wurden noch keine Belohnungen erstellt"}
              </p>
              {isAdmin && (
                <Link href="/rewards/create">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Erste Belohnung erstellen
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userPoints={balance?.currentBalance || 0}
                isAdmin={isAdmin}
                onRedeem={() => {
                  setSelectedReward(reward);
                  setShowRedeemDialog(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Redemption Confirmation Dialog */}
      <RedemptionConfirmDialog
        reward={selectedReward}
        userPoints={balance?.currentBalance || 0}
        open={showRedeemDialog}
        onOpenChange={setShowRedeemDialog}
        onConfirm={handleRedeem}
        isLoading={isRedeeming}
      />
    </div>
  );
}