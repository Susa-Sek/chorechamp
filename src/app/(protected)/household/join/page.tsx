"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Users, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  joinHouseholdSchema,
  JoinHouseholdFormData,
} from "@/lib/validations/household";
import { useHousehold } from "@/components/household/household-provider";

export default function JoinHouseholdPage() {
  const { joinHousehold } = useHousehold();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<JoinHouseholdFormData>({
    resolver: zodResolver(joinHouseholdSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: JoinHouseholdFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const result = await joinHousehold(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setSuccess(true);
      // Redirect to dashboard after successful join
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    }
  };

  // Auto-uppercase the code
  const handleCodeChange = (value: string, onChange: (value: string) => void) => {
    onChange(value.toUpperCase());
  };

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

          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Haushalt beitreten</h1>
          <p className="text-muted-foreground">
            Gib den 6-stelligen Einladungscode ein, um einem bestehenden Haushalt beizutreten.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Einladungscode eingeben</CardTitle>
            <CardDescription>
              Der Code wurde dir von einem Haushalts-Admin mitgeteilt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm" role="status">
                    Erfolgreich beigetreten! Du wirst weitergeleitet...
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Einladungscode</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABC123"
                          className="text-base text-center text-2xl tracking-[0.5em] font-mono uppercase"
                          maxLength={6}
                          {...field}
                          onChange={(e) => handleCodeChange(e.target.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        6-stelliger Code (Großbuchstaben und Zahlen)
                      </p>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading || success} className="w-full gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird überprüft...
                    </>
                  ) : success ? (
                    "Beigetreten!"
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Haushalt beitreten
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Create a new household instead */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Möchtest du einen neuen Haushalt erstellen?
          </p>
          <Link href="/household/create">
            <Button variant="outline" className="gap-2">
              Neuen Haushalt erstellen
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
