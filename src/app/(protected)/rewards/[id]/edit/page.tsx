"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, Loader2, Lock, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { RewardForm } from "@/components/rewards";
import { useHousehold } from "@/components/household/household-provider";
import { Reward, UpdateRewardInput } from "@/types/rewards";
import { createClient } from "@/lib/supabase/client";

interface EditRewardPageProps {
  params: Promise<{ id: string }>;
}

export default function EditRewardPage({ params }: EditRewardPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { household, isAdmin, isLoading: isHouseholdLoading } = useHousehold();
  const supabase = createClient();

  const [reward, setReward] = useState<Reward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchReward = async () => {
      if (!household) return;

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("rewards")
          .select("*")
          .eq("id", id)
          .eq("household_id", household.id)
          .single();

        if (error) throw error;

        setReward({
          id: data.id as string,
          householdId: data.household_id as string,
          name: data.name as string,
          description: data.description as string | null,
          imageUrl: data.image_url as string | null,
          pointCost: data.point_cost as number,
          quantityAvailable: data.quantity_available as number | null,
          quantityClaimed: data.quantity_claimed as number,
          status: data.status as Reward["status"],
          createdBy: data.created_by as string,
          createdAt: data.created_at as string,
          updatedAt: data.updated_at as string,
        });
      } catch (error) {
        console.error("Error fetching reward:", error);
        router.push("/rewards");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReward();
  }, [id, household, router, supabase]);

  const handleSubmit = async (data: UpdateRewardInput) => {
    try {
      const response = await fetch(`/api/rewards/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || "Fehler beim Speichern der Belohnung" };
      }

      return { error: null };
    } catch (error) {
      console.error("Error updating reward:", error);
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/rewards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        alert(result.error || "Fehler beim Loeschen der Belohnung");
        return;
      }

      router.push("/rewards");
    } catch (error) {
      console.error("Error deleting reward:", error);
      alert("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Loading state
  if (isHouseholdLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  // Not admin state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">ChoreChamp</span>
            </Link>
            <Link href="/rewards">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurueck
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-lg">
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>Kein Zugriff</CardTitle>
              <CardDescription>
                Nur Admins koennen Belohnungen bearbeiten.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/rewards">
                <Button className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Zu den Belohnungen
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // No reward found
  if (!reward) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ChoreChamp</span>
          </Link>

          <Link href="/rewards">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Zurueck
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Title */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Gift className="w-8 h-8 text-primary" />
              Belohnung bearbeiten
            </h1>
            <p className="text-muted-foreground">
              Bearbeite die Details von "{reward.name}"
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Loeschen
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Belohnungsdetails</CardTitle>
            <CardDescription>
              Aendere die Informationen dieser Belohnung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RewardForm reward={reward} onSubmit={handleSubmit} isEditing />
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Belohnung loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du diese Belohnung loeschen moechtest?
              {reward.quantityClaimed > 0 && (
                <span className="block mt-2 text-yellow-600 dark:text-yellow-400">
                  Hinweis: Diese Belohnung wurde bereits {reward.quantityClaimed} Mal eingeloeset.
                  Archiviere sie stattdessen, um die Historie zu behalten.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird geloescht...
                </>
              ) : (
                "Loeschen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}