import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/server/supabase-admin";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game");
    const puzzleKey = searchParams.get("puzzleKey");
    const limit = Math.max(1, Math.min(25, Number(searchParams.get("limit") ?? 10)));

    if (!game || !["trivia", "painedle", "crossword", "connections"].includes(game)) {
        return NextResponse.json({ error: "Invalid game." }, { status: 400 });
    }

    const sb = getServiceClient();
    let query = sb
        .from("game_scores")
        .select("id, score, max_score, attempts, solved, created_at, puzzle_key, metadata, game_players!inner(username)")
        .eq("game", game)
        .order("score", { ascending: false })
        .order("attempts", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .limit(limit);

    if (puzzleKey !== null) {
        query = query.eq("puzzle_key", puzzleKey);
    }

    const { data, error } = await query;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entries: data ?? [] });
}
