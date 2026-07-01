import { NextRequest, NextResponse } from "next/server";
import { getConnectionsPuzzleById, checkSelection } from "@/lib/games/connections-server";

// POST /api/games/connections/check
// Validates a 4-word selection. The server keeps the answer key — the client
// only learns whether the selection matched, was "one away", or was wrong.
export async function POST(request: NextRequest) {
    let body: { puzzleId?: unknown; words?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const puzzleId = typeof body.puzzleId === "number" ? body.puzzleId : null;
    const words = Array.isArray(body.words) && body.words.every((w) => typeof w === "string")
        ? (body.words as string[])
        : null;

    if (puzzleId === null || !words || words.length !== 4) {
        return NextResponse.json({ error: "puzzleId (number) and words (array of 4 strings) required." }, { status: 400 });
    }

    const puzzle = getConnectionsPuzzleById(puzzleId);
    if (!puzzle) {
        return NextResponse.json({ error: "Puzzle not found." }, { status: 404 });
    }

    const result = checkSelection(puzzle, words);

    return NextResponse.json(result, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
    });
}
