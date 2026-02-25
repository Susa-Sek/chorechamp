import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { BadgeDefinition, UserBadge, BadgeProgress } from "@/types/levels";

// GET /api/badges/me - Get current user's earned badges and progress
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    // Get user's household membership
    const { data: membership, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Kein Haushalt gefunden" },
        { status: 400 }
      );
    }

    // Fetch all badge definitions
    const { data: badgeDefinitions, error: badgesError } = await supabase
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

    // Fetch user's earned badges
    const { data: earnedData, error: earnedError } = await supabase
      .from("user_badges")
      .select("*, badge:badge_definitions(*)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    if (earnedError) {
      console.error("Error fetching earned badges:", earnedError);
      return NextResponse.json(
        { error: "Fehler beim Laden der verdienten Abzeichen" },
        { status: 500 }
      );
    }

    // Fetch badge progress
    const { data: progressData, error: progressError } = await supabase
      .from("badge_progress")
      .select("*, badge:badge_definitions(*)")
      .eq("user_id", user.id);

    if (progressError) {
      console.error("Error fetching badge progress:", progressError);
      // Don't fail the request, just log the error
    }

    // Transform badge definitions
    const formattedBadges: BadgeDefinition[] = (badgeDefinitions || []).map(
      (b) => ({
        id: b.id as string,
        name: b.name as string,
        description: b.description as string,
        category: b.category as BadgeDefinition["category"],
        criteria: b.criteria as BadgeDefinition["criteria"],
        icon: b.icon as string,
        pointsReward: (b.points_reward as number) || 0,
        createdAt: b.created_at as string,
      })
    );

    // Transform earned badges
    const formattedEarned: UserBadge[] = (earnedData || []).map((e) => ({
      id: e.id as string,
      userId: e.user_id as string,
      badgeId: e.badge_id as string,
      earnedAt: e.earned_at as string,
      badge: e.badge as BadgeDefinition | undefined,
    }));

    // Transform badge progress
    const formattedProgress: BadgeProgress[] = (progressData || []).map(
      (p) => ({
        id: p.id as string,
        userId: p.user_id as string,
        badgeId: p.badge_id as string,
        currentValue: p.current_value as number,
        updatedAt: p.updated_at as string,
        badge: p.badge as BadgeDefinition | undefined,
      })
    );

    // Create earned badge ID set for quick lookup
    const earnedBadgeIds = new Set(formattedEarned.map((e) => e.badgeId));

    // Create progress map for quick lookup
    const progressMap = new Map(
      formattedProgress.map((p) => [p.badgeId, p.currentValue])
    );

    // Enhance badges with status
    const enhancedBadges = formattedBadges.map((badge) => {
      const isEarned = earnedBadgeIds.has(badge.id);
      const currentValue = progressMap.get(badge.id) || 0;
      const targetValue = badge.criteria.value;

      let status: "earned" | "in_progress" | "locked";
      let progress = 0;

      if (isEarned) {
        status = "earned";
        progress = 100;
      } else if (currentValue > 0) {
        status = "in_progress";
        progress = Math.min(Math.round((currentValue / targetValue) * 100), 99);
      } else {
        status = "locked";
        progress = 0;
      }

      return {
        ...badge,
        status,
        progress,
        currentValue,
        targetValue,
      };
    });

    // Calculate stats
    const stats = {
      total: formattedBadges.length,
      earned: formattedEarned.length,
      inProgress: enhancedBadges.filter((b) => b.status === "in_progress").length,
      locked: enhancedBadges.filter((b) => b.status === "locked").length,
      totalPointsFromBadges: formattedEarned.reduce(
        (sum, b) => sum + (b.badge?.pointsReward || 0),
        0
      ),
    };

    return NextResponse.json({
      badges: enhancedBadges,
      earnedBadges: formattedEarned,
      badgeProgress: formattedProgress,
      stats,
    });
  } catch (error) {
    console.error("Error fetching user badges:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}