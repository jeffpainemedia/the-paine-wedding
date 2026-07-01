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
    const body = await request.json() as { label?: string; sort_order?: number; slug?: string };
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.label !== undefined) updates.label = body.label.trim();
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
    if (body.slug !== undefined) updates.slug = body.slug.trim().toLowerCase().replace(/\s+/g, "-");

    const sb = getServiceClient();
    const { data, error } = await sb.from("schedule_tiers").update(updates).eq("id", id).select().single();
    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    return noStoreJson({ tier: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const deny = await requireAdmin();
    if (deny) return deny;

    const { id } = await params;
    const sb = getServiceClient();

    // Block deletion if users are assigned
    const { count } = await sb.from("schedule_users").select("id", { count: "exact", head: true }).eq("tier_id", id);
    if ((count ?? 0) > 0) {
        return noStoreJson({ error: "Reassign all users from this tier before deleting it." }, { status: 409 });
    }

    // Block deletion of public tier
    const { data: tier } = await sb.from("schedule_tiers").select("is_public").eq("id", id).maybeSingle();
    if (tier?.is_public) return noStoreJson({ error: "Cannot delete the public tier." }, { status: 409 });

    const { error } = await sb.from("schedule_tiers").delete().eq("id", id);
    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    return noStoreJson({ ok: true });
}
