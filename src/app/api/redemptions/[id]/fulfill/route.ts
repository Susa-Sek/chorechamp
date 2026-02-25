import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { fulfillRedemptionSchema } from "@/lib/validations/reward";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/redemptions/[id]/fulfill - Mark redemption as fulfilled (admin only)
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
        { error: "Nur Administratoren koennen Einloesungen erfuellen" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = fulfillRedemptionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error:
            validationResult.error.issues[0]?.message || "Ungueltige Eingabe",
        },
        { status: 400 }
      );
    }

    const { notes } = validationResult.data;

    // Try RPC function first
    const { data: result, error: fulfillError } = await supabase.rpc(
      "fulfill_redemption",
      {
        p_redemption_id: id,
        p_admin_id: user.id,
        p_notes: notes || null,
      }
    );

    if (fulfillError) {
      console.error("Error calling fulfill_redemption RPC:", fulfillError);
      // Fallback to manual implementation
      return await fulfillRedemptionFallback(supabase, id, user.id, membership.household_id, notes);
    }

    const parsedResult = result as { success: boolean; message?: string; error?: string };

    if (!parsedResult.success) {
      const statusCode = parsedResult.error?.includes("nicht gefunden")
        ? 404
        : parsedResult.error?.includes("Nur Administratoren")
        ? 403
        : 500;
      return NextResponse.json(
        { error: parsedResult.error || "Fehler beim Erfuellen der Einloesung" },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: parsedResult.message || "Einloesung erfolgreich erfuellt",
    });
  } catch (error) {
    console.error("Error fulfilling redemption:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

// Fallback implementation if RPC doesn't exist
async function fulfillRedemptionFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  redemptionId: string,
  adminId: string,
  householdId: string,
  notes?: string | null
) {
  // Check if redemption exists and belongs to household
  const { data: redemption, error: redemptionError } = await supabase
    .from("redemptions")
    .select("id, status, household_id")
    .eq("id", redemptionId)
    .single();

  if (redemptionError || !redemption) {
    return NextResponse.json(
      { error: "Einloesung nicht gefunden" },
      { status: 404 }
    );
  }

  // Verify redemption belongs to same household
  if (redemption.household_id !== householdId) {
    return NextResponse.json(
      { error: "Einloesung nicht gefunden" },
      { status: 404 }
    );
  }

  // Check redemption is pending
  if (redemption.status !== "pending") {
    return NextResponse.json(
      { error: "Einloesung ist nicht ausstehend" },
      { status: 400 }
    );
  }

  // Update redemption
  const { error: updateError } = await supabase
    .from("redemptions")
    .update({
      status: "fulfilled",
      fulfilled_at: new Date().toISOString(),
      fulfilled_by: adminId,
      fulfillment_notes: notes || null,
    })
    .eq("id", redemptionId);

  if (updateError) {
    console.error("Error updating redemption:", updateError);
    return NextResponse.json(
      { error: "Fehler beim Erfuellen der Einloesung" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Einloesung erfolgreich erfuellt",
  });
}