"use client";

import Link from "next/link";
import { ArrowLeft, Trophy, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StatisticsDashboard,
  Leaderboard,
} from "@/components/points";
import { PointBalanceCompact } from "@/components/points/point-balance";

export default function StatisticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ChoreChamp</span>
          </Link>

          <div className="flex items-center gap-4">
            <PointBalanceCompact />
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zuruck
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Statistiken
          </h1>
          <p className="text-muted-foreground">
            Verfolge deine Fortschritte und vergleiche dich mit anderen
          </p>
        </div>

        {/* Statistics Dashboard */}
        <StatisticsDashboard className="mb-8" />

        {/* Leaderboard */}
        <Leaderboard
          title="Haushalts-Rangliste"
          description="Wer hat die meisten Punkte in deinem Haushalt?"
        />
      </main>
    </div>
  );
}