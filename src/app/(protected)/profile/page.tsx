"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, User, Mail, Save, ArrowLeft, LogOut, Home, Users } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/auth-provider";
import { useHousehold } from "@/components/household/household-provider";
import { profileSchema, ProfileFormData } from "@/lib/validations/auth";

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { household, isAdmin } = useHousehold();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || "",
    },
  });

  // Reset form when profile changes or canceling edit
  const handleCancel = () => {
    form.reset({ displayName: profile?.displayName || "" });
    setIsEditing(false);
    setError(null);
    setSuccess(false);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await updateProfile(data.displayName);

    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setIsEditing(false);
    }

    setIsLoading(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-yellow-500",
      "from-red-500 to-pink-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Profil</h1>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColor(
                  profile?.displayName || "User"
                )} flex items-center justify-center text-white text-2xl font-bold`}
              >
                {getInitials(profile?.displayName || "User")}
              </div>
              <div>
                <CardTitle>{profile?.displayName}</CardTitle>
                <CardDescription>Mitglied seit {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("de-DE") : "Unbekannt"}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Household Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5" />
              Haushalt
            </CardTitle>
            <CardDescription>
              Dein aktueller Haushalt
            </CardDescription>
          </CardHeader>
          <CardContent>
            {household ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{household.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {isAdmin ? "Admin" : "Mitglied"}
                    </div>
                  </div>
                </div>
                <Link href="/household">
                  <Button variant="outline" size="sm" className="gap-2">
                    Verwalten
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-3">
                  Du bist noch keinem Haushalt beigetreten
                </p>
                <div className="flex gap-2 justify-center">
                  <Link href="/household/create">
                    <Button size="sm">Erstellen</Button>
                  </Link>
                  <Link href="/household/join">
                    <Button variant="outline" size="sm">Beitreten</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Profil bearbeiten</CardTitle>
            <CardDescription>
              Aktualisiere deine persönlichen Informationen
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

                {success && (
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
                    Profil erfolgreich aktualisiert!
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anzeigename</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="Dein Name" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">E-Mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="pl-10 bg-muted"
                      placeholder="E-Mail wird vom System verwaltet"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    E-Mail-Änderungen werden über die Authentifizierungseinstellungen verwaltet.
                  </p>
                </div>

                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <Button type="submit" disabled={isLoading} className="gap-2">
                        <Save className="w-4 h-4" />
                        {isLoading ? "Speichern..." : "Speichern"}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Abbrechen
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => setIsEditing(true)}>
                      Profil bearbeiten
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Gefahrenbereich</CardTitle>
            <CardDescription>
              Aktionen, die nicht rückgängig gemacht werden können
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full gap-2" onClick={signOut}>
              <LogOut className="w-4 h-4" />
              Abmelden
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}