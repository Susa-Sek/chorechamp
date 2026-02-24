"use client";

import { useState } from "react";
import { Gift, Loader2, Sparkles } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHousehold } from "@/components/household/household-provider";
import { usePoints } from "./points-provider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BonusPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BonusPointsDialog({
  open,
  onOpenChange,
  onSuccess,
}: BonusPointsDialogProps) {
  const { members } = useHousehold();
  const { awardBonusPoints } = usePoints();
  const { toast } = useToast();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [points, setPoints] = useState<string>("10");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const selectedMember = members.find((m) => m.userId === selectedUserId);

  const pointValue = parseInt(points, 10);
  const isValidPoints = !isNaN(pointValue) && pointValue >= 1 && pointValue <= 100;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !isValidPoints) {
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmAward = async () => {
    if (!selectedUserId || !isValidPoints) return;

    setIsSubmitting(true);

    const result = await awardBonusPoints({
      userId: selectedUserId,
      points: pointValue,
      reason: reason.trim() || undefined,
    });

    setIsSubmitting(false);
    setShowConfirmDialog(false);

    if (result.error) {
      toast({
        title: "Fehler",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bonuspunkte vergeben",
        description: `${pointValue} Punkte wurden an ${selectedMember?.profile.displayName} vergeben.`,
      });

      // Reset form
      setSelectedUserId("");
      setPoints("10");
      setReason("");
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const quickPointValues = [5, 10, 20, 25, 50, 100];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Bonuspunkte vergeben
            </DialogTitle>
            <DialogDescription>
              Vergib zusatzliche Punkte an ein Haushaltsmitglied als Belohnung.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Member Selection */}
            <div className="space-y-2">
              <Label htmlFor="member">Mitglied auswahlen</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="member">
                  <SelectValue placeholder="Wahle ein Mitglied" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.profile.avatarUrl || undefined} />
                          <AvatarFallback
                            className={cn(
                              "text-[10px] text-white bg-gradient-to-br",
                              getAvatarColor(member.profile.displayName)
                            )}
                          >
                            {getInitials(member.profile.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.profile.displayName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Points Input */}
            <div className="space-y-2">
              <Label htmlFor="points">Punkte (1-100)</Label>
              <Input
                id="points"
                type="number"
                min={1}
                max={100}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className={!isValidPoints && points ? "border-destructive" : ""}
              />
              {!isValidPoints && points && (
                <p className="text-xs text-destructive">
                  Bitte eine Zahl zwischen 1 und 100 eingeben
                </p>
              )}

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-2 mt-2">
                {quickPointValues.map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={pointValue === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPoints(value.toString())}
                    className="min-w-[3rem]"
                  >
                    +{value}
                  </Button>
                ))}
              </div>
            </div>

            {/* Reason (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="reason">Grund (optional)</Label>
              <Textarea
                id="reason"
                placeholder="z.B. fur besondere Hilfe beim Putzen"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Preview */}
            {selectedMember && isValidPoints && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground mb-2">Vorschau:</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selectedMember.profile.avatarUrl || undefined} />
                      <AvatarFallback
                        className={cn(
                          "text-xs text-white bg-gradient-to-br",
                          getAvatarColor(selectedMember.profile.displayName)
                        )}
                      >
                        {getInitials(selectedMember.profile.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {selectedMember.profile.displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 font-bold">
                    <Sparkles className="w-4 h-4" />
                    +{pointValue}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={!selectedUserId || !isValidPoints}
              >
                <Gift className="w-4 h-4 mr-2" />
                Punkte vergeben
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Bonuspunkte bestatigen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Mogechtest du{" "}
              <span className="font-semibold text-foreground">
                {pointValue} Punkte
              </span>{" "}
              an{" "}
              <span className="font-semibold text-foreground">
                {selectedMember?.profile.displayName}
              </span>{" "}
              vergeben?
              {reason && (
                <span className="block mt-2 text-sm">
                  Grund: &quot;{reason}&quot;
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAward}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird vergeben...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Bestatigen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}