import { NextRequest } from "next/server";
import { enforceRateLimit, getClientIp, noStoreJson } from "@/lib/server/request-security";
import { getServiceClient } from "@/lib/server/supabase-admin";

const FEEDBACK_CATEGORIES = new Set(["bug", "content", "suggestion", "other"]);

function cleanOptionalText(value: unknown, maxLength: number) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, maxLength);
}

function cleanRequiredText(value: unknown, maxLength: number, label: string) {
    const cleaned = cleanOptionalText(value, maxLength);
    if (!cleaned) {
        throw new Error(`${label} is required.`);
    }
    return cleaned;
}

function cleanEmail(value: unknown) {
    const cleaned = cleanOptionalText(value, 160);
    if (!cleaned) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
        throw new Error("Please enter a valid email address.");
    }
    return cleaned.toLowerCase();
}

export async function POST(request: NextRequest) {
    const rateLimited = await enforceRateLimit(request, {
        bucket: "feedback-submit",
        limit: 4,
        windowSeconds: 60 * 60,
        message: "Too many feedback submissions from this network. Please try again a little later.",
    });
    if (rateLimited) return rateLimited;

    const body = (await request.json()) as {
        name?: string;
        email?: string;
        category?: string;
        page?: string;
        message?: string;
        company?: string;
        startedAt?: number;
        context?: string;
        browserLanguage?: string;
    };

    if (typeof body.company === "string" && body.company.trim()) {
        return noStoreJson({ ok: true });
    }

    if (typeof body.startedAt !== "number" || !Number.isFinite(body.startedAt)) {
        return noStoreJson({ error: "Form timing data is missing. Please refresh and try again." }, { status: 400 });
    }

    const elapsedMs = Date.now() - body.startedAt;
    if (elapsedMs < 3000) {
        return noStoreJson({ error: "That was a little too fast. Please try again." }, { status: 400 });
    }

    let message = "";
    let category = "bug";

    try {
        message = cleanRequiredText(body.message, 4000, "Message");
        if (message.length < 12) {
            throw new Error("Please include a little more detail so we can help.");
        }
        category = typeof body.category === "string" && FEEDBACK_CATEGORIES.has(body.category) ? body.category : "bug";
    } catch (error) {
        return noStoreJson({ error: error instanceof Error ? error.message : "Invalid feedback." }, { status: 400 });
    }

    try {
        const supabase = getServiceClient();
        const { error } = await supabase.from("feedback_messages").insert({
            reporter_name: cleanOptionalText(body.name, 120),
            reporter_email: cleanEmail(body.email),
            category,
            source_page: cleanOptionalText(body.page, 240),
            message,
            metadata: {
                ip: getClientIp(request),
                user_agent: request.headers.get("user-agent"),
                referrer: request.headers.get("referer"),
                browser_language: cleanOptionalText(body.browserLanguage, 40),
                context: cleanOptionalText(body.context, 240),
            },
        });

        if (error) {
            return noStoreJson({ error: error.message }, { status: 500 });
        }

        return noStoreJson({ ok: true });
    } catch (error) {
        return noStoreJson(
            { error: error instanceof Error ? error.message : "Could not submit feedback right now." },
            { status: 500 },
        );
    }
}
