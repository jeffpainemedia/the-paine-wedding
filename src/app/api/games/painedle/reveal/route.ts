import { NextRequest, NextResponse } from "next/server";
import { MAX_GUESSES, WORD_LENGTH } from "@/lib/games/painedle";
import { getDailyWord } from "@/lib/games/painedle-server";

// POST /api/games/painedle/reveal
// Returns today's word, but only after the player has reached game-over
// (correct guess in their history OR exhausted their MAX_GUESSES turns).
// This makes the trivial "fetch today's word" exploit harder — an attacker
// has to either guess correctly or submit MAX_GUESSES wrong words first.
export async function POST(request: NextRequest) {
    let body: { dateKey?: unknown; guesses?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const dateKey = typeof body.dateKey === "string" ? body.dateKey : null;
    const guesses = Array.isArray(body.guesses) && body.guesses.every((g) => typeof g === "string" && g.length === WORD_LENGTH)
        ? (body.guesses as string[]).map((g) => g.toLowerCase())
        : null;

    if (!dateKey || !guesses) {
        return NextResponse.json({ error: "dateKey and guesses required." }, { status: 400 });
    }

    const solution = getDailyWord(dateKey);
    const won = guesses.some((g) => g === solution);
    const lost = guesses.length >= MAX_GUESSES;

    if (!won && !lost) {
        return NextResponse.json({ error: "Game not yet over." }, { status: 403 });
    }

    return NextResponse.json({ solution }, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
    });
}
