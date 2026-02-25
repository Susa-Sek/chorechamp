import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { LEVEL_DEFINITIONS, getLevelFromPoints, getNextLevel, calculateLevelProgress } from "@/types/levels";

// GET /api/levels/me - Get current user's level info
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

    // Get total points from point_balances
    const { data: balance, error: balanceError } = await supabase
      .from("point_balances")
      .select("total_earned")
      .eq("user_id", user.id)
      .maybeSingle();

    if (balanceError) {
      console.error("Error fetching balance:", balanceError);
      return NextResponse.json(
        { error: "Fehler beim Laden des Punktestands" },
        { status: 500 }
      );
    }

    const totalPoints = balance?.total_earned || 0;
    const currentLevelDef = getLevelFromPoints(totalPoints);
    const nextLevelDef = getNextLevel(currentLevelDef.level);

    // Calculate progress to next level
    let progressPercentage = 100;
    let pointsToNextLevel = 0;

    if (nextLevelDef) {
      progressPercentage = calculateLevelProgress(
        totalPoints,
        currentLevelDef.pointsRequired,
        nextLevelDef.pointsRequired
      );
      pointsToNextLevel = nextLevelDef.pointsRequired - totalPoints;
    }

    // Get or create user level record
    const { data: userLevel, error: levelError } = await supabase
      .from("user_levels")
      .upsert(
        {
          user_id: user.id,
          current_level: currentLevelDef.level,
          total_points: totalPoints,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (levelError) {
      console.error("Error upserting user level:", levelError);
      // Continue without the level record
    }

    const response = {
      level: {
        id: userLevel?.id || null,
        userId: user.id,
        currentLevel: currentLevelDef.level,
        levelTitle: currentLevelDef.title,
        totalPoints: totalPoints,
        updatedAt: userLevel?.updated_at || new Date().toISOString(),
      },
      progress: {
        currentPoints: totalPoints,
        currentLevelPoints: currentLevelDef.pointsRequired,
        nextLevelPoints: nextLevelDef?.pointsRequired || null,
        pointsToNextLevel: nextLevelDef ? pointsToNextLevel : 0,
        progressPercentage,
        isMaxLevel: !nextLevelDef,
      },
      levelDefinitions: LEVEL_DEFINITIONS,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching level:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}