import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getCrosswordPuzzleById, parseCrosswordOverrides } from "@/lib/games/crossword";

const CROSSWORD_OVERRIDES_KEY = "games.crossword.overrides";

async function loadOverrides() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return {};
    try {
        const sb = createClient(url, key);
        const { data } = await sb
            .from("site_settings")
            .select("value")
            .eq("key", CROSSWORD_OVERRIDES_KEY)
            .maybeSingle();
        return parseCrosswordOverrides(data?.value);
    } catch {
        return {};
    }
}

// POST /api/games/crossword/check
// Validates the player's grid against the puzzle's answer key. Returns the
// list of incorrect cells and whether all fillable cells match. The answer
// key is never returned — only correctness flags.
export async function POST(request: NextRequest) {
    let body: { puzzleId?: unknown; letters?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const puzzleId = typeof body.puzzleId === "string" ? body.puzzleId : null;
    const letters = body.letters && typeof body.letters === "object" && !Array.isArray(body.letters)
        ? body.letters as Record<string, string>
        : null;

    if (!puzzleId || !letters) {
        return NextResponse.json({ error: "puzzleId and letters required." }, { status: 400 });
    }

    // Apply admin overrides — keeps results consistent with whatever the
    // player is actually looking at.
    void cookies(); // touch cookies API to avoid being statically optimised
    const overrides = await loadOverrides();
    const puzzle = getCrosswordPuzzleById(puzzleId, overrides);
    if (!puzzle) {
        return NextResponse.json({ error: "Puzzle not found." }, { status: 404 });
    }

    const wrongCells: string[] = [];
    let allFilled = true;

    for (const cell of puzzle.cells) {
        if (!cell.answer) continue;
        const guessed = (letters[cell.key] ?? "").trim().toUpperCase();
        if (!guessed) {
            allFilled = false;
            continue;
        }
        if (guessed !== cell.answer) {
            wrongCells.push(cell.key);
        }
    }

    return NextResponse.json({
        wrongCells,
        allCorrect: allFilled && wrongCells.length === 0,
    }, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
    });
}
