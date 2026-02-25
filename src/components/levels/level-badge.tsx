"use client";

import { Trophy, Star, Crown, Zap, Flame, Sparkles, Award, Medal, Rocket, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LevelDefinition,
  LEVEL_DEFINITIONS,
} from "@/types/levels";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg" | "xl";
  showTitle?: boolean;
  className?: string;
}

// Get icon based on level
function getLevelIcon(level: number, className?: string) {
  const icons: Record<number, React.ReactNode> = {
    1: <Star className={className} />,
    2: <Award className={className} />,
    3: <Medal className={className} />,
    4: <Trophy className={className} />,
    5: <Crown className={className} />,
    6: <Zap className={className} />,
    7: <Flame className={className} />,
    8: <Rocket className={className} />,
    9: <Gem className={className} />,
    10: <Sparkles className={className} />,
  };
  return icons[level] || <Trophy className={className} />;
}

// Get gradient based on level tier
function getLevelGradient(level: number): string {
  if (level >= 10) return "from-amber-400 via-yellow-300 to-amber-500";
  if (level >= 8) return "from-purple-500 via-pink-500 to-rose-500";
  if (level >= 6) return "from-blue-500 via-cyan-500 to-teal-500";
  if (level >= 4) return "from-green-500 via-emerald-500 to-teal-500";
  if (level >= 2) return "from-orange-400 via-amber-400 to-yellow-400";
  return "from-gray-400 via-gray-300 to-gray-500";
}

// Get background glow based on level
function getLevelGlow(level: number): string {
  if (level >= 10) return "shadow-amber-500/50";
  if (level >= 8) return "shadow-purple-500/50";
  if (level >= 6) return "shadow-blue-500/50";
  if (level >= 4) return "shadow-green-500/50";
  if (level >= 2) return "shadow-orange-500/50";
  return "shadow-gray-500/50";
}

export function LevelBadge({
  level,
  size = "md",
  showTitle = false,
  className,
}: LevelBadgeProps) {
  const levelDef = LEVEL_DEFINITIONS.find((l) => l.level === level) || LEVEL_DEFINITIONS[0];

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-lg",
    xl: "w-24 h-24 text-2xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
    xl: "w-10 h-10",
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "relative rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
          sizeClasses[size],
          getLevelGradient(level),
          level >= 5 && "animate-pulse",
          getLevelGlow(level)
        )}
      >
        {/* Inner circle for depth */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

        {/* Level number or icon */}
        <div className="relative flex items-center justify-center text-white font-bold">
          {level <= 3 ? (
            <span className="tabular-nums">{level}</span>
          ) : (
            getLevelIcon(level, cn("text-white", iconSizes[size]))
          )}
        </div>

        {/* Shimmer effect for high levels */}
        {level >= 7 && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
      </div>

      {showTitle && (
        <div className="text-center">
          <div className="text-xs font-medium text-muted-foreground">
            Level {level}
          </div>
          <div className="text-sm font-bold">{levelDef.title}</div>
        </div>
      )}
    </div>
  );
}

// Compact inline badge for headers/lists
export function LevelBadgeCompact({
  level,
  className,
}: {
  level: number;
  className?: string;
}) {
  const levelDef = LEVEL_DEFINITIONS.find((l) => l.level === level) || LEVEL_DEFINITIONS[0];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r text-white text-sm font-medium",
        getLevelGradient(level),
        className
      )}
    >
      {getLevelIcon(level, "w-3.5 h-3.5")}
      <span>{levelDef.title}</span>
    </div>
  );
}

// Mini badge for leaderboards/tables
export function LevelBadgeMini({ level }: { level: number }) {
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shadow-sm",
        getLevelGradient(level)
      )}
    >
      {level}
    </div>
  );
}