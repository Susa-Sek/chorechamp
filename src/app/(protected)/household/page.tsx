"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Crown,
  LogOut,
  UserPlus,
  Clock,
  MoreVertical,
  Loader2,
  Gift,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHousehold } from "@/components/household/household-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { formatExpirationDate } from "@/lib/validations/household";
import { Leaderboard } from "@/components/points";
import { BonusPointsDialog } from "@/components/points/bonus-points-dialog";
import { PointBalanceCompact } from "@/components/points/point-balance";

export default function HouseholdPage() {
  const { profile, user } = useAuth();
  const {
    household,
    members,
    inviteCodes,
    isLoading,
    isAdmin,
    leaveHousehold,
    removeMember,
    transferAdmin,
    generateInviteCode,
    revokeInviteCode,
  } = useHousehold();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showBonusDialog, setShowBonusDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<string | null>(null);
  const [inviteExpiresIn, setInviteExpiresIn] = useState("7");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy code to clipboard
  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Generate new invite code
  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setError(null);

    const result = await generateInviteCode(parseInt(inviteExpiresIn));

    if (result.error) {
      setError(result.error);
    } else {
      setShowInviteDialog(false);
      // Auto-copy the new code
      if (result.code) {
        await copyToClipboard(result.code);
      }
    }

    setIsGenerating(false);
  };

  // Leave household
  const handleLeave = async () => {
    setIsLeaving(true);
    setError(null);

    const result = await leaveHousehold();

    if (result.error) {
      setError(result.error);
      setIsLeaving(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  // Transfer admin role
  const handleTransferAdmin = async () => {
    if (!selectedNewAdmin) return;

    setIsTransferring(true);
    setError(null);

    const result = await transferAdmin(selectedNewAdmin);

    if (result.error) {
      setError(result.error);
    } else {
      setShowTransferDialog(false);
      setSelectedNewAdmin(null);
    }

    setIsTransferring(false);
  };

  // Remove member
  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setIsRemoving(true);
    setError(null);

    const result = await removeMember(selectedMember);

    if (result.error) {
      setError(result.error);
    } else {
      setShowRemoveDialog(false);
      setSelectedMember(null);
    }

    setIsRemoving(false);
  };

  // Get avatar initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  // No household state
  if (!household) {
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

            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-lg">
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Kein Haushalt gefunden</CardTitle>
              <CardDescription>
                Du bist noch keinem Haushalt beigetreten. Erstelle einen neuen Haushalt oder tritt einem bestehenden bei.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/household/create">
                <Button className="gap-2">
                  Haushalt erstellen
                </Button>
              </Link>
              <Link href="/household/join">
                <Button variant="outline" className="gap-2">
                  Haushalt beitreten
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{household.name}</h1>
          <p className="text-muted-foreground">
            {members.length} {members.length === 1 ? "Mitglied" : "Mitglieder"}
            {isAdmin && " - Du bist Admin"}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-6" role="alert">
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-auto p-0 text-destructive underline"
              onClick={() => setError(null)}
            >
              Schließen
            </Button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Members Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Mitglieder
                  </CardTitle>
                  <CardDescription>
                    Alle Mitglieder dieses Haushalts
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Einladen
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profile.avatarUrl || undefined} />
                        <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(member.profile.displayName)} text-white`}>
                          {getInitials(member.profile.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.profile.displayName}
                          </span>
                          {member.role === "admin" && (
                            <Badge variant="secondary" className="gap-1">
                              <Crown className="w-3 h-3" />
                              Admin
                            </Badge>
                          )}
                          {member.userId === user?.id && (
                            <Badge variant="outline">Du</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Dabei seit {formatDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Admin actions for other members */}
                    {isAdmin && member.userId !== user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Mitgliedsoptionen">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(member.userId);
                              setShowBonusDialog(true);
                            }}
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Bonuspunkte
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(member.id);
                              setShowTransferDialog(true);
                            }}
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Admin ubertragen
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedMember(member.id);
                              setShowRemoveDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Entfernen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invite Codes Section (Admin only) */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Einladungscodes
                </CardTitle>
                <CardDescription>
                  Aktive Einladungscodes für diesen Haushalt
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inviteCodes.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Keine aktiven Einladungscodes</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-2"
                      onClick={() => setShowInviteDialog(true)}
                    >
                      <UserPlus className="w-4 h-4" />
                      Code erstellen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inviteCodes.map((code) => (
                      <div
                        key={code.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <code className="font-mono text-lg tracking-wider bg-background px-3 py-1 rounded" data-testid="invite-code">
                            {code.code}
                          </code>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {formatExpirationDate(code.expiresAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(code.code)}
                            aria-label="Code kopieren"
                          >
                            {copiedCode === code.code ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => revokeInviteCode(code.id)}
                            aria-label="Code widerrufen"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setShowInviteDialog(true)}
                    >
                      <UserPlus className="w-4 h-4" />
                      Neuen Code erstellen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Leaderboard Section */}
        <div className="mt-6">
          <Leaderboard
            title="Punkte-Rangliste"
            description="Vergleiche deine Punkte mit anderen Mitgliedern"
          />
        </div>

        {/* Bonus Points Button for Admins */}
        {isAdmin && (
          <Card className="mt-6 border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Bonuspunkte vergeben
              </CardTitle>
              <CardDescription>
                Belohne Mitglieder fur besondere Leistungen mit zusatzlichen Punkten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="gap-2"
                onClick={() => setShowBonusDialog(true)}
              >
                <Gift className="w-4 h-4" />
                Bonuspunkte vergeben
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Redemptions Management for Admins */}
        {isAdmin && (
          <Card className="mt-6 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="w-5 h-5 text-yellow-600" />
                Einloesungen verwalten
              </CardTitle>
              <CardDescription>
                Sieh und verwalte alle eingeloeesten Belohnungen deiner Mitglieder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/household/redemptions">
                <Button variant="outline" className="gap-2">
                  <Gift className="w-4 h-4" />
                  Einloesungen anzeigen
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Leave Household Section */}
        <Card className="mt-6 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Haushalt verlassen
            </CardTitle>
            <CardDescription>
              {isAdmin && members.length > 1
                ? "Als Admin musst du zuerst die Admin-Rolle an ein anderes Mitglied übertragen, bevor du den Haushalt verlassen kannst."
                : "Verlasse diesen Haushalt. Du kannst später einem anderen beitreten oder einen neuen erstellen."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
              disabled={isAdmin && members.length > 1}
              onClick={() => setShowLeaveDialog(true)}
            >
              <LogOut className="w-4 h-4" />
              Haushalt verlassen
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Generate Invite Code Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Einladungscode erstellen</DialogTitle>
            <DialogDescription>
              Erstelle einen neuen Einladungscode, um Mitglieder in deinen Haushalt einzuladen.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Gültigkeitsdauer
            </label>
            <Select value={inviteExpiresIn} onValueChange={setInviteExpiresIn}>
              <SelectTrigger>
                <SelectValue placeholder="Wähle die Gültigkeitsdauer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Tag</SelectItem>
                <SelectItem value="3">3 Tage</SelectItem>
                <SelectItem value="7">7 Tage (Standard)</SelectItem>
                <SelectItem value="14">14 Tage</SelectItem>
                <SelectItem value="30">30 Tage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleGenerateCode} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                "Code erstellen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Household Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Haushalt wirklich verlassen?</AlertDialogTitle>
            <AlertDialogDescription>
              {members.length === 1
                ? "Du bist das letzte Mitglied. Der Haushalt wird aufgelöst, wenn du verlässt."
                : "Bist du sicher, dass du diesen Haushalt verlassen möchtest? Du kannst später wieder beitreten, wenn du einen neuen Einladungscode erhältst."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={isLeaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird verlassen...
                </>
              ) : (
                "Haushalt verlassen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Admin Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin-Rolle übertragen</DialogTitle>
            <DialogDescription>
              Wähle ein Mitglied, das die Admin-Rolle übernehmen soll. Du wirst danach ein normales Mitglied.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Neuer Admin
            </label>
            <Select value={selectedNewAdmin || ""} onValueChange={setSelectedNewAdmin}>
              <SelectTrigger>
                <SelectValue placeholder="Wähle ein Mitglied" />
              </SelectTrigger>
              <SelectContent>
                {members
                  .filter((m) => m.userId !== user?.id)
                  .map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.profile.displayName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleTransferAdmin}
              disabled={isTransferring || !selectedNewAdmin}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird übertragen...
                </>
              ) : (
                "Admin übertragen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitglied entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du dieses Mitglied aus dem Haushalt entfernen mochtest? Diese Aktion kann nicht ruckgangig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird entfernt...
                </>
              ) : (
                "Mitglied entfernen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bonus Points Dialog */}
      <BonusPointsDialog
        open={showBonusDialog}
        onOpenChange={setShowBonusDialog}
      />
    </div>
  );
}
