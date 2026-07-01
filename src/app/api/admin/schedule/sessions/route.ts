import { NextRequest } from "next/server";
import { getServiceClient, getAdminSession } from "@/lib/server/supabase-admin";
import { noStoreJson } from "@/lib/server/request-security";

export async function GET(request: NextRequest) {
    const session = await getAdminSession();
    if (!session) return noStoreJson({ error: "Unauthorized." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 50)));
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

    const sb = getServiceClient();
    let query = sb
        .from("schedule_sessions")
        .select("id, user_id, username_snapshot, tier_snapshot, logged_in_at, ip, user_agent, country", { count: "exact" })
        .order("logged_in_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (userId) query = query.eq("user_id", userId);

    const { data, error, count } = await query;
    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    return noStoreJson({ sessions: data ?? [], total: count ?? 0 });
}
