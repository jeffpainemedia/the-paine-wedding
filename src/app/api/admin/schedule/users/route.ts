import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceClient, getAdminSession } from "@/lib/server/supabase-admin";
import { noStoreJson } from "@/lib/server/request-security";

async function requireAdmin() {
    const session = await getAdminSession();
    if (!session) return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    return null;
}

// Adjectives and nouns for passphrase generation
const ADJECTIVES = ["coral","cedar","amber","linen","willow","rustic","golden","pearl","sunset","birch","ivory","sage","copper","navy","olive","misty","ember","sienna","crimson","violet","misty","ashen","tawny","dusty","serene"];
const NOUNS      = ["ridge","stone","grove","creek","bay","dawn","lane","moss","fern","tide","bloom","cove","hill","pine","bend","oak","crest","run","arch","vale","mist","shore","bluff","knoll","path"];

export function generatePassphrase(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 90) + 10;
    return `${adj}-${noun}-${num}`;
}

export async function GET() {
    const deny = await requireAdmin();
    if (deny) return deny;

    const sb = getServiceClient();
    const { data, error } = await sb
        .from("schedule_users")
        .select("id, username, display_name, email, role_label, tier_id, game_player_id, last_login_at, login_count, created_at, schedule_tiers!inner(slug, label)")
        .order("display_name");

    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    return noStoreJson({ users: data ?? [] });
}

export async function POST(request: NextRequest) {
    const deny = await requireAdmin();
    if (deny) return deny;

    const body = await request.json() as {
        username?: string;
        display_name?: string;
        email?: string;
        role_label?: string;
        tier_id?: string;
        password?: string;
    };

    const username = body.username?.trim().toLowerCase();
    const display_name = body.display_name?.trim();
    const tier_id = body.tier_id;

    if (!username || !display_name || !tier_id) {
        return noStoreJson({ error: "username, display_name, and tier_id are required." }, { status: 400 });
    }

    const plainPassword = body.password?.trim() || generatePassphrase();
    const password_hash = await bcrypt.hash(plainPassword, 10);

    const sb = getServiceClient();

    // Try to link existing game_player by email
    let game_player_id: string | null = null;
    if (body.email) {
        const { data: gp } = await sb
            .from("game_players")
            .select("id")
            .eq("email", body.email.trim().toLowerCase())
            .maybeSingle();
        if (gp) game_player_id = gp.id;
    }

    const { data, error } = await sb
        .from("schedule_users")
        .insert({
            username,
            display_name,
            email: body.email?.trim().toLowerCase() ?? null,
            role_label: body.role_label?.trim() ?? "",
            tier_id,
            password_hash,
            game_player_id,
        })
        .select("id, username, display_name, email, role_label, tier_id, game_player_id, last_login_at, login_count, created_at")
        .single();

    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    return noStoreJson({ user: data, plainPassword }, { status: 201 });
}
