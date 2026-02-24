"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createChoreSchema } from "@/lib/validations/chore";
import {
  Chore,
  DIFFICULTY_LABELS,
  DIFFICULTY_POINTS,
  CreateChoreInput,
} from "@/types/chore";
import { HouseholdMember } from "@/types/household";

interface ChoreFormProps {
  chore?: Chore;
  members: HouseholdMember[];
  onSubmit: (data: CreateChoreInput) => Promise<{ error: string | null }>;
  isEditing?: boolean;
}

export function ChoreForm({
  chore,
  members,
  onSubmit,
  isEditing = false,
}: ChoreFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateChoreInput>({
    resolver: zodResolver(createChoreSchema),
    defaultValues: {
      title: chore?.title || "",
      description: chore?.description || "",
      assigneeId: chore?.assigneeId || "",
      points: chore?.points || DIFFICULTY_POINTS.medium,
      difficulty: chore?.difficulty || "medium",
      dueDate: chore?.dueDate
        ? new Date(chore.dueDate).toISOString().split("T")[0]
        : "",
    },
  });

  const watchDifficulty = form.watch("difficulty");

  // Update points when difficulty changes (only for new chores)
  const handleDifficultyChange = (value: "easy" | "medium" | "hard") => {
    form.setValue("difficulty", value);
    if (!isEditing) {
      form.setValue("points", DIFFICULTY_POINTS[value]);
    }
  };

  const handleSubmit = async (data: CreateChoreInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Clean up empty strings to undefined/null
      const cleanedData = {
        ...data,
        description: data.description || undefined,
        assigneeId: data.assigneeId || undefined,
        dueDate: data.dueDate || undefined,
      };

      const result = await onSubmit(cleanedData);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Redirect to chores list on success
      router.push("/chores");
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("Ein unerwarteter Fehler ist aufgetreten");
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titel *</FormLabel>
              <FormControl>
                <Input
                  placeholder="z.B. Kuche putzen"
                  maxLength={100}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                2-100 Zeichen
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Weitere Details zur Aufgabe..."
                  maxLength={500}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional, max. 500 Zeichen
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Assignee */}
        <FormField
          control={form.control}
          name="assigneeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zuweisen an</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || "unassigned"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Mitglied auswahlen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs">?</span>
                      </div>
                      <span>Nicht zugewiesen</span>
                    </div>
                  </SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage
                            src={member.profile.avatarUrl || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {member.profile.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.profile.displayName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Optional - kann auch spater zugewiesen werden
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Difficulty */}
        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schwierigkeit *</FormLabel>
              <Select
                onValueChange={handleDifficultyChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Schwierigkeit wahlen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{label}</span>
                        <span className="text-muted-foreground text-sm">
                          {DIFFICULTY_POINTS[value as keyof typeof DIFFICULTY_POINTS]} Punkte
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Points */}
        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punkte *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormDescription>
                Standardwerte: Leicht = 10, Mittel = 20, Schwer = 50
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Due Date */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Falligkeitsdatum</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                Optional - wann soll die Aufgabe erledigt sein?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Wird gespeichert..."
              : isEditing
              ? "Anderungen speichern"
              : "Aufgabe erstellen"}
          </Button>
        </div>
      </form>
    </Form>
  );
}