import { noStoreJson } from "@/lib/server/request-security";
import { getAdminSession, getServiceClient } from "@/lib/server/supabase-admin";

export async function GET() {
    if (!(await getAdminSession())) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getServiceClient();
    const { data, error } = await sb
        .from("rsvp_history")
        .select("*, guests:guests!rsvp_history_guest_id_fkey(first_name, last_name, suffix, households(name)), households(name)")
        .order("recorded_at", { ascending: false })
        .limit(200);

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ history: data ?? [] });
}

function cleanOptionalText(value: unknown, maxLength: number) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.length > maxLength) {
        throw new Error(`Text is too long (max ${maxLength} characters).`);
    }
    return trimmed;
}

export async function PATCH(request: Request) {
    if (!(await getAdminSession())) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
        ids?: unknown;
        updates?: {
            recorded_at?: unknown;
            event_type?: unknown;
            attending?: unknown;
            change_summary?: unknown;
            food_allergies?: unknown;
            song_request?: unknown;
            advice?: unknown;
        };
    };

    const ids = Array.isArray(body.ids)
        ? body.ids.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : [];

    if (ids.length === 0 || !body.updates) {
        return noStoreJson({ error: "Missing history ids or updates." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if ("recorded_at" in body.updates) {
        const value = typeof body.updates.recorded_at === "string" ? body.updates.recorded_at.trim() : "";
        if (!value) {
            return noStoreJson({ error: "Recorded time is required." }, { status: 400 });
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return noStoreJson({ error: "Recorded time is invalid." }, { status: 400 });
        }

        updates.recorded_at = parsed.toISOString();
    }

    const eventType = typeof body.updates.event_type === "string" ? body.updates.event_type : null;
        if (eventType && eventType !== "submitted" && eventType !== "viewed" && eventType !== "updated") {
            return noStoreJson({ error: "Invalid history event type." }, { status: 400 });
        }
    if (eventType) updates.event_type = eventType;

    if ("attending" in body.updates) {
        const value = body.updates.attending;
        if (value !== true && value !== false && value !== null) {
            return noStoreJson({ error: "Invalid RSVP status." }, { status: 400 });
        }
        updates.attending = value;
    }

    try {
        if ("change_summary" in body.updates) {
            updates.change_summary = cleanOptionalText(body.updates.change_summary, 240);
        }
        if ("food_allergies" in body.updates) {
            updates.food_allergies = cleanOptionalText(body.updates.food_allergies, 300);
        }
        if ("song_request" in body.updates) {
            updates.song_request = cleanOptionalText(body.updates.song_request, 160);
        }
        if ("advice" in body.updates) {
            updates.advice = cleanOptionalText(body.updates.advice, 1200);
        }
    } catch (error) {
        return noStoreJson(
            { error: error instanceof Error ? error.message : "Invalid history details." },
            { status: 400 },
        );
    }

    if (eventType === "viewed") {
        updates.attending = null;
        updates.change_summary = null;
        updates.food_allergies = null;
        updates.song_request = null;
        updates.advice = null;
    }

    const sb = getServiceClient();
    const { error } = await sb
        .from("rsvp_history")
        .update(updates)
        .in("id", ids);

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ ok: true });
}

export async function DELETE(request: Request) {
    if (!(await getAdminSession())) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
        ? body.ids.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        : [];

    if (ids.length === 0) {
        return noStoreJson({ error: "Missing history ids." }, { status: 400 });
    }

    const sb = getServiceClient();
    const { error } = await sb
        .from("rsvp_history")
        .delete()
        .in("id", ids);

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ ok: true });
}
