"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Mail, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useAuth } from "@/components/auth/auth-provider";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    const { error } = await resetPassword(data.email);

    if (error) {
      setError(error);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-md animate-scale-in text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">E-Mail gesendet!</CardTitle>
            <CardDescription>
              Schau in dein Postfach und folge dem Link, um dein Passwort zurückzusetzen.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/auth/login">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zum Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Passwort vergessen?</CardTitle>
          <CardDescription>
            Keine Sorge! Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="deine@email.de"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Wird gesendet..." : "Link senden"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zurück zum Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}