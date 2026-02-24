"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Moon, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ReminderPreferences,
  ReminderType,
  UpdateReminderPreferencesInput,
  REMINDER_TYPE_LABELS,
} from "@/types/recurring";
import { reminderPreferencesFormSchema } from "@/lib/validations/recurring";

interface ReminderPreferencesFormProps {
  initialPreferences?: ReminderPreferences | null;
  onUpdate: (data: UpdateReminderPreferencesInput) => Promise<void>;
}

export function ReminderPreferencesForm({
  initialPreferences,
  onUpdate,
}: ReminderPreferencesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<{
    reminderType: ReminderType;
    customHours: number | null;
    pushEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  }>({
    resolver: zodResolver(reminderPreferencesFormSchema),
    defaultValues: {
      reminderType: initialPreferences?.reminderType || "day_before",
      customHours: initialPreferences?.customHours || 24,
      pushEnabled: initialPreferences?.pushEnabled || false,
      quietHoursStart: initialPreferences?.quietHoursStart || "22:00",
      quietHoursEnd: initialPreferences?.quietHoursEnd || "08:00",
    },
  });

  const reminderType = form.watch("reminderType");
  const pushEnabled = form.watch("pushEnabled");

  const handleSubmit = async (data: {
    reminderType: ReminderType;
    customHours: number | null;
    pushEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  }) => {
    setIsSubmitting(true);
    try {
      await onUpdate({
        reminderType: data.reminderType,
        customHours: data.reminderType === "custom_hours_before" && data.customHours != null ? data.customHours : undefined,
        pushEnabled: data.pushEnabled,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
      });
      toast.success("Erinnerungseinstellungen gespeichert");
    } catch (error) {
      console.error("Error updating reminder preferences:", error);
      toast.error("Fehler beim Speichern der Einstellungen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Erinnerungen
        </CardTitle>
        <CardDescription>
          Konfiguriere Erinnerungen für anstehende Aufgaben.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Push Notifications Toggle */}
            <FormField
              control={form.control}
              name="pushEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Push-Benachrichtigungen
                    </FormLabel>
                    <FormDescription>
                      Erhalte Benachrichtigungen für anstehende Aufgaben.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Reminder Type */}
            <FormField
              control={form.control}
              name="reminderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Erinnerungszeitpunkt</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!pushEnabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wähle den Zeitpunkt" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(REMINDER_TYPE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Wann solltest du an Aufgaben erinnert werden?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Hours */}
            {reminderType === "custom_hours_before" && (
              <FormField
                control={form.control}
                name="customHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stunden vor Fälligkeit</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={168}
                          className="w-24"
                          value={field.value || 24}
                          onChange={(e) => {
                            field.onChange(parseInt(e.target.value) || 24);
                          }}
                          disabled={!pushEnabled}
                        />
                        <span className="text-sm text-muted-foreground">
                          Stunden vorher
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Wie viele Stunden vor Fälligkeit soll die Erinnerung
                      kommen?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            {/* Quiet Hours */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Moon className="w-4 h-4" />
                Ruhezeiten
              </div>
              <p className="text-sm text-muted-foreground">
                Keine Benachrichtigungen während dieser Zeiten.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quietHoursStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Von</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={!pushEnabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quietHoursEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bis</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={!pushEnabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Einstellungen speichern"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}