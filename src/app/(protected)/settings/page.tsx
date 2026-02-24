"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, User, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ReminderPreferencesForm } from "@/components/recurring";
import { ReminderPreferences, UpdateReminderPreferencesInput } from "@/types/recurring";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<ReminderPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/reminders/preferences");
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences);
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleUpdatePreferences = async (data: UpdateReminderPreferencesInput) => {
    const response = await fetch("/api/reminders/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Fehler beim Speichern");
    }

    const updatedData = await response.json();
    setPreferences(updatedData.preferences);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/chores">
            <Button variant="ghost" size="sm" className="gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Zuruck
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Einstellungen</h1>
          <p className="text-sm text-muted-foreground">
            Verwalte deine Prferenzen und Erinnerungen
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Reminder Preferences */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ) : (
          <ReminderPreferencesForm
            initialPreferences={preferences}
            onUpdate={handleUpdatePreferences}
          />
        )}

        {/* Future Settings Sections */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <User className="w-5 h-5" />
              Profil
            </CardTitle>
            <CardDescription>
              Profilbild und Anzeigename andern
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Diese Funktion ist noch nicht verfugbar.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5" />
              Datenschutz
            </CardTitle>
            <CardDescription>
              Datenexport und Konto loschen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Diese Funktion ist noch nicht verfugbar.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}