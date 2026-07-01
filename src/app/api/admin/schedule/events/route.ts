import { NextRequest } from "next/server";
import { getServiceClient, getAdminSession } from "@/lib/server/supabase-admin";
import { noStoreJson } from "@/lib/server/request-security";

async function requireAdmin() {
    const session = await getAdminSession();
    if (!session) return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    return null;
}

export async function GET() {
    const deny = await requireAdmin();
    if (deny) return deny;

    const sb = getServiceClient();
    const { data: events, error } = await sb
        .from("schedule_events")
        .select("id, event_date, start_time, end_time, title, location, notes, sort_order")
        .order("start_time")
        .order("sort_order");

    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    // Attach tier ids per event
    const { data: visibility } = await sb
        .from("schedule_event_visibility")
        .select("event_id, tier_id");

    const tierMap: Record<string, string[]> = {};
    for (const row of visibility ?? []) {
        if (!tierMap[row.event_id]) tierMap[row.event_id] = [];
        tierMap[row.event_id].push(row.tier_id);
    }

    const result = (events ?? []).map((e) => ({ ...e, tier_ids: tierMap[e.id] ?? [] }));
    return noStoreJson({ events: result });
}

export async function POST(request: NextRequest) {
    const deny = await requireAdmin();
    if (deny) return deny;

    const body = await request.json() as {
        event_date?: string;
        start_time?: string;
        end_time?: string | null;
        title?: string;
        location?: string | null;
        notes?: string | null;
        sort_order?: number;
        tier_ids?: string[];
    };

    if (!body.start_time || !body.title) {
        return noStoreJson({ error: "start_time and title are required." }, { status: 400 });
    }

    const sb = getServiceClient();
    const { data: event, error } = await sb
        .from("schedule_events")
        .insert({
            event_date: body.event_date ?? "2026-09-26",
            start_time: body.start_time,
            end_time: body.end_time ?? null,
            title: body.title.trim(),
            location: body.location ?? null,
            notes: body.notes ?? null,
            sort_order: body.sort_order ?? 0,
        })
        .select()
        .single();

    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    if (body.tier_ids?.length) {
        await sb.from("schedule_event_visibility").insert(
            body.tier_ids.map((tid) => ({ event_id: event.id, tier_id: tid }))
        );
    }

    return noStoreJson({ event: { ...event, tier_ids: body.tier_ids ?? [] } }, { status: 201 });
}
