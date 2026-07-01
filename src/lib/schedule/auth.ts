import { createHmac, timingSafeEqual } from "node:crypto";
import type { ScheduleAuthPayload } from "./types";

export const SCHEDULE_AUTH_COOKIE = "wedding_schedule_auth";
export const SCHEDULE_AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
    return process.env.DAY_OF_AUTH_SECRET ?? "dev-schedule-secret-change-me";
}

function sign(payload: string): string {
    return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createScheduleToken(payload: ScheduleAuthPayload): string {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = sign(data);
    return `${data}.${sig}`;
}

export function verifyScheduleToken(token: string | undefined): ScheduleAuthPayload | null {
    if (!token) return null;

    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return null;

    const data = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    const expectedSig = sign(data);
    const provided = Buffer.from(sig);
    const expected = Buffer.from(expectedSig);

    if (
        provided.length !== expected.length ||
        !timingSafeEqual(provided, expected)
    ) {
        return null;
    }

    try {
        const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as ScheduleAuthPayload;
        if (!payload.exp || payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

export function getScheduleCookieOptions() {
    return {
        name: SCHEDULE_AUTH_COOKIE,
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
    };
}
