import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";
import { getAllCrosswordWordClues } from "@/lib/games/crossword";

// GET /api/admin/games/word-clues
// Admin-only export of every unique word+clue pair across the puzzle pool.
// Powers the "Export words & clues" admin action.
export async function GET(request: NextRequest) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSessionToken(token)) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json({ entries: getAllCrosswordWordClues() }, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
    });
}
