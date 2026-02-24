"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CelebrationConfig {
  points: number;
  source: string;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  velocity: { x: number; y: number };
}

const CONFETTI_COLORS = [
  "#FFD700", // Gold
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
];

export function usePointsCelebration() {
  const [celebration, setCelebration] = useState<CelebrationConfig | null>(null);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const celebrate = useCallback((config: CelebrationConfig) => {
    setCelebration(config);

    // Show toast notification
    toast.custom(
      (t) => (
        <div className="flex items-center gap-3 bg-card border rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              +{config.points} Punkte!
            </p>
            <p className="text-sm text-muted-foreground">{config.source}</p>
          </div>
        </div>
      ),
      {
        duration: 4000,
        position: "top-center",
      }
    );

    // Generate confetti
    const newConfetti: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      newConfetti.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        velocity: {
          x: (Math.random() - 0.5) * 20,
          y: Math.random() * 10 + 5,
        },
      });
    }
    setConfetti(newConfetti);

    // Clear after animation
    setTimeout(() => {
      setConfetti([]);
      setCelebration(null);
      config.onComplete?.();
    }, 3000);
  }, []);

  return { celebrate, confetti, celebration };
}

interface PointsCelebrationProps {
  confetti: ConfettiPiece[];
}

export function PointsCelebration({ confetti }: PointsCelebrationProps) {
  if (confetti.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            animation: `confetti-fall 3s ease-out forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}

      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Simple celebration effect without confetti (for smaller celebrations)
export function PointsToast({ points, source }: { points: number; source: string }) {
  return (
    <div className="flex items-center gap-3 bg-card border rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-semibold text-foreground">
          +{points} Punkte!
        </p>
        <p className="text-sm text-muted-foreground">{source}</p>
      </div>
    </div>
  );
}

// Hook for showing celebration toast
export function showPointsToast(points: number, source: string) {
  toast.custom(
    (t) => (
      <div className="flex items-center gap-3 bg-card border rounded-lg p-4 shadow-lg animate-in slide-in-from-top-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            +{points} Punkte!
          </p>
          <p className="text-sm text-muted-foreground">{source}</p>
        </div>
      </div>
    ),
    {
      duration: 4000,
      position: "top-center",
    }
  );
}