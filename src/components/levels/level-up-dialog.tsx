"use client";

import { useEffect, useState, useRef } from "react";
import { PartyPopper, Sparkles, Star, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "./level-badge";
import { LEVEL_DEFINITIONS } from "@/types/levels";
import { cn } from "@/lib/utils";

interface LevelUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousLevel: number;
  newLevel: number;
}

// Simple confetti particle
interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
}

export function LevelUpDialog({
  open,
  onOpenChange,
  previousLevel,
  newLevel,
}: LevelUpDialogProps) {
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [showContent, setShowContent] = useState(false);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const newLevelDef = LEVEL_DEFINITIONS.find((l) => l.level === newLevel) || LEVEL_DEFINITIONS[0];

  // Generate confetti on open
  useEffect(() => {
    if (open) {
      setShowContent(false);

      // Delay showing content for animation
      const contentTimer = setTimeout(() => setShowContent(true), 300);

      // Generate confetti
      const colors = [
        "#FFD700", // Gold
        "#FF6B6B", // Red
        "#4ECDC4", // Teal
        "#45B7D1", // Blue
        "#96E6A1", // Green
        "#DDA0DD", // Plum
        "#F7DC6F", // Yellow
      ];

      const particles: ConfettiParticle[] = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          id: i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 50,
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 8,
          velocityX: (Math.random() - 0.5) * 2,
          velocityY: 1 + Math.random() * 2,
        });
      }
      setConfetti(particles);

      // Animate confetti falling
      let frame = 0;
      const animate = () => {
        frame++;
        setConfetti((prev) =>
          prev.map((p) => ({
            ...p,
            y: p.y + p.velocityY + Math.sin(frame * 0.05 + p.id) * 0.5,
            x: p.x + p.velocityX + Math.cos(frame * 0.03 + p.id) * 0.3,
            rotation: p.rotation + 2,
          }))
        );
        if (frame < 200) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        clearTimeout(contentTimer);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [open]);

  const previousLevelDef = LEVEL_DEFINITIONS.find((l) => l.level === previousLevel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Confetti container */}
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                transform: `rotate(${particle.rotation}deg)`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div
          className={cn(
            "relative z-10 transition-all duration-500",
            showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          <DialogHeader className="text-center items-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <PartyPopper className="w-8 h-8 text-yellow-500 animate-bounce" />
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <PartyPopper className="w-8 h-8 text-yellow-500 animate-bounce" />
            </div>

            <DialogTitle className="text-2xl sm:text-3xl font-bold text-center">
              Level-Up!
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              Glueckwunsch! Du bist aufgestiegen!
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 flex flex-col items-center gap-6">
            {/* Level transition */}
            <div className="flex items-center gap-4">
              {previousLevelDef && (
                <div className="opacity-50 scale-75">
                  <LevelBadge level={previousLevel} size="md" />
                </div>
              )}

              <div className="flex flex-col items-center animate-pulse">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <div className="h-8 w-0.5 bg-gradient-to-b from-yellow-500 to-primary" />
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <LevelBadge level={newLevel} size="lg" showTitle />
              </div>
            </div>

            {/* Level title */}
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Du bist jetzt
              </p>
              <p className="text-2xl font-bold text-primary">
                {newLevelDef.title}
              </p>
            </div>

            {/* Benefits */}
            {newLevelDef.pointsRequired > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Benoetigte Punkte: {newLevelDef.pointsRequired.toLocaleString("de-DE")}</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button onClick={() => onOpenChange(false)} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Weitermachen!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy level-up detection
export function useLevelUpDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    previousLevel: number;
    newLevel: number;
  } | null>(null);

  const showLevelUp = (previousLevel: number, newLevel: number) => {
    if (newLevel > previousLevel) {
      setLevelUpData({ previousLevel, newLevel });
      setIsOpen(true);
    }
  };

  const LevelUpDialogComponent = levelUpData ? (
    <LevelUpDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      previousLevel={levelUpData.previousLevel}
      newLevel={levelUpData.newLevel}
    />
  ) : null;

  return {
    showLevelUp,
    LevelUpDialog: LevelUpDialogComponent,
  };
}