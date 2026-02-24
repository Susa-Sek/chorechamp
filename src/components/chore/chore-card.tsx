"use client";

import Link from "next/link";
import {
  CheckCircle,
  Circle,
  Clock,
  User,
  MoreVertical,
  Calendar,
  Trophy,
  Undo2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Chore,
  DIFFICULTY_LABELS,
  STATUS_LABELS,
} from "@/types/chore";
import {
  formatDueDate,
  isChoreOverdue,
  isUndoAvailable,
} from "@/lib/validations/chore";
import { useState } from "react";

interface ChoreCardProps {
  chore: Chore;
  onComplete?: (id: string) => Promise<void>;
  onUndo?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isCompleting?: boolean;
  isUndoing?: boolean;
  isDeleting?: boolean;
}

export function ChoreCard({
  chore,
  onComplete,
  onUndo,
  onDelete,
  isCompleting = false,
  isUndoing = false,
  isDeleting = false,
}: ChoreCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUndoDialog, setShowUndoDialog] = useState(false);

  const isOverdue = isChoreOverdue(chore.dueDate, chore.status);
  const canUndo = isUndoAvailable(chore.completedAt);

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

  const handleComplete = async () => {
    if (onComplete) {
      await onComplete(chore.id);
    }
  };

  const handleUndo = async () => {
    if (onUndo) {
      await onUndo(chore.id);
    }
    setShowUndoDialog(false);
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(chore.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card
        className={`transition-all hover:shadow-md ${
          chore.status === "completed"
            ? "opacity-75 bg-muted/50"
            : isOverdue
            ? "border-red-300 dark:border-red-800"
            : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Status Icon / Complete Button */}
            <div className="flex-shrink-0 pt-1">
              {chore.status === "completed" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 rounded-full"
                  onClick={handleComplete}
                  disabled={isCompleting}
                  aria-label="Als erledigt markieren"
                >
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <Link href={`/chores/${chore.id}`}>
                <h3
                  className={`font-medium mb-1 hover:text-primary transition-colors ${
                    chore.status === "completed" ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {chore.title}
                </h3>
              </Link>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className={getStatusColor(chore.status)}>
                  {STATUS_LABELS[chore.status]}
                </Badge>
                <Badge variant="outline" className={getDifficultyColor(chore.difficulty)}>
                  {DIFFICULTY_LABELS[chore.difficulty]}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Trophy className="w-3 h-3" />
                  {chore.points} P
                </Badge>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {/* Assignee */}
                {chore.assignee ? (
                  <div className="flex items-center gap-1">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={chore.assignee.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {chore.assignee.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{chore.assignee.displayName}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Nicht zugewiesen</span>
                  </div>
                )}

                {/* Due Date */}
                {chore.dueDate && (
                  <div
                    className={`flex items-center gap-1 ${
                      isOverdue ? "text-red-500" : ""
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{formatDueDate(chore.dueDate)}</span>
                  </div>
                )}

                {/* Completed Info */}
                {chore.status === "completed" && chore.completedAt && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Erledigt{" "}
                      {new Date(chore.completedAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <MoreVertical className="w-4 h-4" />
                    <span className="sr-only">Aktionen</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {chore.status !== "completed" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/chores/${chore.id}/edit`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Bearbeiten
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleComplete}
                        disabled={isCompleting}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Erledigen
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {chore.status === "completed" && canUndo && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setShowUndoDialog(true)}
                        disabled={isUndoing}
                      >
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
        </CardContent>
      </Card>

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
    </>
  );
}