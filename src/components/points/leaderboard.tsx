"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Crown, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePoints } from "./points-provider";
import { LeaderboardEntry, TIME_PERIOD_LABELS } from "@/types/points";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  className?: string;
  showPeriodFilter?: boolean;
  title?: string;
  description?: string;
}

export function Leaderboard({
  className,
  showPeriodFilter = true,
  title = "Rangliste",
  description = "Vergleiche deine Punkte mit anderen Mitgliedern",
}: LeaderboardProps) {
  const { fetchLeaderboard } = usePoints();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<"this_week" | "this_month" | "all_time">("all_time");

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true);
      const data = await fetchLeaderboard({ timePeriod });
      setEntries(data);
      setIsLoading(false);
    };

    loadLeaderboard();
  }, [fetchLeaderboard, timePeriod]);

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
      "from-indigo-500 to-purple-500",
      "from-teal-500 to-green-500",
      "from-amber-500 to-orange-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">
            {rank}
          </span>
        );
    }
  };

  const getRankBackground = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return "bg-primary/10 border-primary/30";
    }
    switch (rank) {
      case 1:
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case 2:
        return "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700";
      case 3:
        return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      default:
        return "bg-muted/50";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showPeriodFilter && (
            <Select
              value={timePeriod}
              onValueChange={(value: "this_week" | "this_month" | "all_time") =>
                setTimePeriod(value)
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_week">{TIME_PERIOD_LABELS.this_week}</SelectItem>
                <SelectItem value="this_month">{TIME_PERIOD_LABELS.this_month}</SelectItem>
                <SelectItem value="all_time">{TIME_PERIOD_LABELS.all_time}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Punkte vergeben</p>
            <p className="text-sm mt-1">Erledige Aufgaben, um Punkte zu sammeln!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  getRankBackground(entry.rank, entry.isCurrentUser)
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="w-8 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar>
                    <AvatarImage src={entry.avatarUrl || undefined} />
                    <AvatarFallback
                      className={cn(
                        "text-white text-sm font-medium bg-gradient-to-br",
                        getAvatarColor(entry.displayName)
                      )}
                    >
                      {getInitials(entry.displayName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.displayName}</span>
                      {entry.isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          Du
                        </Badge>
                      )}
                    </div>
                    {entry.rank <= 3 && (
                      <span className="text-xs text-muted-foreground">
                        {entry.rank === 1 ? "Platz 1 - Spitze!" : `Platz ${entry.rank}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="font-bold text-lg tabular-nums">
                    {entry.totalPoints.toLocaleString("de-DE")}
                  </div>
                  <div className="text-xs text-muted-foreground">Punkte</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}