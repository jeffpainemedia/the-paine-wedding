import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/server/supabase-admin";

type RateLimitOptions = {
    bucket: string;
    limit: number;
    windowSeconds: number;
    identifier?: string;
    message?: string;
};

type RateLimitRow = {
    allowed: boolean;
    remaining: number;
    retry_after_seconds: number;
    count: number;
};

export function getClientIp(request: NextRequest): string | null {
    const forwardedFor = request.headers.get("x-forwarded-for");
    return forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}

export function noStoreJson(
    body: unknown,
    init?: ResponseInit,
) {
    const response = NextResponse.json(body, init);
    response.headers.set("Cache-Control", "no-store");
    return response;
}

export async function enforceRateLimit(
    request: NextRequest,
    options: RateLimitOptions,
): Promise<NextResponse | null> {
    const identifier =
        options.identifier ||
        getClientIp(request) ||
        `ua:${(request.headers.get("user-agent") || "unknown").slice(0, 120)}`;

    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", {
        p_bucket: options.bucket,
        p_identifier: identifier,
        p_limit: options.limit,
        p_window_seconds: options.windowSeconds,
    });

    if (error) {
        console.error(`Rate limit check failed for ${options.bucket}:`, error.message);
        return null;
    }

    const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null;
    if (!row?.allowed) {
        const response = noStoreJson(
            { error: options.message ?? "Too many requests. Please slow down and try again shortly." },
            { status: 429 },
        );
        response.headers.set("Retry-After", String(row?.retry_after_seconds ?? options.windowSeconds));
        response.headers.set("X-RateLimit-Limit", String(options.limit));
        response.headers.set("X-RateLimit-Remaining", String(Math.max(row?.remaining ?? 0, 0)));
        return response;
    }

    return null;
}
