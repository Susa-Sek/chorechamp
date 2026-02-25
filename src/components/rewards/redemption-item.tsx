"use client";

import { Gift, Clock, CheckCircle, XCircle, User, MoreVertical, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Redemption, REDEMPTION_STATUS_LABELS, REDEMPTION_STATUS_COLORS } from "@/types/rewards";
import { cn } from "@/lib/utils";

interface RedemptionItemProps {
  redemption: Redemption;
  isAdmin?: boolean;
  showUser?: boolean;
  onFulfill?: () => void;
  isFulfilling?: boolean;
}

export function RedemptionItem({
  redemption,
  isAdmin = false,
  showUser = false,
  onFulfill,
  isFulfilling = false,
}: RedemptionItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = () => {
    switch (redemption.status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "fulfilled":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-yellow-500",
      "from-red-500 to-pink-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Card className={cn(
      "transition-all",
      redemption.status === "pending" && "border-yellow-200 dark:border-yellow-800"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Reward Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {redemption.reward?.imageUrl ? (
              <img
                src={redemption.reward.imageUrl}
                alt={redemption.reward.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold truncate">
                  {redemption.reward?.name || "Unbekannte Belohnung"}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{formatDate(redemption.createdAt)}</span>
                  <span>um</span>
                  <span>{formatTime(redemption.createdAt)}</span>
                </div>
              </div>

              {/* Status Badge */}
              <Badge
                variant="secondary"
                className={cn("flex items-center gap-1", REDEMPTION_STATUS_COLORS[redemption.status])}
              >
                {getStatusIcon()}
                {REDEMPTION_STATUS_LABELS[redemption.status]}
              </Badge>
            </div>

            {/* Points and User Info */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">Punkte:</span>
                <span className="font-medium text-red-600">
                  -{redemption.pointsSpent.toLocaleString("de-DE")}
                </span>
              </div>

              {/* Show user if admin view */}
              {showUser && redemption.user && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={redemption.user.avatarUrl || undefined} />
                    <AvatarFallback className={cn(
                      "text-xs bg-gradient-to-br text-white",
                      getAvatarColor(redemption.user.displayName)
                    )}>
                      {getInitials(redemption.user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {redemption.user.displayName}
                  </span>
                </div>
              )}
            </div>

            {/* Fulfillment Info */}
            {redemption.status === "fulfilled" && redemption.fulfilledAt && (
              <div className="mt-2 text-sm text-muted-foreground">
                Erfullt am {formatDate(redemption.fulfilledAt)}
                {redemption.fulfillmentNotes && (
                  <p className="mt-1 text-xs bg-muted p-2 rounded">
                    Notiz: {redemption.fulfillmentNotes}
                  </p>
                )}
              </div>
            )}

            {/* Admin Actions for Pending */}
            {isAdmin && redemption.status === "pending" && onFulfill && (
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={onFulfill}
                  disabled={isFulfilling}
                  className="gap-1.5"
                >
                  {isFulfilling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird erfullt...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Als erfullt markieren
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton version for loading states
export function RedemptionItemSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-muted animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="h-5 bg-muted rounded animate-pulse mb-2 w-32" />
            <div className="h-4 bg-muted rounded animate-pulse mb-2 w-48" />
            <div className="h-4 bg-muted rounded animate-pulse w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}