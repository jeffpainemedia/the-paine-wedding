import { NextRequest } from "next/server";
import { verifyRSVPAccessToken } from "@/lib/rsvp/access-token";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";

export async function GET(request: NextRequest) {
    const rateLimitResponse = await enforceRateLimit(request, {
        bucket: "rsvp-household",
        limit: 24,
        windowSeconds: 60 * 10,
        message: "Too many RSVP requests. Please wait a moment and try again.",
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("token") ?? undefined;
    const verified = verifyRSVPAccessToken(accessToken);

    if (!verified) {
        return noStoreJson({ error: "Your RSVP session has expired. Please search for your invitation again." }, { status: 401 });
    }

    const sb = getServiceClient();
    const [{ data: household, error: householdError }, { data: guests, error: guestError }] = await Promise.all([
        sb.from("households").select("*").eq("id", verified.householdId).single(),
        sb.from("guests").select("*").eq("household_id", verified.householdId),
    ]);

    if (householdError || guestError || !household || !guests) {
        return noStoreJson({ error: "Not found" }, { status: 404 });
    }

    const matchedGuest = guests.find((guest) => guest.id === verified.guestId && !guest.is_plus_one);
    if (!matchedGuest) {
        return noStoreJson(
            { error: "Your invitation changed since your last visit. Please search for your invitation again." },
            { status: 409 },
        );
    }

    return noStoreJson({ household: { ...household, guests } });
}
