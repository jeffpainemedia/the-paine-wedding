import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";
import { getDailyWord } from "@/lib/games/painedle-server";

// GET /api/admin/games/painedle-answer?dateKey=...
// Admin-only endpoint that powers the "Show Answer" reveal in the admin
// panel. Auth is required so non-admins can't hit this URL directly.
export async function GET(request: NextRequest) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSessionToken(token);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const dateKey = url.searchParams.get("dateKey");
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return NextResponse.json({ error: "dateKey (YYYY-MM-DD) required." }, { status: 400 });
    }

    return NextResponse.json({ solution: getDailyWord(dateKey) }, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
    });
}
