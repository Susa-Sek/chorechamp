import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRewardSchema, rewardListQuerySchema } from "@/lib/validations/reward";

// Type for reward data with joins
interface RewardWithProfiles {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  point_cost: number;
  quantity_available: number | null;
  quantity_claimed: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

// GET /api/rewards - List available rewards
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    // Get user's household membership with role
    const { data: membership, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Kein Haushalt gefunden" },
        { status: 400 }
      );
    }

    // Parse query parameters
    const queryParams = {
      status: searchParams.get("status") || "published",
      affordable: searchParams.get("affordable") === "true",
      sortBy: searchParams.get("sortBy") || "newest",
    };

    const validationResult = rewardListQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || "Ungueltige Parameter" },
        { status: 400 }
      );
    }

    const { status, affordable, sortBy } = validationResult.data;

    // Build query
    let query = supabase
      .from("rewards")
      .select(
        `
        id,
        household_id,
        name,
        description,
        image_url,
        point_cost,
        quantity_available,
        quantity_claimed,
        status,
        created_by,
        created_at,
        updated_at,
        creator:profiles!rewards_created_by_fkey (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("household_id", membership.household_id);

    // Filter by status (admins can see all, members only published)
    if (membership.role !== "admin" || status !== "all") {
      if (status === "draft" && membership.role === "admin") {
        query = query.eq("status", "draft");
      } else if (status === "archived" && membership.role === "admin") {
        query = query.eq("status", "archived");
      } else {
        query = query.eq("status", "published");
      }
    }

    // Get user's point balance for affordable filter
    let userBalance: number | null = null;
    if (affordable) {
      const { data: balance } = await supabase
        .from("point_balances")
        .select("current_balance")
        .eq("user_id", user.id)
        .maybeSingle();

      userBalance = balance?.current_balance ?? 0;
    }

    // Apply sorting
    switch (sortBy) {
      case "point_cost":
        query = query.order("point_cost", { ascending: true });
        break;
      case "name":
        query = query.order("name", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data: rewards, error: rewardsError } = await query;

    if (rewardsError) {
      console.error("Error fetching rewards:", rewardsError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Belohnungen" },
        { status: 500 }
      );
    }

    // Filter by affordable if requested
    let filteredRewards = rewards as unknown as RewardWithProfiles[];
    if (affordable && userBalance !== null) {
      filteredRewards = filteredRewards.filter(
        (r) => r.point_cost <= userBalance!
      );
    }

    // Transform to camelCase and add remaining quantity
    const transformedRewards = filteredRewards.map((reward) => ({
      id: reward.id,
      householdId: reward.household_id,
      name: reward.name,
      description: reward.description,
      imageUrl: reward.image_url,
      pointCost: reward.point_cost,
      quantityAvailable: reward.quantity_available,
      quantityClaimed: reward.quantity_claimed,
      quantityRemaining:
        reward.quantity_available !== null
          ? Math.max(0, reward.quantity_available - reward.quantity_claimed)
          : null,
      status: reward.status,
      createdBy: reward.created_by,
      createdAt: reward.created_at,
      updatedAt: reward.updated_at,
      creator: reward.creator
        ? {
            id: reward.creator.id,
            displayName: reward.creator.display_name,
            avatarUrl: reward.creator.avatar_url,
          }
        : null,
    }));

    return NextResponse.json({
      rewards: transformedRewards,
      userBalance: affordable
        ? userBalance
        : undefined,
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// POST /api/rewards - Create reward (admin only)
export async function POST(request: Request) {
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

    // Get user's household membership with role
    const { data: membership, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Kein Haushalt gefunden" },
        { status: 400 }
      );
    }

    // Check if user is admin
    if (membership.role !== "admin") {
      return NextResponse.json(
        { error: "Nur Administratoren koennen Belohnungen erstellen" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createRewardSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message || "Ungueltige Eingabe",
        },
        { status: 400 }
      );
    }

    const { name, description, imageUrl, pointCost, quantityAvailable, status } =
      validationResult.data;

    // Create reward
    const { data: reward, error: rewardError } = await supabase
      .from("rewards")
      .insert({
        household_id: membership.household_id,
        name,
        description: description || null,
        image_url: imageUrl || null,
        point_cost: pointCost,
        quantity_available: quantityAvailable || null,
        quantity_claimed: 0,
        status: status || "published",
        created_by: user.id,
      })
      .select(
        `
        id,
        household_id,
        name,
        description,
        image_url,
        point_cost,
        quantity_available,
        quantity_claimed,
        status,
        created_by,
        created_at,
        updated_at,
        creator:profiles!rewards_created_by_fkey (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (rewardError) {
      console.error("Error creating reward:", rewardError);
      return NextResponse.json(
        { error: "Fehler beim Erstellen der Belohnung" },
        { status: 500 }
      );
    }

    const typedReward = reward as unknown as RewardWithProfiles;

    return NextResponse.json({
      reward: {
        id: typedReward.id,
        householdId: typedReward.household_id,
        name: typedReward.name,
        description: typedReward.description,
        imageUrl: typedReward.image_url,
        pointCost: typedReward.point_cost,
        quantityAvailable: typedReward.quantity_available,
        quantityClaimed: typedReward.quantity_claimed,
        quantityRemaining:
          typedReward.quantity_available !== null
            ? typedReward.quantity_available - typedReward.quantity_claimed
            : null,
        status: typedReward.status,
        createdBy: typedReward.created_by,
        createdAt: typedReward.created_at,
        updatedAt: typedReward.updated_at,
        creator: typedReward.creator
          ? {
              id: typedReward.creator.id,
              displayName: typedReward.creator.display_name,
              avatarUrl: typedReward.creator.avatar_url,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error creating reward:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}