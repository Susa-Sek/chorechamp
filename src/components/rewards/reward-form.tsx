"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, ImageIcon, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createRewardSchema, updateRewardSchema } from "@/lib/validations/rewards";
import { Reward, REWARD_STATUS_LABELS, RewardStatus } from "@/types/rewards";
import { CreateRewardInput, UpdateRewardInput } from "@/types/rewards";
import { cn } from "@/lib/utils";

interface RewardFormProps {
  reward?: Reward;
  onSubmit: (data: CreateRewardInput) => Promise<{ error: string | null }>;
  isEditing?: boolean;
}

export function RewardForm({ reward, onSubmit, isEditing = false }: RewardFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasQuantityLimit, setHasQuantityLimit] = useState(reward?.quantityAvailable !== null);
  const [previewUrl, setPreviewUrl] = useState(reward?.imageUrl || "");

  const form = useForm<CreateRewardInput>({
    resolver: zodResolver(createRewardSchema),
    defaultValues: {
      name: reward?.name || "",
      description: reward?.description || "",
      imageUrl: reward?.imageUrl || "",
      pointCost: reward?.pointCost || 100,
      quantityAvailable: reward?.quantityAvailable ?? undefined,
      status: reward?.status || "published",
    },
  });

  const watchImageUrl = form.watch("imageUrl");

  // Update preview when URL changes
  const handleImageUrlChange = (value: string) => {
    form.setValue("imageUrl", value);
    setPreviewUrl(value);
  };

  const handleSubmit = async (data: CreateRewardInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Clean up data
      const cleanedData = {
        ...data,
        description: data.description || undefined,
        imageUrl: data.imageUrl || undefined,
        quantityAvailable: hasQuantityLimit ? data.quantityAvailable : undefined,
      };

      const result = await onSubmit(cleanedData);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      router.push("/rewards");
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("Ein unerwarteter Fehler ist aufgetreten");
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Image Preview Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="aspect-video relative bg-muted rounded-lg overflow-hidden mb-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Vorschau"
                  className="w-full h-full object-cover"
                  onError={() => setPreviewUrl("")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Kein Bild</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="z.B. Kinoabend, Extra Taschengeld"
                  maxLength={100}
                  {...field}
                />
              </FormControl>
              <FormDescription>2-100 Zeichen</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Beschreibe die Belohnung..."
                  maxLength={500}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional, max. 500 Zeichen</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image URL */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bild-URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/image.jpg"
                  {...field}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                />
              </FormControl>
              <FormDescription>
                Optional - Fuege eine Bild-URL hinzu
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Point Cost */}
        <FormField
          control={form.control}
          name="pointCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punkte-Kosten *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormDescription>
                Wie viele Punkte kostet diese Belohnung? (1-10.000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantity Limit Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <FormLabel>Begrenzte Anzahl</FormLabel>
              <FormDescription>
                Aktiviere dies, wenn die Belohnung nur begrenzt verfuegbar ist
              </FormDescription>
            </div>
            <Switch
              checked={hasQuantityLimit}
              onCheckedChange={setHasQuantityLimit}
            />
          </div>

          {hasQuantityLimit && (
            <FormField
              control={form.control}
              name="quantityAvailable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verfuegbare Anzahl</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Wie oft kann diese Belohnung eingeloeset werden?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Status (Admin only, for editing) */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Status waehlen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(REWARD_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Entwuerfe sind nicht sichtbar fuer Mitglieder
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4" />
                {isEditing ? "Aenderungen speichern" : "Belohnung erstellen"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}