import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";

export async function GET(request: NextRequest) {
    const rateLimitResponse = await enforceRateLimit(request, {
        bucket: "game-player-profile",
        limit: 20,
        windowSeconds: 60 * 10,
        message: "Too many profile lookups. Please wait a moment and try again.",
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

    if (!email) {
        return noStoreJson({ error: "Email is required." }, { status: 400 });
    }

    const sb = getServiceClient();
    const { data, error } = await sb
        .from("game_players")
        .select("email, username")
        .eq("email", email)
        .maybeSingle();

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ profile: data ?? null }, { status: 200 });
}
