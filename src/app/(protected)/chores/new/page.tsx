"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHousehold } from "@/components/household/household-provider";
import { ChoreForm } from "@/components/chore/chore-form";
import { createClient } from "@/lib/supabase/client";
import { CreateChoreInput } from "@/types/chore";
import { toast } from "sonner";

export default function NewChorePage() {
  const router = useRouter();
  const { household, members } = useHousehold();

  // Redirect if no household
  useEffect(() => {
    if (!household) {
      router.push("/household");
    }
  }, [household, router]);

  const handleSubmit = async (data: CreateChoreInput) => {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Nicht angemeldet" };
    }

    // Create chore via API
    const response = await fetch("/api/chores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Fehler beim Erstellen der Aufgabe" };
    }

    toast.success("Aufgabe erfolgreich erstellt");
    return { error: null };
  };

  if (!household) {
    return null;
  }

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
          <h1 className="text-2xl font-bold">Neue Aufgabe</h1>
          <p className="text-sm text-muted-foreground">
            Erstelle eine neue Haushaltsaufgabe
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Aufgabendetails</CardTitle>
          </CardHeader>
          <CardContent>
            <ChoreForm members={members} onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}