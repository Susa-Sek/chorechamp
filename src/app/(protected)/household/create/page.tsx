"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Home, ArrowLeft, Loader2 } from "lucide-react";
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
  createHouseholdSchema,
  CreateHouseholdFormData,
} from "@/lib/validations/household";
import { useHousehold } from "@/components/household/household-provider";

export default function CreateHouseholdPage() {
  const router = useRouter();
  const { createHousehold } = useHousehold();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateHouseholdFormData>({
    resolver: zodResolver(createHouseholdSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: CreateHouseholdFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await createHousehold(data);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      // Redirect to dashboard after successful creation
      window.location.href = "/dashboard";
    }
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
            <Home className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Haushalt erstellen</h1>
          <p className="text-muted-foreground">
            Erstelle einen neuen Haushalt, um mit deiner Familie oder WG gemeinsam Aufgaben zu verwalten.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Neuer Haushalt</CardTitle>
            <CardDescription>
              Gib deinem Haushalt einen Namen. Dieser ist für alle Mitglieder sichtbar.
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

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Haushaltsname</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. Familie Müller, WG Berlin"
                          className="text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        3-50 Zeichen
                      </p>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wird erstellt...
                    </>
                  ) : (
                    <>
                      <Home className="w-4 h-4" />
                      Haushalt erstellen
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Already have a code? */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Hast du einen Einladungscode?
          </p>
          <Link href="/household/join">
            <Button variant="outline" className="gap-2">
              Haushalt beitreten
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
