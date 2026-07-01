import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";
import {
    getConnectionsPuzzleById,
    getDailyConnectionsPuzzle,
    getPuzzleIndex,
} from "@/lib/games/connections-server";
import { CONNECTIONS_PUZZLES } from "@/lib/games/connections-puzzles";
import { PUZZLE_ROTATION_START } from "@/lib/games/connections";

// GET /api/admin/games/connections?dateKey=YYYY-MM-DD&puzzleId=N&daysBefore=14&daysAfter=28
//
// Admin-only. Returns:
//   - catalog: array of {dateKey, puzzleId} covering the requested window
//   - selectedPuzzleId, selectedDateKey: which puzzle the editor should show
//     (defaults to today's, but caller can pin a specific id)
//   - puzzle: the full puzzle (words + groups + categories) for the selected id
//
// Connections puzzles aren't editable from the UI yet — this endpoint is
// purely for read-only admin viewing of past + current + future puzzles.
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

    const requestedPuzzleId = url.searchParams.get("puzzleId");
    const daysBefore = Math.min(120, Math.max(0, parseInt(url.searchParams.get("daysBefore") ?? "14", 10) || 0));
    const daysAfter = Math.min(120, Math.max(1, parseInt(url.searchParams.get("daysAfter") ?? "28", 10) || 28));

    // Build the date->puzzle catalog window centered on today.
    const [year, month, day] = dateKey.split("-").map(Number);
    const baseDate = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
    const catalog = Array.from({ length: daysBefore + daysAfter + 1 }, (_, idx) => {
        const offset = idx - daysBefore;
        const d = new Date(baseDate);
        d.setUTCDate(baseDate.getUTCDate() + offset);
        const key = d.toISOString().slice(0, 10);
        const puzzle = getDailyConnectionsPuzzle(key);
        return {
            dateKey: key,
            isoDate: d.toISOString(),
            puzzleId: puzzle.id,
            isToday: offset === 0,
            isPast: offset < 0,
        };
    });

    // Resolve which puzzle to show.
    let selectedPuzzle = null;
    let selectedDateKey = dateKey;
    if (requestedPuzzleId) {
        const id = parseInt(requestedPuzzleId, 10);
        if (Number.isFinite(id)) {
            selectedPuzzle = getConnectionsPuzzleById(id);
            // Find which date this puzzle would air on (closest match in catalog).
            const match = catalog.find((c) => c.puzzleId === id);
            if (match) selectedDateKey = match.dateKey;
        }
    }
    if (!selectedPuzzle) {
        selectedPuzzle = getDailyConnectionsPuzzle(dateKey);
        selectedDateKey = dateKey;
    }

    return NextResponse.json({
        catalog,
        selectedDateKey,
        selectedPuzzleId: selectedPuzzle.id,
        puzzle: selectedPuzzle,
        rotationStart: PUZZLE_ROTATION_START,
        totalPuzzles: CONNECTIONS_PUZZLES.length,
        // Quick lookup of today's puzzle index in the rotation, so the
        // viewer can show "Day 32 of 168" style positioning.
        todayPuzzleIndex: getPuzzleIndex(dateKey),
    }, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
    });
}
