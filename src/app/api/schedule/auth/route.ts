import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";
import {
    createScheduleToken,
    getScheduleCookieOptions,
    SCHEDULE_AUTH_MAX_AGE,
    verifyScheduleToken,
    SCHEDULE_AUTH_COOKIE,
} from "@/lib/schedule/auth";

// POST /api/schedule/auth — login
export async function POST(request: NextRequest) {
    const rateLimit = await enforceRateLimit(request, {
        bucket: "schedule-auth",
        limit: 10,
        windowSeconds: 60 * 5,
        message: "Too many login attempts. Please wait a few minutes.",
    });
    if (rateLimit) return rateLimit;

    try {
        const body = await request.json() as { username?: string; password?: string };
        const username = body.username?.trim().toLowerCase();
        const password = body.password?.trim();

        if (!username || !password) {
            return noStoreJson({ error: "Username and password are required." }, { status: 400 });
        }

        const sb = getServiceClient();
        const { data: user, error } = await sb
            .from("schedule_users")
            .select("id, username, display_name, email, password_hash, role_label, game_player_id, tier_id, login_count, schedule_tiers!inner(slug, label)")
            .eq("username", username)
            .maybeSingle();

        if (error || !user) {
            await new Promise((r) => setTimeout(r, 300));
            return noStoreJson({ error: "Invalid username or password." }, { status: 401 });
        }

        const tier = (user as unknown as { schedule_tiers: { slug: string; label: string } }).schedule_tiers;
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            await new Promise((r) => setTimeout(r, 300));
            return noStoreJson({ error: "Invalid username or password." }, { status: 401 });
        }

        // Update login stats
        await sb
            .from("schedule_users")
            .update({ last_login_at: new Date().toISOString(), login_count: (user.login_count ?? 0) + 1, updated_at: new Date().toISOString() })
            .eq("id", user.id);

        // Log session
        const forwardedFor = request.headers.get("x-forwarded-for");
        const ip = forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
        await sb.from("schedule_sessions").insert({
            user_id: user.id,
            username_snapshot: user.username,
            tier_snapshot: tier.slug,
            ip,
            user_agent: request.headers.get("user-agent"),
            country: request.headers.get("x-vercel-ip-country"),
        });

        const payload = {
            userId: user.id,
            username: user.username,
            displayName: user.display_name,
            tierSlug: tier.slug,
            tierLabel: tier.label,
            roleLabel: user.role_label,
            email: user.email,
            gamePlayerId: user.game_player_id,
            exp: Date.now() + SCHEDULE_AUTH_MAX_AGE * 1000,
        };

        const token = createScheduleToken(payload);
        const response = noStoreJson({ ok: true, displayName: user.display_name, tierLabel: tier.label });
        response.cookies.set({
            ...getScheduleCookieOptions(),
            value: token,
            maxAge: SCHEDULE_AUTH_MAX_AGE,
        });
        return response;
    } catch {
        return noStoreJson({ error: "Login failed. Please try again." }, { status: 500 });
    }
}

// DELETE /api/schedule/auth — logout
export async function DELETE() {
    const response = noStoreJson({ ok: true });
    response.cookies.set({
        ...getScheduleCookieOptions(),
        value: "",
        maxAge: 0,
    });
    return response;
}

// GET /api/schedule/auth — return current user info
export async function GET(request: NextRequest) {
    const token = request.cookies.get(SCHEDULE_AUTH_COOKIE)?.value;
    const payload = verifyScheduleToken(token);
    if (!payload) return noStoreJson({ user: null });
    return noStoreJson({
        user: {
            displayName: payload.displayName,
            tierSlug: payload.tierSlug,
            tierLabel: payload.tierLabel,
            roleLabel: payload.roleLabel,
            email: payload.email,
            gamePlayerId: payload.gamePlayerId,
        },
    });
}
