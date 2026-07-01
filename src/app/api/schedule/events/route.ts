import { NextRequest } from "next/server";
import { noStoreJson } from "@/lib/server/request-security";
import { verifyScheduleToken, SCHEDULE_AUTH_COOKIE } from "@/lib/schedule/auth";
import { getAllEvents, getEventsForTier, getPublicTier } from "@/lib/schedule/queries";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";

// GET /api/schedule/events — returns tier-filtered events for client caching.
//
// Priority:
//   1. schedule_user signed in → their tier's events
//   2. admin (no schedule sign-in) → every event across every tier
//   3. anonymous → public events
//
// Mirrors the server-render logic in src/app/(main)/schedule/page.tsx so the
// client's refetch doesn't overwrite the admin/all-tiers view with the
// public-only list.
export async function GET(request: NextRequest) {
    const token = request.cookies.get(SCHEDULE_AUTH_COOKIE)?.value;
    const authUser = verifyScheduleToken(token);

    // Admin without a schedule sign-in sees every event.
    if (!authUser) {
        const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
        if (verifyAdminSessionToken(adminToken)) {
            const events = await getAllEvents();
            return noStoreJson({ events, tierSlug: "admin" });
        }
    }

    let tierId: string = "";

    if (authUser) {
        // Look up the tier_id from the slug in the token
        const sb = getServiceClient();
        const { data: tier } = await sb
            .from("schedule_tiers")
            .select("id")
            .eq("slug", authUser.tierSlug)
            .maybeSingle();
        tierId = tier?.id ?? "";
    }

    if (!tierId) {
        const publicTier = await getPublicTier();
        if (!publicTier) return noStoreJson({ events: [] });
        tierId = publicTier.id;
    }

    const events = await getEventsForTier(tierId);
    return noStoreJson({ events, tierSlug: authUser?.tierSlug ?? "public" });
}
