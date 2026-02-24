"use client";

import Link from "next/link";
import { Sparkles, Trophy, Users, CheckCircle, ArrowRight, Settings, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { useHousehold } from "@/components/household/household-provider";

export default function DashboardPage() {
  const { profile } = useAuth();
  const { household, isLoading: isHouseholdLoading } = useHousehold();

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

          <div className="flex items-center gap-2 sm:gap-4">
            {household && (
              <Link href="/household">
                <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
                  <Home className="w-4 h-4" />
                  {household.name}
                </Button>
                <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Haushalt">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
            )}
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

        {/* Household Section */}
        {isHouseholdLoading ? (
          <Card className="mb-8">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                Wird geladen...
              </div>
            </CardContent>
          </Card>
        ) : !household ? (
          /* No household - show create/join options */
          <Card className="border-dashed mb-8">
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
              <Link href="/household/create">
                <Button className="gap-2">
                  Haushalt erstellen
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/household/join">
                <Button variant="outline" className="gap-2">
                  Haushalt beitreten
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Has household - show household info */
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Home className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{household.name}</CardTitle>
                    <CardDescription>Dein Haushalt</CardDescription>
                  </div>
                </div>
                <Link href="/household">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Verwalten
                  </Button>
                </Link>
              </div>
            </CardHeader>
          </Card>
        )}

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
