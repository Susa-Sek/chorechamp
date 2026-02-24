"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  MoreVertical,
  Trophy,
  Trash2,
  Undo2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "sonner";
import { useHousehold } from "@/components/household/household-provider";
import { Chore, DIFFICULTY_LABELS, STATUS_LABELS } from "@/types/chore";
import {
  formatDueDate,
  isChoreOverdue,
  isUndoAvailable,
} from "@/lib/validations/chore";

export default function ChoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { household } = useHousehold();
  const choreId = params.id as string;

  const [chore, setChore] = useState<Chore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchChore = async () => {
      if (!choreId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/chores/${choreId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Fehler beim Laden der Aufgabe");
        }

        setChore(data.chore);
      } catch (err) {
        console.error("Error fetching chore:", err);
        setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
      } finally {
        setIsLoading(false);
      }
    };

    fetchChore();
  }, [choreId]);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch(`/api/chores/${choreId}/complete`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Abschliessen");
      }

      toast.success(`${data.pointsEarned} Punkte verdient!`);
      // Refresh chore data
      const refreshResponse = await fetch(`/api/chores/${choreId}`);
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setChore(refreshData.chore);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      const response = await fetch(`/api/chores/${choreId}/undo`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Ruckgangigmachen");
      }

      toast.success("Erledigung ruckgangig gemacht");
      // Refresh chore data
      const refreshResponse = await fetch(`/api/chores/${choreId}`);
      const refreshData = await refreshResponse.json();
      if (refreshResponse.ok) {
        setChore(refreshData.chore);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsUndoing(false);
      setShowUndoDialog(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/chores/${choreId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Loschen");
      }

      toast.success("Aufgabe geloscht");
      router.push("/chores");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !chore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Zuruck
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="py-8 text-center">
              <p className="text-red-600 dark:text-red-400">{error || "Aufgabe nicht gefunden"}</p>
              <Link href="/chores">
                <Button variant="link" className="mt-4">
                  Zur Aufgabenliste
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isOverdue = isChoreOverdue(chore.dueDate, chore.status);
  const canUndo = isUndoAvailable(chore.completedAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Zuruck
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{chore.title}</h1>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className={getStatusColor(chore.status)}>
                  {STATUS_LABELS[chore.status]}
                </Badge>
                <Badge variant="outline" className={getDifficultyColor(chore.difficulty)}>
                  {DIFFICULTY_LABELS[chore.difficulty]}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {chore.status !== "completed" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/chores/${chore.id}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Bearbeiten
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleComplete} disabled={isCompleting}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Erledigen
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {chore.status === "completed" && canUndo && (
                  <>
                    <DropdownMenuItem onClick={() => setShowUndoDialog(true)} disabled={isUndoing}>
                      <Undo2 className="w-4 h-4 mr-2" />
                      Ruckgangig machen
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 dark:text-red-400"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Loschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            {chore.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Beschreibung
                </h3>
                <p className="text-sm">{chore.description}</p>
              </div>
            )}

            {/* Points */}
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium">Punkte</h3>
                <p className="text-2xl font-bold text-primary">{chore.points}</p>
              </div>
            </div>

            <Separator />

            {/* Assignee */}
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Zugewiesen an
                </h3>
                {chore.assignee ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={chore.assignee.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {chore.assignee.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{chore.assignee.displayName}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Nicht zugewiesen</span>
                )}
              </div>
            </div>

            {/* Due Date */}
            {chore.dueDate && (
              <div className="flex items-center gap-3">
                <Calendar className={`w-5 h-5 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`} />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Falligkeitsdatum
                  </h3>
                  <p className={isOverdue ? "text-red-500 font-medium" : ""}>
                    {formatDueDate(chore.dueDate)}
                  </p>
                </div>
              </div>
            )}

            {/* Completion Info */}
            {chore.status === "completed" && chore.completedAt && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Erledigt am
                    </h3>
                    <p className="text-green-600 dark:text-green-400">
                      {new Date(chore.completedAt).toLocaleDateString("de-DE", {
                        weekday: "long",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {chore.completer && (
                      <p className="text-sm text-muted-foreground">
                        von {chore.completer.displayName}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Creator Info */}
            <Separator />
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Erstellt am
                </h3>
                <p>
                  {new Date(chore.createdAt).toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
                {chore.creator && (
                  <p className="text-sm text-muted-foreground">
                    von {chore.creator.displayName}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {chore.status !== "completed" && (
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex-1 gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {isCompleting ? "Wird erledigt..." : "Als erledigt markieren"}
            </Button>
          </div>
        )}
      </main>

      {/* Undo Confirmation Dialog */}
      <AlertDialog open={showUndoDialog} onOpenChange={setShowUndoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erledigung ruckgangig machen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Aufgabe wird wieder als offen markiert und dir werden{" "}
              {chore.points} Punkte abgezogen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleUndo} disabled={isUndoing}>
              {isUndoing ? "Wird bearbeitet..." : "Ruckgangig machen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aufgabe loschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht ruckgangig gemacht werden. Die Aufgabe "
              {chore.title}" wird dauerhaft geloscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Wird geloscht..." : "Loschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}