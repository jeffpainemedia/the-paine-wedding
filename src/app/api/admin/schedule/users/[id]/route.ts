import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
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
        display_name?: string;
        email?: string | null;
        role_label?: string;
        tier_id?: string;
        password?: string;
    };

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.display_name !== undefined) updates.display_name = body.display_name.trim();
    if (body.email !== undefined) updates.email = body.email?.trim().toLowerCase() ?? null;
    if (body.role_label !== undefined) updates.role_label = body.role_label.trim();
    if (body.tier_id !== undefined) updates.tier_id = body.tier_id;

    let plainPassword: string | undefined;
    if (body.password) {
        plainPassword = body.password.trim();
        updates.password_hash = await bcrypt.hash(plainPassword, 10);
    }

    // Re-link game_player if email changed
    if (body.email) {
        const sb = getServiceClient();
        const { data: gp } = await sb
            .from("game_players")
            .select("id")
            .eq("email", body.email.trim().toLowerCase())
            .maybeSingle();
        if (gp) updates.game_player_id = gp.id;
    }

    const sb = getServiceClient();
    const { data, error } = await sb.from("schedule_users").update(updates).eq("id", id).select().single();
    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    return noStoreJson({ user: data, ...(plainPassword ? { plainPassword } : {}) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const deny = await requireAdmin();
    if (deny) return deny;

    const { id } = await params;
    const sb = getServiceClient();
    const { error } = await sb.from("schedule_users").delete().eq("id", id);
    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    return noStoreJson({ ok: true });
}
