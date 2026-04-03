import { NextRequest, NextResponse } from "next/server";
import {
    ADMIN_SESSION_MAX_AGE,
    createAdminSessionToken,
    getAdminSessionCookieBaseOptions,
    getAdminSessionCookieDomain,
} from "@/lib/admin/session";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";

// Passwords are stored server-side in environment variables.
// Set these in .env.local (local dev) and in Vercel project settings (production).
// They are NEVER sent to the browser.
const PASSWORD_MAP: Record<string, string> = {
    [process.env.ADMIN_PASSWORD_MASTER ?? ""]: "Master",
    [process.env.ADMIN_PASSWORD_1 ?? ""]: "User 1",
    [process.env.ADMIN_PASSWORD_2 ?? ""]: "User 2",
    [process.env.ADMIN_PASSWORD_3 ?? ""]: "User 3",
    [process.env.ADMIN_PASSWORD_4 ?? ""]: "User 4",
    [process.env.ADMIN_PASSWORD_5 ?? ""]: "User 5",
};

export async function POST(request: NextRequest) {
    const rateLimitResponse = await enforceRateLimit(request, {
        bucket: "admin-auth",
        limit: 10,
        windowSeconds: 60 * 10,
        message: "Too many admin login attempts. Please wait a few minutes and try again.",
    });
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await request.json();
        const password: string = (body?.password ?? "").trim();

        if (!password) {
            return noStoreJson({ error: "Password is required." }, { status: 400 });
        }

        const role = PASSWORD_MAP[password];

        if (!role) {
            // Consistent timing to prevent password enumeration
            await new Promise((r) => setTimeout(r, 300));
            return noStoreJson({ error: "Invalid password." }, { status: 401 });
        }

        if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
            const supabase = getServiceClient();
            await supabase.from("admin_logs").insert({ password_used: role });
        }

        const response = NextResponse.json({ role }, { status: 200 });
        response.headers.set("Cache-Control", "no-store");
        response.cookies.set({
            ...getAdminSessionCookieBaseOptions(),
            value: "",
            maxAge: 0,
        });
        response.cookies.set({
            ...getAdminSessionCookieBaseOptions(),
            value: createAdminSessionToken(role),
            domain: getAdminSessionCookieDomain(),
            maxAge: ADMIN_SESSION_MAX_AGE,
        });

        return response;
    } catch {
        return noStoreJson({ error: "Invalid request." }, { status: 400 });
    }
}
