import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { BadgeDefinition } from "@/types/levels";

// GET /api/badges - List all badge definitions
export async function GET() {
  try {
    const supabase = await createClient();

    // Badge definitions are public, no auth required
    // But we still check auth to potentially personalize the response
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch all badge definitions
    const { data: badges, error: badgesError } = await supabase
      .from("badge_definitions")
      .select("*")
      .order("category", { ascending: true })
      .order("criteria->>value", { ascending: true });

    if (badgesError) {
      console.error("Error fetching badge definitions:", badgesError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Abzeichen" },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const formattedBadges: BadgeDefinition[] = (badges || []).map((b) => ({
      id: b.id as string,
      name: b.name as string,
      description: b.description as string,
      category: b.category as BadgeDefinition["category"],
      criteria: b.criteria as BadgeDefinition["criteria"],
      icon: b.icon as string,
      pointsReward: (b.points_reward as number) || 0,
      createdAt: b.created_at as string,
    }));

    // Group by category for convenience
    const badgesByCategory = formattedBadges.reduce(
      (acc, badge) => {
        if (!acc[badge.category]) {
          acc[badge.category] = [];
        }
        acc[badge.category].push(badge);
        return acc;
      },
      {} as Record<string, BadgeDefinition[]>
    );

    return NextResponse.json({
      badges: formattedBadges,
      badgesByCategory,
      total: formattedBadges.length,
    });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}