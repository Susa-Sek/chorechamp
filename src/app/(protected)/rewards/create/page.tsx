"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RewardForm } from "@/components/rewards";
import { useHousehold } from "@/components/household/household-provider";
import { CreateRewardInput } from "@/types/rewards";

export default function CreateRewardPage() {
  const router = useRouter();
  const { household, isAdmin, isLoading: isHouseholdLoading } = useHousehold();

  const handleSubmit = async (data: CreateRewardInput) => {
    try {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || "Fehler beim Erstellen der Belohnung" };
      }

      return { error: null };
    } catch (error) {
      console.error("Error creating reward:", error);
      return { error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  // Loading state
  if (isHouseholdLoading) {
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
                Nur Admins koennen Belohnungen erstellen.
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Gift className="w-8 h-8 text-primary" />
            Neue Belohnung
          </h1>
          <p className="text-muted-foreground">
            Erstelle eine neue Belohnung fuer deinen Haushalt
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Belohnungsdetails</CardTitle>
            <CardDescription>
              Fuelle die Informationen aus, um eine neue Belohnung zu erstellen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RewardForm onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}