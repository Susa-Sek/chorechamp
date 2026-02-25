import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { UserProfile, BadgeDefinition, getLevelFromPoints } from "@/types/levels";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/profile/[id] - Get user profile with level and badges
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id: profileUserId } = await params;

    // Validate profile user ID
    if (!profileUserId) {
      return NextResponse.json(
        { error: "Benutzer-ID erforderlich" },
        { status: 400 }
      );
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    // Get viewer's household
    const { data: viewerMembership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .single();

    // Get profile user's household
    const { data: profileMembership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", profileUserId)
      .single();

    // Check if viewer can access this profile (same household or viewing own profile)
    const isOwnProfile = user.id === profileUserId;
    const isSameHousehold =
      viewerMembership?.household_id === profileMembership?.household_id;

    if (!isOwnProfile && !isSameHousehold) {
      return NextResponse.json(
        { error: "Zugriff verweigert" },
        { status: 403 }
      );
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at")
      .eq("id", profileUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil nicht gefunden" },
        { status: 404 }
      );
    }

    // Fetch total points
    const { data: balance } = await supabase
      .from("point_balances")
      .select("total_earned")
      .eq("user_id", profileUserId)
      .maybeSingle();

    const totalPoints = balance?.total_earned || 0;

    // Fetch chores completed count
    const { count: choresCompleted } = await supabase
      .from("chore_completions")
      .select("*", { count: "exact", head: true })
      .eq("completed_by", profileUserId)
      .is("undone_at", null);

    // Fetch earned badges with badge definitions
    const { data: badgesData, error: badgesError } = await supabase
      .from("user_badges")
      .select("id, user_id, badge_id, earned_at, badge:badge_definitions(id, name, description, category, icon, points_reward)")
      .eq("user_id", profileUserId)
      .order("earned_at", { ascending: false });

    if (badgesError) {
      console.error("Error fetching badges:", badgesError);
      // Continue without badges
    }

    // Transform badges
    const badges = (badgesData || []).map((b) => {
      const badgeData = b.badge as unknown as Record<string, unknown> | Record<string, unknown>[] | null;
      // Handle both array and object cases from Supabase join
      const badgeObj = Array.isArray(badgeData) ? badgeData[0] : badgeData;
      return {
        id: b.id as string,
        userId: b.user_id as string,
        badgeId: b.badge_id as string,
        earnedAt: b.earned_at as string,
        badge: badgeObj ? {
          id: badgeObj.id as string,
          name: badgeObj.name as string,
          description: badgeObj.description as string,
          category: badgeObj.category as BadgeDefinition["category"],
          criteria: badgeObj.criteria as BadgeDefinition["criteria"],
          icon: badgeObj.icon as string,
          pointsReward: (badgeObj.points_reward as number) || 0,
          createdAt: badgeObj.created_at as string,
        } : undefined,
      };
    });

    // Get level from points
    const levelDef = getLevelFromPoints(totalPoints);

    // Build response
    const userProfile: UserProfile = {
      userId: profile.id as string,
      displayName: profile.display_name as string,
      avatarUrl: profile.avatar_url as string | null,
      currentLevel: levelDef.level,
      totalPoints: totalPoints,
      totalChoresCompleted: choresCompleted || 0,
      memberSince: profile.created_at as string,
      badges: badges,
    };

    return NextResponse.json({
      profile: userProfile,
      levelTitle: levelDef.title,
      isOwnProfile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}