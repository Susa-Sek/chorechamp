"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHousehold } from "@/components/household/household-provider";
import { ChoreForm } from "@/components/chore/chore-form";
import { Chore, CreateChoreInput } from "@/types/chore";
import { toast } from "sonner";

export default function EditChorePage() {
  const params = useParams();
  const router = useRouter();
  const { members } = useHousehold();
  const choreId = params.id as string;

  const [chore, setChore] = useState<Chore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (data: CreateChoreInput) => {
    const response = await fetch(`/api/chores/${choreId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Fehler beim Aktualisieren der Aufgabe" };
    }

    toast.success("Aufgabe erfolgreich aktualisiert");
    return { error: null };
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
              <Button variant="link" onClick={() => router.push("/chores")} className="mt-4">
                Zur Aufgabenliste
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Cannot edit completed chores
  if (chore.status === "completed") {
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
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Erledigte Aufgaben konnen nicht bearbeitet werden.
              </p>
              <Button variant="link" onClick={() => router.push(`/chores/${choreId}`)} className="mt-4">
                Zur Aufgabendetailseite
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
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
          <h1 className="text-2xl font-bold">Aufgabe bearbeiten</h1>
          <p className="text-sm text-muted-foreground">
            Bearbeite die Details der Aufgabe
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
            <ChoreForm
              chore={chore}
              members={members}
              onSubmit={handleSubmit}
              isEditing
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}