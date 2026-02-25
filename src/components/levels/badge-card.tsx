"use client";

import { useState } from "react";
import {
  Trophy,
  Flame,
  Star,
  Sparkles,
  Zap,
  Crown,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge as UIBadge } from "@/components/ui/badge";
import {
  BadgeDefinition,
  BadgeProgress,
  UserBadge,
  BADGE_CATEGORY_LABELS,
} from "@/types/levels";
import { cn } from "@/lib/utils";

interface BadgeCardProps {
  badge: BadgeDefinition;
  earnedBadge?: UserBadge;
  progress?: BadgeProgress;
  isLocked?: boolean;
  onClick?: () => void;
}

// Get icon component based on badge icon string
function getBadgeIcon(icon: string, className?: string) {
  const icons: Record<string, React.ReactNode> = {
    trophy: <Trophy className={className} />,
    flame: <Flame className={className} />,
    star: <Star className={className} />,
    sparkles: <Sparkles className={className} />,
    zap: <Zap className={className} />,
    crown: <Crown className={className} />,
    // Emoji fallback
    default: null,
  };
  return icons[icon.toLowerCase()] || null;
}

export function BadgeCard({
  badge,
  earnedBadge,
  progress,
  isLocked = false,
  onClick,
}: BadgeCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isEarned = !!earnedBadge;
  const progressPercent = progress
    ? Math.min((progress.currentValue / badge.criteria.value) * 100, 100)
    : 0;

  // Check if icon is an emoji
  const isEmoji = badge.icon.length <= 2 && !/^[a-zA-Z]+$/.test(badge.icon);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md group",
            isLocked && "opacity-50 grayscale",
            isEarned && "ring-2 ring-primary/30 bg-primary/5",
            "hover:scale-105"
          )}
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-3">
              {/* Badge Icon */}
              <div
                className={cn(
                  "relative w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform group-hover:scale-110",
                  isEarned
                    ? "bg-gradient-to-br from-primary/20 to-accent/20"
                    : "bg-muted",
                  isLocked && "grayscale"
                )}
              >
                {isLocked ? (
                  <Lock className="w-6 h-6 text-muted-foreground" />
                ) : isEmoji ? (
                  <span className="text-3xl">{badge.icon}</span>
                ) : (
                  getBadgeIcon(
                    badge.icon,
                    cn(
                      "w-7 h-7",
                      isEarned ? "text-primary" : "text-muted-foreground"
                    )
                  ) || <span className="text-3xl">trophy</span>
                )}

                {/* Earned indicator */}
                {isEarned && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Badge Name */}
              <div>
                <h3 className="font-semibold text-sm line-clamp-1">
                  {badge.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {badge.description}
                </p>
              </div>

              {/* Progress (if in progress) */}
              {!isEarned && !isLocked && progress && progressPercent > 0 && (
                <div className="w-full space-y-1">
                  <Progress value={progressPercent} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {progress.currentValue} / {badge.criteria.value}
                  </p>
                </div>
              )}

              {/* Category badge */}
              <UIBadge variant="outline" className="text-xs">
                {BADGE_CATEGORY_LABELS[badge.category]}
              </UIBadge>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      {/* Detail Dialog */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEmoji ? (
              <span className="text-2xl">{badge.icon}</span>
            ) : (
              getBadgeIcon(badge.icon, "w-6 h-6 text-primary")
            )}
            {badge.name}
          </DialogTitle>
          <DialogDescription>{badge.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            {isEarned ? (
              <UIBadge className="bg-green-500 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verdient
              </UIBadge>
            ) : isLocked ? (
              <UIBadge variant="secondary">
                <Lock className="w-3 h-3 mr-1" />
                Gesperrt
              </UIBadge>
            ) : (
              <UIBadge variant="outline">Verfuegbar</UIBadge>
            )}
          </div>

          {/* Category */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Kategorie</span>
            <UIBadge variant="outline">{BADGE_CATEGORY_LABELS[badge.category]}</UIBadge>
          </div>

          {/* Criteria */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Anforderung</span>
            <span className="text-sm font-medium">
              {badge.criteria.type === "chores_completed" &&
                `${badge.criteria.value} Aufgaben`}
              {badge.criteria.type === "streak_days" &&
                `${badge.criteria.value} Tage Serie`}
              {badge.criteria.type === "total_points" &&
                `${badge.criteria.value} Punkte`}
              {badge.criteria.type === "special" && "Spezial"}
            </span>
          </div>

          {/* Points Reward */}
          {badge.pointsReward > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Punkte-Bonus</span>
              <span className="text-sm font-medium text-primary">
                +{badge.pointsReward} Punkte
              </span>
            </div>
          )}

          {/* Progress */}
          {!isEarned && progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fortschritt</span>
                <span className="font-medium">
                  {progress.currentValue} / {badge.criteria.value}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Earned date */}
          {isEarned && earnedBadge && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Verdient am</span>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Clock className="w-3 h-3" />
                {new Date(earnedBadge.earnedAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Skeleton version
export function BadgeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2 w-full">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mx-auto" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse mx-auto" />
          </div>
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}