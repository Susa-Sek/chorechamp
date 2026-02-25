"use client";

import { useState, useMemo } from "react";
import { Filter, Search, Trophy, Lock, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCard, BadgeCardSkeleton } from "./badge-card";
import {
  BadgeDefinition,
  BadgeProgress,
  UserBadge,
  BadgeCategory,
  BADGE_CATEGORY_LABELS,
} from "@/types/levels";
import { cn } from "@/lib/utils";

interface BadgeGridProps {
  badges: BadgeDefinition[];
  earnedBadges: UserBadge[];
  badgeProgress: BadgeProgress[];
  isLoading?: boolean;
  className?: string;
}

type FilterType = "all" | "earned" | "locked" | "in_progress";

export function BadgeGrid({
  badges,
  earnedBadges,
  badgeProgress,
  isLoading = false,
  className,
}: BadgeGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | "all">("all");

  // Create lookup maps for quick access
  const earnedMap = useMemo(() => {
    const map = new Map<string, UserBadge>();
    earnedBadges.forEach((ub) => map.set(ub.badgeId, ub));
    return map;
  }, [earnedBadges]);

  const progressMap = useMemo(() => {
    const map = new Map<string, BadgeProgress>();
    badgeProgress.forEach((bp) => map.set(bp.badgeId, bp));
    return map;
  }, [badgeProgress]);

  // Filter and sort badges
  const filteredBadges = useMemo(() => {
    let result = badges.map((badge) => ({
      badge,
      earned: earnedMap.get(badge.id),
      progress: progressMap.get(badge.id),
    }));

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.badge.name.toLowerCase().includes(query) ||
          item.badge.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((item) => item.badge.category === categoryFilter);
    }

    // Status filter
    switch (filter) {
      case "earned":
        result = result.filter((item) => item.earned);
        break;
      case "locked":
        result = result.filter((item) => !item.earned && !item.progress);
        break;
      case "in_progress":
        result = result.filter(
          (item) => !item.earned && item.progress && item.progress.currentValue > 0
        );
        break;
    }

    // Sort: earned first, then in progress, then locked
    result.sort((a, b) => {
      if (a.earned && !b.earned) return -1;
      if (!a.earned && b.earned) return 1;
      if (a.progress && !b.progress) return -1;
      if (!a.progress && b.progress) return 1;
      return a.badge.name.localeCompare(b.badge.name);
    });

    return result;
  }, [badges, earnedMap, progressMap, searchQuery, categoryFilter, filter]);

  // Stats
  const stats = useMemo(() => {
    const earned = earnedBadges.length;
    const total = badges.length;
    const inProgress = badgeProgress.filter(
      (bp) => bp.currentValue > 0 && !earnedMap.has(bp.badgeId)
    ).length;
    return { earned, total, inProgress };
  }, [badges.length, earnedBadges.length, badgeProgress, earnedMap]);

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Filter skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 flex-1 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <BadgeCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="font-medium">{stats.earned}</span>
          <span className="text-muted-foreground">von {stats.total} verdient</span>
        </div>
        {stats.inProgress > 0 && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="font-medium">{stats.inProgress}</span>
            <span className="text-muted-foreground">in Arbeit</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Abzeichen suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status filter */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="earned" className="gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Verdient
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              In Arbeit
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as BadgeCategory | "all")}>
          <SelectTrigger className="w-[140px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {Object.entries(BADGE_CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Badge grid */}
      {filteredBadges.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Keine Abzeichen gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filter !== "all" || categoryFilter !== "all"
                ? "Versuche andere Filteroptionen"
                : "Es gibt noch keine Abzeichen zu zeigen"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredBadges.map(({ badge, earned, progress }) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earnedBadge={earned}
              progress={progress}
            />
          ))}
        </div>
      )}
    </div>
  );
}