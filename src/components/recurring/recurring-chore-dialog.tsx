"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Repeat, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { RecurrencePatternSelector } from "./recurrence-pattern-selector";
import { CalendarPreview } from "./calendar-preview";
import {
  RecurringChore,
  RecurrenceType,
  RecurrencePattern,
  CreateRecurringInput,
  WeeklyPattern,
  DailyPattern,
  MonthlyPattern,
  CustomPattern,
  RECURRENCE_TYPE_LABELS,
} from "@/types/recurring";
import { recurringFormSchema } from "@/lib/validations/recurring";

interface RecurringChoreDialogProps {
  choreId: string;
  existingRecurring?: RecurringChore | null;
  trigger?: React.ReactNode;
  onCreate?: (data: CreateRecurringInput) => Promise<void>;
  onUpdate?: (data: Partial<CreateRecurringInput>) => Promise<void>;
  onStop?: () => Promise<void>;
}

export function RecurringChoreDialog({
  choreId,
  existingRecurring,
  trigger,
  onCreate,
  onUpdate,
  onStop,
}: RecurringChoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<{
    recurrenceType: RecurrenceType;
    recurrencePattern: RecurrencePattern;
    startDate: string;
    endDate?: string | null | undefined;
  }>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      recurrenceType: existingRecurring?.recurrenceType || "weekly",
      recurrencePattern:
        existingRecurring?.recurrencePattern ||
        ({ days: [1] } as WeeklyPattern),
      startDate: existingRecurring?.startDate
        ? new Date(existingRecurring.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      endDate: existingRecurring?.endDate
        ? new Date(existingRecurring.endDate).toISOString().split("T")[0]
        : null,
    },
  });

  const handleSubmit = async (data: {
    recurrenceType: RecurrenceType;
    recurrencePattern: RecurrencePattern;
    startDate: string;
    endDate?: string | null | undefined;
  }) => {
    setIsSubmitting(true);
    try {
      const input: CreateRecurringInput = {
        choreId,
        recurrenceType: data.recurrenceType,
        recurrencePattern: data.recurrencePattern,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
      };

      if (existingRecurring && onUpdate) {
        await onUpdate(input);
        toast.success("Wiederholung aktualisiert");
      } else if (onCreate) {
        await onCreate(input);
        toast.success("Wiederholung erstellt");
      }

      setOpen(false);
    } catch (error) {
      console.error("Error saving recurring pattern:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Speichern der Wiederholung"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStop = async () => {
    setIsSubmitting(true);
    try {
      if (onStop) {
        await onStop();
        toast.success("Wiederholung gestoppt");
      }
      setShowStopDialog(false);
      setOpen(false);
    } catch (error) {
      console.error("Error stopping recurring:", error);
      toast.error("Fehler beim Stoppen der Wiederholung");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" className="gap-2">
              <Repeat className="w-4 h-4" />
              Wiederholung einrichten
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              {existingRecurring
                ? "Wiederholung bearbeiten"
                : "Wiederholung einrichten"}
            </DialogTitle>
            <DialogDescription>
              Lege fest, wie oft diese Aufgabe wiederholt werden soll.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <RecurrencePatternSelector form={form} />

              <DialogFooter className="gap-2 sm:gap-0">
                {existingRecurring && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowStopDialog(true)}
                    disabled={isSubmitting}
                    className="mr-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Stoppen
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Speichern...
                    </>
                  ) : existingRecurring ? (
                    "Aktualisieren"
                  ) : (
                    "Erstellen"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Stop Confirmation Dialog */}
      <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wiederholung stoppen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Aufgabe wird nicht mehr automatisch wiederholt. Die aktuelle
              Instanz bleibt bestehen und der Verlauf wird beibehalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStop}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Wird gestoppt..." : "Stoppen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}