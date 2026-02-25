"use client";

import { TrendingUp, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "./level-badge";
import {
  LevelDefinition,
  LEVEL_DEFINITIONS,
  getLevelFromPoints,
  getNextLevel,
  calculateLevelProgress,
} from "@/types/levels";
import { cn } from "@/lib/utils";

interface LevelProgressProps {
  currentPoints: number;
  showCard?: boolean;
  className?: string;
}

export function LevelProgress({
  currentPoints,
  showCard = true,
  className,
}: LevelProgressProps) {
  const currentLevel = getLevelFromPoints(currentPoints);
  const nextLevel = getNextLevel(currentLevel.level);
  const progressPercent = nextLevel
    ? calculateLevelProgress(
        currentPoints,
        currentLevel.pointsRequired,
        nextLevel.pointsRequired
      )
    : 100;

  const pointsToNextLevel = nextLevel
    ? nextLevel.pointsRequired - currentPoints
    : 0;

  if (!showCard) {
    return (
      <div className={cn("space-y-3", className)}>
        <LevelProgressInline
          currentLevel={currentLevel}
          nextLevel={nextLevel}
          currentPoints={currentPoints}
          progressPercent={progressPercent}
          pointsToNextLevel={pointsToNextLevel}
        />
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Level-Fortschritt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LevelProgressInline
          currentLevel={currentLevel}
          nextLevel={nextLevel}
          currentPoints={currentPoints}
          progressPercent={progressPercent}
          pointsToNextLevel={pointsToNextLevel}
        />
      </CardContent>
    </Card>
  );
}

// Inline version without card wrapper
interface LevelProgressInlineProps {
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  currentPoints: number;
  progressPercent: number;
  pointsToNextLevel: number;
}

function LevelProgressInline({
  currentLevel,
  nextLevel,
  currentPoints,
  progressPercent,
  pointsToNextLevel,
}: LevelProgressInlineProps) {
  return (
    <div className="space-y-4">
      {/* Level badges row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LevelBadge level={currentLevel.level} size="md" />
          <div>
            <div className="text-sm text-muted-foreground">Aktuelles Level</div>
            <div className="font-bold text-lg">{currentLevel.title}</div>
          </div>
        </div>

        {nextLevel && (
          <div className="flex items-center gap-2 opacity-50">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
            <LevelBadge level={nextLevel.level} size="sm" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {currentPoints.toLocaleString("de-DE")} Punkte
          </span>
          {nextLevel ? (
            <span className="text-muted-foreground">
              {nextLevel.pointsRequired.toLocaleString("de-DE")} Punkte
            </span>
          ) : (
            <span className="text-primary font-medium">Max Level erreicht!</span>
          )}
        </div>

        <div className="relative">
          <Progress value={progressPercent} className="h-3" />
          {/* Glow effect on progress */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/20 to-primary/40 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{progressPercent.toFixed(1)}%</span>
          {nextLevel && (
            <span className="text-muted-foreground">
              Noch {pointsToNextLevel.toLocaleString("de-DE")} Punkte bis Level{" "}
              {nextLevel.level}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Skeleton version
export function LevelProgressSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Compact header version
export function LevelProgressCompact({
  currentPoints,
  className,
}: {
  currentPoints: number;
  className?: string;
}) {
  const currentLevel = getLevelFromPoints(currentPoints);
  const nextLevel = getNextLevel(currentLevel.level);
  const progressPercent = nextLevel
    ? calculateLevelProgress(
        currentPoints,
        currentLevel.pointsRequired,
        nextLevel.pointsRequired
      )
    : 100;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LevelBadge level={currentLevel.level} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium">{currentLevel.title}</span>
          <span className="text-muted-foreground">{progressPercent.toFixed(0)}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>
    </div>
  );
}