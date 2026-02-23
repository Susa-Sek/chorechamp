"use client";

import Link from "next/link";
import { Sparkles, Trophy, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";

export default function DashboardPage() {
  const { profile } = useAuth();

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

          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" className="gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-medium">
                  {profile?.displayName?.charAt(0).toUpperCase() || "?"}
                </div>
                <span className="hidden sm:inline">{profile?.displayName}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Willkommen zurück, {profile?.displayName || "Champ"}!
          </h1>
          <p className="text-muted-foreground">
            Hier ist deine Übersicht für heute.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Punkte</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">Level 1</div>
              <div className="text-sm text-muted-foreground">Newcomer</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Aufgaben heute</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Tage Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for household creation */}
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Haushalt erstellen</CardTitle>
            <CardDescription>
              Du bist noch keinem Haushalt beigetreten. Erstelle einen neuen Haushalt
              oder tritt einem bestehenden bei.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="gap-2">
              Haushalt erstellen
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="gap-2">
              Haushalt beitreten
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Meine Aufgaben</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bald verfügbar: Deine zugewiesenen Aufgaben im Überblick.
              </p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Leaderboard</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bald verfügbar: Vergleiche deine Punkte mit anderen.
              </p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Belohnungen</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Bald verfügbar: Löse deine Punkte gegen Belohnungen ein.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}