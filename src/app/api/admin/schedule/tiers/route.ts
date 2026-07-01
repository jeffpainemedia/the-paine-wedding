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
    const { data, error } = await sb
        .from("schedule_tiers")
        .select("id, slug, label, sort_order, is_public, created_at")
        .order("sort_order");

    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    return noStoreJson({ tiers: data ?? [] });
}

export async function POST(request: NextRequest) {
    const deny = await requireAdmin();
    if (deny) return deny;

    const body = await request.json() as { slug?: string; label?: string; sort_order?: number };
    const slug = body.slug?.trim().toLowerCase().replace(/\s+/g, "-");
    const label = body.label?.trim();

    if (!slug || !label) return noStoreJson({ error: "Slug and label are required." }, { status: 400 });

    const sb = getServiceClient();
    const { data, error } = await sb
        .from("schedule_tiers")
        .insert({ slug, label, sort_order: body.sort_order ?? 50 })
        .select()
        .single();

    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    return noStoreJson({ tier: data }, { status: 201 });
}
