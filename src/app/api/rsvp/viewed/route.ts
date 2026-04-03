import { NextRequest } from "next/server";
import { verifyRSVPAccessToken } from "@/lib/rsvp/access-token";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";

export async function POST(req: NextRequest) {
    const rateLimitResponse = await enforceRateLimit(req, {
        bucket: "rsvp-viewed",
        limit: 24,
        windowSeconds: 60 * 10,
        message: "Too many RSVP activity requests. Please try again in a bit.",
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = (await req.json()) as { accessToken?: unknown };
    const verified = verifyRSVPAccessToken(typeof body.accessToken === "string" ? body.accessToken : undefined);

    if (!verified) {
        return noStoreJson({ error: "Invalid RSVP session." }, { status: 401 });
    }

    const sb = getServiceClient();
    const { data: matchedGuest, error: matchedGuestError } = await sb
        .from("guests")
        .select("id, household_id, is_plus_one")
        .eq("id", verified.guestId)
        .single();

    if (matchedGuestError || !matchedGuest || matchedGuest.household_id !== verified.householdId || matchedGuest.is_plus_one) {
        return noStoreJson({ error: "Invitation not found." }, { status: 404 });
    }

    const { data: householdGuests, error: householdGuestsError } = await sb
        .from("guests")
        .select("id, viewed_rsvp")
        .eq("household_id", verified.householdId);

    if (householdGuestsError) {
        return noStoreJson({ error: householdGuestsError.message }, { status: 500 });
    }

    const hadUnviewedGuests = (householdGuests ?? []).some((guest) => !guest.viewed_rsvp);

    const { error: updateError } = await sb
        .from("guests")
        .update({ viewed_rsvp: true })
        .eq("household_id", verified.householdId);

    if (updateError) {
        return noStoreJson({ error: updateError.message }, { status: 500 });
    }

    // Return fresh updated_at values so the client can update its version map
    // and avoid false positive conflict detection on submit.
    const { data: refreshedGuests } = await sb
        .from("guests")
        .select("id, updated_at")
        .eq("household_id", verified.householdId);

    const versions: Record<string, string> = {};
    for (const g of (refreshedGuests ?? [])) {
        if (g.updated_at) versions[g.id as string] = g.updated_at as string;
    }

    if (hadUnviewedGuests) {
        const { error: historyError } = await sb.from("rsvp_history").insert({
            guest_id: verified.guestId,
            household_id: verified.householdId,
            event_type: "viewed",
            actor_guest_id: verified.guestId,
        });

        if (historyError) {
            return noStoreJson({ error: historyError.message }, { status: 500 });
        }
    }

    return noStoreJson({ ok: true, versions });
}
