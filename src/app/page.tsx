"use client";

import Link from "next/link";
import {
  Sparkles,
  Trophy,
  Users,
  Calendar,
  Star,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ChoreChamp</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Registrieren</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 animate-float">
          <Trophy className="w-4 h-4" />
          <span className="text-sm font-medium">Gamification für den Haushalt</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Mach deinen Haushalt
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            zum Spiel
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          ChoreChamp motiviert Familien und WGs durch Punkte, Belohnungen und Levels -
          damit Aufgaben Spaß machen und fair verteilt werden.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register">
            <Button size="lg" className="gap-2">
              Kostenlos starten
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              Mehr erfahren
            </Button>
          </Link>
        </div>

        {/* Floating elements for gamification feel */}
        <div className="relative mt-20">
          <div className="absolute -top-10 left-1/4 w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center animate-float" style={{ animationDelay: "0.2s" }}>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="absolute -top-5 right-1/4 w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center animate-float" style={{ animationDelay: "0.5s" }}>
            <Trophy className="w-6 h-6 text-pink-500" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Alles was du brauchst
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            ChoreChamp vereint Aufgabenverwaltung mit Gamification-Elementen für mehr Motivation im Alltag.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Haushalts-Teams</CardTitle>
              <CardDescription>
                Erstelle einen Haushalt und lade Familie oder Mitbewohner per Link ein.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Aufgaben & Routinen</CardTitle>
              <CardDescription>
                Erstelle einmalige oder wiederkehrende Aufgaben und weise sie zu.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-transparent hover:border-primary/20 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <CardTitle>Points & Rewards</CardTitle>
              <CardDescription>
                Sammle Punkte, steige Levels auf und löse individuelle Belohnungen ein.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            So funktioniert&apos;s
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Haushalt erstellen", desc: "Melde dich an und erstelle deinen Haushalt" },
            { step: "2", title: "Mitglieder einladen", desc: "Lade Familie oder Mitbewohner per Link ein" },
            { step: "3", title: "Aufgaben anlegen", desc: "Definiere Aufgaben und weise sie zu" },
            { step: "4", title: "Punkte sammeln", desc: "Erledige Aufgaben und steige im Level auf" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Für Familien & WGs
            </h2>
            <div className="space-y-4">
              {[
                "Transparente Aufgabenverteilung für alle",
                "Motivation durch Punkte und Belohnungen",
                "Fairness durch nachvollziehbare Statistiken",
                "Spaß statt Streit bei der Hausarbeit",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Mock phone/UI preview */}
            <div className="bg-card rounded-3xl shadow-xl p-6 border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent" />
                  <div>
                    <div className="font-semibold">Max</div>
                    <div className="text-xs text-muted-foreground">Level 5 - Champion</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">1,250</div>
                  <div className="text-xs text-muted-foreground">Punkte</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-between">
                    <span>Küche aufräumen</span>
                    <span className="text-sm text-primary font-medium">+20 Pkt</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center justify-between">
                    <span>Wäsche waschen</span>
                    <span className="text-sm text-primary font-medium">+30 Pkt</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <div className="flex items-center justify-between">
                    <span className="line-through">Bad putzen</span>
                    <span className="text-sm text-green-600 font-medium">Erledigt!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-medium shadow-lg animate-float">
              +50 Punkte!
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary to-accent rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bereit, dein Haushalt-Champion zu werden?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Starte jetzt kostenlos und verwandle lästige Aufgaben in ein motivierendes Spiel.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="gap-2">
              Jetzt starten
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">ChoreChamp</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ChoreChamp. Mit Liebe gemacht für fairste Haushalte.
          </p>
        </div>
      </footer>
    </div>
  );
}