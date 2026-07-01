import { NextRequest, NextResponse } from "next/server";
import { getConnectionsPuzzleById } from "@/lib/games/connections-server";

// GET /api/games/connections/solution?puzzleId=N
// Returns the full grouping for a puzzle. Used to reveal the solution after
// the player has lost (used all 4 mistakes). Clients should only call this
// once their game-over state is reached.
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const puzzleId = Number.parseInt(url.searchParams.get("puzzleId") ?? "", 10);

    if (!Number.isFinite(puzzleId)) {
        return NextResponse.json({ error: "puzzleId required." }, { status: 400 });
    }

    const puzzle = getConnectionsPuzzleById(puzzleId);
    if (!puzzle) {
        return NextResponse.json({ error: "Puzzle not found." }, { status: 404 });
    }

    return NextResponse.json({ groups: puzzle.groups }, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
    });
}
