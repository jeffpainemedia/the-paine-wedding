import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { noStoreJson } from "@/lib/server/request-security";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game");
    const puzzleKey = searchParams.get("puzzleKey") ?? "";
    const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
    const username = searchParams.get("username")?.trim() ?? "";

    if (!game || !["trivia", "painedle", "crossword"].includes(game)) {
        return noStoreJson({ error: "Invalid game." }, { status: 400 });
    }

    if (!email || !username) {
        return noStoreJson({ error: "Missing player lookup." }, { status: 400 });
    }

    const sb = getServiceClient();
    const { data: player, error: playerError } = await sb
        .from("game_players")
        .select("id, username")
        .eq("email", email)
        .maybeSingle();

    if (playerError) {
        return noStoreJson({ error: playerError.message }, { status: 500 });
    }

    if (!player || player.username.trim().toLowerCase() !== username.toLowerCase()) {
        return noStoreJson({ entry: null }, { status: 200 });
    }

    const { data: entry, error: scoreError } = await sb
        .from("game_scores")
        .select("id, score, max_score, attempts, solved, created_at, puzzle_key, metadata")
        .eq("player_id", player.id)
        .eq("game", game)
        .eq("puzzle_key", puzzleKey)
        .maybeSingle();

    if (scoreError) {
        return noStoreJson({ error: scoreError.message }, { status: 500 });
    }

    return noStoreJson({ entry: entry ?? null }, { status: 200 });
}
