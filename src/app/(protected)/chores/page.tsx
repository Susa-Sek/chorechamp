"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useHousehold } from "@/components/household/household-provider";
import { ChoreProvider, useChores } from "@/components/chore/chore-provider";
import { ChoreCard } from "@/components/chore/chore-card";
import { ChoreFilterBar } from "@/components/chore/chore-filter-bar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function ChoresListContent() {
  const { household, members } = useHousehold();
  const {
    chores,
    isLoading,
    error,
    filters,
    sort,
    page,
    totalPages,
    completeChore,
    undoChore,
    deleteChore,
    setFilters,
    setSort,
    setPage,
    clearError,
  } = useChores();

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      const result = await completeChore(id);
      if (result.error) {
        toast.error(result.error);
      } else if (result.pointsEarned) {
        toast.success(`${result.pointsEarned} Punkte verdient!`);
      }
    } finally {
      setCompletingId(null);
    }
  };

  const handleUndo = async (id: string) => {
    setUndoingId(id);
    try {
      const result = await undoChore(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Erledigung ruckgangig gemacht");
      }
    } finally {
      setUndoingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteChore(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Aufgabe geloscht");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      status: "all",
      assigneeId: undefined,
      difficulty: "all",
      search: undefined,
    });
  };

  // Loading state
  if (isLoading && chores.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-5 h-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // No household state
  if (!household) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Kein Haushalt</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p className="mb-4">
            Tritt einem Haushalt bei oder erstelle einen neuen, um Aufgaben zu
            verwalten.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/household/create">
              <Button>Haushalt erstellen</Button>
            </Link>
            <Link href="/household/join">
              <Button variant="outline">Haushalt beitreten</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <ChoreFilterBar
        filters={filters}
        sort={sort}
        members={members}
        onFilterChange={setFilters}
        onSortChange={setSort}
        onReset={handleResetFilters}
      />

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-4 text-center text-red-600 dark:text-red-400">
            <p>{error}</p>
            <Button variant="link" onClick={clearError} className="mt-2">
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && chores.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Aufgaben gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {filters.search ||
              (filters.status && filters.status !== "all") ||
              filters.assigneeId ||
              (filters.difficulty && filters.difficulty !== "all")
                ? "Versuche andere Filteroptionen oder "
                : "Erstelle deine erste Aufgabe, um loszulegen. "}
              <Link
                href="/chores/new"
                className="text-primary hover:underline"
              >
                Neue Aufgabe erstellen
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chores List */}
      {chores.length > 0 && (
        <div className="space-y-3">
          {chores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              onComplete={handleComplete}
              onUndo={handleUndo}
              onDelete={handleDelete}
              isCompleting={completingId === chore.id}
              isUndoing={undoingId === chore.id}
              isDeleting={deletingId === chore.id}
            />
          ))}
        </div>
      )}

      {/* Loading overlay when fetching more */}
      {isLoading && chores.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(Math.max(1, page - 1))}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setPage(i + 1)}
                  isActive={page === i + 1}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

export default function ChoresPage() {
  const { household } = useHousehold();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Aufgaben</h1>
            <p className="text-sm text-muted-foreground">
              Verwalte und erledige deine Haushaltsaufgaben
            </p>
          </div>
          {household && (
            <Link href="/chores/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Neue Aufgabe</span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <ChoreProvider>
          <ChoresListContent />
        </ChoreProvider>
      </main>
    </div>
  );
}