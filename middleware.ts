import { NextRequest, NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function requiresSameOriginProtection(pathname: string) {
    return (
        pathname.startsWith("/api/admin/") ||
        pathname === "/api/rsvp/search" ||
        pathname === "/api/rsvp/submit" ||
        pathname === "/api/rsvp/viewed" ||
        pathname === "/api/games/submit-score"
    );
}

function isSameOriginRequest(request: NextRequest) {
    const expectedOrigin = request.nextUrl.origin;
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const fetchSite = request.headers.get("sec-fetch-site");

    if (fetchSite === "cross-site") {
        return false;
    }

    if (origin) {
        return origin === expectedOrigin;
    }

    if (referer) {
        try {
            return new URL(referer).origin === expectedOrigin;
        } catch {
            return false;
        }
    }

    return process.env.NODE_ENV !== "production";
}

export function middleware(request: NextRequest) {
    if (!MUTATING_METHODS.has(request.method) || !requiresSameOriginProtection(request.nextUrl.pathname)) {
        return NextResponse.next();
    }

    if (!isSameOriginRequest(request)) {
        return NextResponse.json(
            { error: "This request was blocked because it did not come from the same site." },
            { status: 403, headers: { "Cache-Control": "no-store" } },
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/:path*"],
};
