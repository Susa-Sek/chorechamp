"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePoints } from "./points-provider";
import { cn } from "@/lib/utils";

interface PointBalanceProps {
  showHistoryLink?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PointBalance({
  showHistoryLink = true,
  size = "md",
  className,
}: PointBalanceProps) {
  const { balance, isLoading } = usePoints();
  const [displayPoints, setDisplayPoints] = useState(0);
  const [previousPoints, setPreviousPoints] = useState(0);
  const [showChange, setShowChange] = useState(false);
  const [pointChange, setPointChange] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const points = balance?.currentBalance || 0;

  // Animate point changes
  useEffect(() => {
    if (previousPoints !== points && previousPoints !== 0) {
      const change = points - previousPoints;
      setPointChange(change);
      setShowChange(true);

      // Hide change indicator after 3 seconds
      const hideTimeout = setTimeout(() => {
        setShowChange(false);
      }, 3000);

      // Animate count
      const duration = 500;
      const steps = 20;
      const stepDuration = duration / steps;
      const increment = change / steps;
      let currentStep = 0;
      let currentDisplay = previousPoints;

      const animate = () => {
        currentStep++;
        currentDisplay += increment;

        if (currentStep <= steps) {
          setDisplayPoints(Math.round(currentDisplay));
          animationRef.current = setTimeout(animate, stepDuration);
        } else {
          setDisplayPoints(points);
        }
      };

      animate();

      return () => {
        clearTimeout(hideTimeout);
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
      };
    } else {
      setDisplayPoints(points);
    }
    setPreviousPoints(points);
  }, [points, previousPoints]);

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
  };

  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-muted rounded" />
          <div className="w-16 h-6 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Link href={showHistoryLink ? "/points/history" : "#"}>
        <Button
          variant="ghost"
          className={cn(
            "gap-2 h-auto py-1 px-2 hover:bg-primary/10",
            !showHistoryLink && "cursor-default"
          )}
        >
          <div className="flex items-center gap-1.5">
            <Trophy className={cn("text-yellow-500", iconSizes[size])} />
            <span
              className={cn(
                "font-bold text-primary tabular-nums",
                sizeClasses[size]
              )}
            >
              {displayPoints.toLocaleString("de-DE")}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">Punkte</span>
        </Button>
      </Link>

      {/* Point change indicator */}
      {showChange && pointChange !== 0 && (
        <div
          className={cn(
            "absolute -top-2 -right-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium animate-bounce",
            pointChange > 0
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          )}
        >
          {pointChange > 0 ? (
            <>
              <TrendingUp className="w-3 h-3" />
              +{pointChange}
            </>
          ) : (
            <>
              <TrendingDown className="w-3 h-3" />
              {pointChange}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for header
export function PointBalanceCompact({ className }: { className?: string }) {
  const { balance, isLoading } = usePoints();

  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="w-20 h-5 bg-muted rounded" />
      </div>
    );
  }

  return (
    <Link href="/points/history" className={cn("flex items-center gap-1.5", className)}>
      <Trophy className="w-4 h-4 text-yellow-500" />
      <span className="font-bold text-primary tabular-nums">
        {(balance?.currentBalance || 0).toLocaleString("de-DE")}
      </span>
    </Link>
  );
}