import { NextRequest, NextResponse } from "next/server";
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

// POST /api/games/crossword/reveal-entry
// Returns the letters of a single entry — used by the in-game "Reveal" button.
// The caller has to specify a single entryId; the server only ever returns
// that entry's cells, never the full grid.
export async function POST(request: NextRequest) {
    let body: { puzzleId?: unknown; entryId?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const puzzleId = typeof body.puzzleId === "string" ? body.puzzleId : null;
    const entryId = typeof body.entryId === "string" ? body.entryId : null;

    if (!puzzleId || !entryId) {
        return NextResponse.json({ error: "puzzleId and entryId required." }, { status: 400 });
    }

    const overrides = await loadOverrides();
    const puzzle = getCrosswordPuzzleById(puzzleId, overrides);
    if (!puzzle) {
        return NextResponse.json({ error: "Puzzle not found." }, { status: 404 });
    }

    const entry = puzzle.entries.find((e) => e.id === entryId);
    if (!entry) {
        return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    const letters: Record<string, string> = {};
    entry.cells.forEach((key, index) => {
        letters[key] = entry.answer[index] ?? "";
    });

    return NextResponse.json({ letters }, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
    });
}
