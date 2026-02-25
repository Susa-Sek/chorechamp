"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift, Trophy, Lock, Package, MoreVertical, Edit, Archive, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Reward, REWARD_STATUS_LABELS } from "@/types/rewards";
import { cn } from "@/lib/utils";

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  isAdmin?: boolean;
  onRedeem?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  isRedeeming?: boolean;
  showActions?: boolean;
}

export function RewardCard({
  reward,
  userPoints,
  isAdmin = false,
  onRedeem,
  onArchive,
  onDelete,
  isRedeeming = false,
  showActions = true,
}: RewardCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canAfford = userPoints >= reward.pointCost;
  const hasQuantity = reward.quantityAvailable === null || reward.quantityAvailable > reward.quantityClaimed;
  const isArchived = reward.status === "archived";
  const isDraft = reward.status === "draft";
  const canRedeem = canAfford && hasQuantity && !isArchived && !isDraft;

  const remainingQuantity = reward.quantityAvailable !== null
    ? reward.quantityAvailable - reward.quantityClaimed
    : null;

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden transition-all hover:shadow-md",
          isArchived && "opacity-60",
          isDraft && "border-dashed"
        )}
      >
        {/* Image */}
        <div className="aspect-video relative bg-muted">
          {reward.imageUrl ? (
            <img
              src={reward.imageUrl}
              alt={reward.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gift className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}

          {/* Status Badge */}
          {(isDraft || isArchived) && (
            <div className="absolute top-2 left-2">
              <Badge variant={isDraft ? "outline" : "secondary"}>
                {REWARD_STATUS_LABELS[reward.status]}
              </Badge>
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && showActions && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/rewards/${reward.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {reward.status !== "archived" && (
                    <DropdownMenuItem onClick={onArchive}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archivieren
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Loeschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Quantity Badge */}
          {remainingQuantity !== null && remainingQuantity <= 5 && remainingQuantity > 0 && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                <Package className="h-3 w-3 mr-1" />
                Nur noch {remainingQuantity}
              </Badge>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {!hasQuantity && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Nicht mehr verfuegbar</p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1 truncate">{reward.name}</h3>
          {reward.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {reward.description}
            </p>
          )}

          {/* Points and Redeem */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className={cn(
                "font-bold text-lg",
                !canAfford && "text-muted-foreground"
              )}>
                {reward.pointCost.toLocaleString("de-DE")}
              </span>
              <span className="text-sm text-muted-foreground">Punkte</span>
            </div>

            {showActions && onRedeem && !isAdmin && (
              <Button
                size="sm"
                disabled={!canRedeem || isRedeeming}
                onClick={onRedeem}
                className="gap-1.5"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Einloesen...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    Einloesen
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Can't afford indicator */}
          {!canAfford && showActions && !isAdmin && (
            <p className="text-xs text-muted-foreground mt-2">
              Du brauchst noch {(reward.pointCost - userPoints).toLocaleString("de-DE")} Punkte
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Belohnung loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du diese Belohnung loeschen moechtest? Diese Aktion kann nicht rueckgaengig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteDialog(false);
                onDelete?.();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Loeschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Skeleton version for loading states
export function RewardCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="h-6 bg-muted rounded animate-pulse mb-2" />
        <div className="h-4 bg-muted rounded animate-pulse mb-1 w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse mb-3 w-1/2" />
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}