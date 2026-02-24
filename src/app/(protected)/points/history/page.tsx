"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  Gift,
  Undo2,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePoints } from "@/components/points/points-provider";
import { PointBalanceCompact } from "@/components/points/point-balance";
import {
  PointTransaction,
  TRANSACTION_TYPE_LABELS,
  TransactionType,
} from "@/types/points";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

export default function PointsHistoryPage() {
  const { fetchTransactions, balance } = usePoints();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "earned" | "spent">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    const { transactions: data, total } = await fetchTransactions({
      type: filter,
      page,
      limit: ITEMS_PER_PAGE,
    });
    setTransactions(data);
    setTotalItems(total);
    setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
    setIsLoading(false);
  }, [fetchTransactions, filter, page]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case "chore_completion":
        return <Trophy className="w-4 h-4" />;
      case "bonus":
        return <Gift className="w-4 h-4" />;
      case "undo":
        return <Undo2 className="w-4 h-4" />;
      case "reward_redemption":
        return <Sparkles className="w-4 h-4" />;
      case "streak_bonus":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: TransactionType, points: number) => {
    if (points > 0) {
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
    }
    return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const totalEarned = balance?.totalEarned || 0;
  const totalSpent = balance?.totalSpent || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ChoreChamp</span>
          </Link>

          <div className="flex items-center gap-4">
            <PointBalanceCompact />
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zuruck
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Punkteverlauf</h1>
          <p className="text-muted-foreground">
            Sieh dir alle deine Punktbewegungen an
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktueller Stand</p>
                  <p className="text-xl font-bold">
                    {(balance?.currentBalance || 0).toLocaleString("de-DE")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verdient</p>
                  <p className="text-xl font-bold text-green-600">
                    +{totalEarned.toLocaleString("de-DE")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ausgegeben</p>
                  <p className="text-xl font-bold text-red-600">
                    -{totalSpent.toLocaleString("de-DE")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaktionen</p>
                  <p className="text-xl font-bold">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Transaktionen</CardTitle>
                <CardDescription>
                  Alle deine Punktbewegungen im Uberblick
                </CardDescription>
              </div>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="earned">Verdient</TabsTrigger>
                  <TabsTrigger value="spent">Ausgegeben</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {filter === "all"
                    ? "Noch keine Transaktionen vorhanden"
                    : filter === "earned"
                    ? "Noch keine Punkte verdient"
                    : "Noch keine Punkte ausgegeben"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Erledige Aufgaben, um Punkte zu sammeln!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        getTransactionColor(
                          transaction.transactionType,
                          transaction.points
                        )
                      )}
                    >
                      {getTransactionIcon(transaction.transactionType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {TRANSACTION_TYPE_LABELS[transaction.transactionType]}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.transactionType === "chore_completion" && "Aufgabe"}
                          {transaction.transactionType === "bonus" && "Bonus"}
                          {transaction.transactionType === "undo" && "Ruckgangig"}
                          {transaction.transactionType === "reward_redemption" && "Belohnung"}
                          {transaction.transactionType === "streak_bonus" && "Streak"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(transaction.createdAt)}</span>
                        <span>um</span>
                        <span>{formatTime(transaction.createdAt)}</span>
                        {transaction.description && (
                          <>
                            <span className="hidden sm:inline">-</span>
                            <span className="hidden sm:inline truncate max-w-[150px]">
                              {transaction.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-bold text-lg",
                          transaction.points > 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {transaction.points > 0 ? "+" : ""}
                        {transaction.points}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stand: {transaction.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Zeige {(page - 1) * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(page * ITEMS_PER_PAGE, totalItems)} von {totalItems}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Zuruck
                  </Button>
                  <span className="text-sm">
                    Seite {page} von {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                  >
                    Weiter
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}