import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface TransactionWithProfile {
  id: string;
  user_id: string;
  household_id: string;
  points: number;
  transaction_type: string;
  reference_id: string | null;
  description: string | null;
  balance_after: number;
  created_by: string | null;
  created_at: string;
  profiles: ProfileData | null;
}

// Transform transaction to camelCase
function transformTransaction(tx: TransactionWithProfile) {
  return {
    id: tx.id,
    userId: tx.user_id,
    householdId: tx.household_id,
    points: tx.points,
    transactionType: tx.transaction_type,
    referenceId: tx.reference_id,
    description: tx.description,
    balanceAfter: tx.balance_after,
    createdBy: tx.created_by,
    createdAt: tx.created_at,
    user: tx.profiles
      ? {
          id: tx.profiles.id,
          displayName: tx.profiles.display_name,
          avatarUrl: tx.profiles.avatar_url,
        }
      : null,
  };
}

// GET /api/points/history - Get transaction history with pagination
export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, earned, spent
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("point_transactions")
      .select(
        `
        id,
        user_id,
        household_id,
        points,
        transaction_type,
        reference_id,
        description,
        balance_after,
        created_by,
        created_at,
        profiles!point_transactions_user_id_fkey (
          id,
          display_name,
          avatar_url
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply filter
    if (filter === "earned") {
      query = query.gt("points", 0);
    } else if (filter === "spent") {
      query = query.lt("points", 0);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error: txError, count } = await query;

    if (txError) {
      console.error("Error fetching transactions:", txError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Transaktionen" },
        { status: 500 }
      );
    }

    // Transform data
    const transformedTransactions = (transactions || []).map((tx) =>
      transformTransaction(tx as unknown as TransactionWithProfile)
    );

    return NextResponse.json({
      transactions: transformedTransactions,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching point history:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}