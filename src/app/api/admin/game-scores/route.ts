import { noStoreJson } from "@/lib/server/request-security";
import { getAdminSession, getServiceClient } from "@/lib/server/supabase-admin";

export async function GET() {
    if (!(await getAdminSession())) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getServiceClient();
    const { data, error } = await sb
        .from("game_scores")
        .select("id, game, puzzle_key, score, max_score, attempts, solved, metadata, created_at, game_players(id, username, email, created_at)")
        .order("created_at", { ascending: false })
        .limit(300);

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ gameScores: data ?? [] });
}
