import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";
import { PAINEDLE_WORDS } from "@/lib/games/word-list";
import { getDailyWord, getPuzzleIndex } from "@/lib/games/painedle-server";
import { CONNECTIONS_PUZZLES } from "@/lib/games/connections-puzzles";
// Crossword data is server-only — importing here is safe (this is a route handler).
import { getCrosswordCatalog, getDailyCrosswordPuzzle } from "@/lib/games/crossword";

// GET /api/admin/games/painedle-data?dateKey=YYYY-MM-DD&days=21
// Admin-only payload that the GamesAdminPanel uses to render the Painedle
// word bank, today's word, and the upcoming-rotation schedule. Public
// callers get 401.
export async function GET(request: NextRequest) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSessionToken(token)) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const dateKey = url.searchParams.get("dateKey");
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return NextResponse.json({ error: "dateKey (YYYY-MM-DD) required." }, { status: 400 });
    }

    // Window: how many days to show before/after today. Defaults give a
    // 4-week look-ahead and 2-week look-back so admin can see what guests
    // were playing recently as well as what's coming.
    const daysAfter = Math.min(120, Math.max(1, parseInt(url.searchParams.get("daysAfter") ?? "28", 10) || 28));
    const daysBefore = Math.min(120, Math.max(0, parseInt(url.searchParams.get("daysBefore") ?? "14", 10) || 0));

    // Build the day window on the server so the client doesn't need access
    // to the daily-word logic.
    const [year, month, day] = dateKey.split("-").map(Number);
    const baseDate = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
    const upcoming = Array.from({ length: daysBefore + daysAfter + 1 }, (_, idx) => {
        const offset = idx - daysBefore;
        const d = new Date(baseDate);
        d.setUTCDate(baseDate.getUTCDate() + offset);
        const key = d.toISOString().slice(0, 10);
        return {
            key,
            // Local-readable label is built on the client (Date.toLocaleDateString
            // depends on locale/timezone of the viewer).
            isoDate: d.toISOString(),
            word: getDailyWord(key),
            isToday: offset === 0,
            isPast: offset < 0,
        };
    });

    // Cross-game metadata used by the unified dashboard. Crossword and
    // Connections each have their own server-only puzzle pools that the
    // browser can't see, so we surface counts + today's puzzle id here.
    const crosswordCatalog = getCrosswordCatalog();
    const todayCrossword = getDailyCrosswordPuzzle(dateKey);

    return NextResponse.json({
        words: PAINEDLE_WORDS,
        todayWord: getDailyWord(dateKey),
        todayIndex: getPuzzleIndex(dateKey),
        upcoming,
        crossword: {
            puzzleCount: crosswordCatalog.length,
            todayPuzzleId: todayCrossword.id,
        },
        connections: {
            puzzleCount: CONNECTIONS_PUZZLES.length,
        },
    }, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
    });
}
