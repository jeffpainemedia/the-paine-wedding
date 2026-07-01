import { NextRequest } from "next/server";
import { getServiceClient, getAdminSession } from "@/lib/server/supabase-admin";
import { noStoreJson } from "@/lib/server/request-security";

async function requireAdmin() {
    const session = await getAdminSession();
    if (!session) return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    return null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const deny = await requireAdmin();
    if (deny) return deny;

    const { id } = await params;
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

    const sb = getServiceClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.event_date !== undefined) updates.event_date = body.event_date;
    if (body.start_time !== undefined) updates.start_time = body.start_time;
    if (body.end_time !== undefined) updates.end_time = body.end_time;
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.location !== undefined) updates.location = body.location;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

    const { data: event, error } = await sb.from("schedule_events").update(updates).eq("id", id).select().single();
    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    // Replace visibility if tier_ids provided
    if (body.tier_ids !== undefined) {
        await sb.from("schedule_event_visibility").delete().eq("event_id", id);
        if (body.tier_ids.length > 0) {
            await sb.from("schedule_event_visibility").insert(
                body.tier_ids.map((tid) => ({ event_id: id, tier_id: tid }))
            );
        }
    }

    return noStoreJson({ event: { ...event, tier_ids: body.tier_ids } });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const deny = await requireAdmin();
    if (deny) return deny;

    const { id } = await params;
    const sb = getServiceClient();
    const { error } = await sb.from("schedule_events").delete().eq("id", id);
    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    return noStoreJson({ ok: true });
}
