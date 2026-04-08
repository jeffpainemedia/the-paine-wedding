import { createHmac, timingSafeEqual } from "node:crypto";

const RSVP_ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

function getRSVPAccessSecret() {
    return (
        process.env.RSVP_ACCESS_TOKEN_SECRET ||
        process.env.ADMIN_SESSION_SECRET ||
        process.env.ADMIN_PASSWORD_MASTER ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "fallback-rsvp-secret"
    );
}

function signToken(payload: string) {
    return createHmac("sha256", getRSVPAccessSecret()).update(payload).digest("hex");
}

export function createRSVPAccessToken(householdId: string, guestId: string) {
    const expiresAt = Date.now() + RSVP_ACCESS_TOKEN_MAX_AGE * 1000;
    const payload = `${householdId}.${guestId}.${expiresAt}`;
    return `${payload}.${signToken(payload)}`;
}

export function verifyRSVPAccessToken(token: string | undefined) {
    if (!token) return null;

    const [householdId, guestId, expiresAtRaw, signature] = token.split(".");
    if (!householdId || !guestId || !expiresAtRaw || !signature) {
        return null;
    }

    const payload = `${householdId}.${guestId}.${expiresAtRaw}`;
    const expectedSignature = signToken(payload);
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
        return null;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
        return null;
    }

    return { householdId, guestId, expiresAt };
}
