import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateRewardSchema } from "@/lib/validations/rewards";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

// GET /api/rewards/[id] - Get reward details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    // Get user's household
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

    // Fetch reward
    const { data: reward, error: rewardError } = await supabase
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
      .eq("id", id)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json(
        { error: "Belohnung nicht gefunden" },
        { status: 404 }
      );
    }

    const typedReward = reward as unknown as RewardWithProfiles;

    // Check if reward belongs to user's household
    if (typedReward.household_id !== membership.household_id) {
      return NextResponse.json(
        { error: "Belohnung nicht gefunden" },
        { status: 404 }
      );
    }

    // Non-admins can only see published rewards
    if (membership.role !== "admin" && typedReward.status !== "published") {
      return NextResponse.json(
        { error: "Belohnung nicht gefunden" },
        { status: 404 }
      );
    }

    // Get user's point balance
    const { data: balance } = await supabase
      .from("point_balances")
      .select("current_balance")
      .eq("user_id", user.id)
      .maybeSingle();

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
            ? Math.max(0, typedReward.quantity_available - typedReward.quantity_claimed)
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
      userBalance: balance?.current_balance ?? 0,
      canAfford: (balance?.current_balance ?? 0) >= typedReward.point_cost,
    });
  } catch (error) {
    console.error("Error fetching reward:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// PATCH /api/rewards/[id] - Update reward (admin only)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
        { error: "Nur Administratoren koennen Belohnungen bearbeiten" },
        { status: 403 }
      );
    }

    // Check if reward exists and belongs to user's household
    const { data: existingReward, error: existingError } = await supabase
      .from("rewards")
      .select("id, status")
      .eq("id", id)
      .eq("household_id", membership.household_id)
      .single();

    if (existingError || !existingReward) {
      return NextResponse.json(
        { error: "Belohnung nicht gefunden" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateRewardSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message || "Ungueltige Eingabe",
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Build update object
    const updateFields: Record<string, unknown> = {};
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.description !== undefined)
      updateFields.description = updateData.description;
    if (updateData.imageUrl !== undefined)
      updateFields.image_url = updateData.imageUrl;
    if (updateData.pointCost !== undefined)
      updateFields.point_cost = updateData.pointCost;
    if (updateData.quantityAvailable !== undefined)
      updateFields.quantity_available = updateData.quantityAvailable;
    if (updateData.status !== undefined) updateFields.status = updateData.status;

    // Update reward
    const { data: reward, error: rewardError } = await supabase
      .from("rewards")
      .update(updateFields)
      .eq("id", id)
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
      console.error("Error updating reward:", rewardError);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren der Belohnung" },
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
    console.error("Error updating reward:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// DELETE /api/rewards/[id] - Delete reward (admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
        { error: "Nur Administratoren koennen Belohnungen loeschen" },
        { status: 403 }
      );
    }

    // Check if reward exists and belongs to user's household
    const { data: existingReward, error: existingError } = await supabase
      .from("rewards")
      .select("id, status")
      .eq("id", id)
      .eq("household_id", membership.household_id)
      .single();

    if (existingError || !existingReward) {
      return NextResponse.json(
        { error: "Belohnung nicht gefunden" },
        { status: 404 }
      );
    }

    // Check for pending redemptions
    const { count: pendingCount, error: countError } = await supabase
      .from("redemptions")
      .select("*", { count: "exact", head: true })
      .eq("reward_id", id)
      .eq("status", "pending");

    if (countError) {
      console.error("Error checking redemptions:", countError);
      return NextResponse.json(
        { error: "Fehler beim Pruefen der Einloesungen" },
        { status: 500 }
      );
    }

    if (pendingCount && pendingCount > 0) {
      return NextResponse.json(
        { error: "Belohnung kann nicht geloescht werden, da ausstehende Einloesungen vorhanden sind. Archiviere die Belohnung stattdessen." },
        { status: 400 }
      );
    }

    // Delete reward
    const { error: deleteError } = await supabase
      .from("rewards")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting reward:", deleteError);
      return NextResponse.json(
        { error: "Fehler beim Loeschen der Belohnung" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reward:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}