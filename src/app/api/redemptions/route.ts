import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { redemptionListQuerySchema } from "@/lib/validations/rewards";

// Type for redemption data with joins
interface RedemptionWithDetails {
  id: string;
  reward_id: string;
  user_id: string;
  household_id: string;
  points_spent: number;
  status: string;
  fulfilled_at: string | null;
  fulfilled_by: string | null;
  fulfillment_notes: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  reward: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    point_cost: number;
  };
  fulfiller: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

// GET /api/redemptions - Get my redemptions
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

    // Parse query parameters
    const queryParams = {
      status: searchParams.get("status") || "all",
      limit: parseInt(searchParams.get("limit") || "20", 10),
      offset: parseInt(searchParams.get("offset") || "0", 10),
    };

    const validationResult = redemptionListQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || "Ungueltige Parameter" },
        { status: 400 }
      );
    }

    const { status, limit, offset } = validationResult.data;

    // Build query
    let query = supabase
      .from("redemptions")
      .select(
        `
        id,
        reward_id,
        user_id,
        household_id,
        points_spent,
        status,
        fulfilled_at,
        fulfilled_by,
        fulfillment_notes,
        created_at,
        user:profiles!redemptions_user_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        reward:rewards (
          id,
          name,
          description,
          image_url,
          point_cost
        ),
        fulfiller:profiles!redemptions_fulfilled_by_fkey (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Filter by status
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: redemptions, error: redemptionsError } = await query;

    if (redemptionsError) {
      console.error("Error fetching redemptions:", redemptionsError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Einloesungen" },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = supabase
      .from("redemptions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (status !== "all") {
      countQuery = countQuery.eq("status", status);
    }

    const { count: totalCount } = await countQuery;

    // Transform to camelCase
    const transformedRedemptions = (redemptions as unknown as RedemptionWithDetails[]).map(
      (redemption) => ({
        id: redemption.id,
        rewardId: redemption.reward_id,
        userId: redemption.user_id,
        householdId: redemption.household_id,
        pointsSpent: redemption.points_spent,
        status: redemption.status,
        fulfilledAt: redemption.fulfilled_at,
        fulfilledBy: redemption.fulfilled_by,
        fulfillmentNotes: redemption.fulfillment_notes,
        createdAt: redemption.created_at,
        user: redemption.user
          ? {
              id: redemption.user.id,
              displayName: redemption.user.display_name,
              avatarUrl: redemption.user.avatar_url,
            }
          : null,
        reward: redemption.reward
          ? {
              id: redemption.reward.id,
              name: redemption.reward.name,
              description: redemption.reward.description,
              imageUrl: redemption.reward.image_url,
              pointCost: redemption.reward.point_cost,
            }
          : null,
        fulfiller: redemption.fulfiller
          ? {
              id: redemption.fulfiller.id,
              displayName: redemption.fulfiller.display_name,
              avatarUrl: redemption.fulfiller.avatar_url,
            }
          : null,
      })
    );

    return NextResponse.json({
      redemptions: transformedRedemptions,
      total: totalCount || 0,
      hasMore: (totalCount || 0) > offset + limit,
    });
  } catch (error) {
    console.error("Error fetching redemptions:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}