import { noStoreJson } from "@/lib/server/request-security";
import { getAdminSession, getServiceClient } from "@/lib/server/supabase-admin";

export async function GET() {
    const session = await getAdminSession();
    if (!session) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "Master") {
        return noStoreJson({ error: "Forbidden" }, { status: 403 });
    }

    const sb = getServiceClient();
    const { data, error } = await sb
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ logs: data ?? [] });
}
