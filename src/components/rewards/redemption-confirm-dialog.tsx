"use client";

import { Gift, Trophy, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Reward } from "@/types/rewards";
import { cn } from "@/lib/utils";

interface RedemptionConfirmDialogProps {
  reward: Reward | null;
  userPoints: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function RedemptionConfirmDialog({
  reward,
  userPoints,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: RedemptionConfirmDialogProps) {
  if (!reward) return null;

  const canAfford = userPoints >= reward.pointCost;
  const remainingPoints = userPoints - reward.pointCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Belohnung einloesen
          </DialogTitle>
          <DialogDescription>
            Bist du sicher, dass du diese Belohnung einloesen moechtest?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reward Preview */}
          <div className="flex gap-4 p-4 rounded-lg bg-muted">
            {/* Image */}
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-background flex-shrink-0">
              {reward.imageUrl ? (
                <img
                  src={reward.imageUrl}
                  alt={reward.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gift className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{reward.name}</h4>
              {reward.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {reward.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-bold">{reward.pointCost.toLocaleString("de-DE")}</span>
                <span className="text-sm text-muted-foreground">Punkte</span>
              </div>
            </div>
          </div>

          {/* Point Balance Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Aktueller Stand</span>
              <span className="font-medium">{userPoints.toLocaleString("de-DE")} Punkte</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kosten</span>
              <span className="font-medium text-red-600">-{reward.pointCost.toLocaleString("de-DE")} Punkte</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-medium">Neuer Stand</span>
              <span className={cn(
                "font-bold",
                remainingPoints < 0 ? "text-red-600" : "text-green-600"
              )}>
                {remainingPoints.toLocaleString("de-DE")} Punkte
              </span>
            </div>
          </div>

          {/* Warning if not enough points */}
          {!canAfford && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Nicht genuegend Punkte</p>
                <p className="text-sm">
                  Du brauchst noch {(reward.pointCost - userPoints).toLocaleString("de-DE")} Punkte.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canAfford || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird eingeloeset...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                Einloesen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}