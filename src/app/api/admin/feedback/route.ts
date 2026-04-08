import { NextRequest } from "next/server";
import { noStoreJson } from "@/lib/server/request-security";
import { getAdminSession, getServiceClient } from "@/lib/server/supabase-admin";

export async function GET() {
    if (!(await getAdminSession())) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("feedback_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ feedback: data ?? [] });
}

export async function PATCH(request: NextRequest) {
    if (!(await getAdminSession())) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
        id?: string;
        status?: "new" | "seen" | "closed";
        admin_notes?: string | null;
    };

    if (!body.id) {
        return noStoreJson({ error: "Feedback id is required." }, { status: 400 });
    }

    const updates: Record<string, string | null> = {};
    if (typeof body.status === "string") updates.status = body.status;
    if ("admin_notes" in body) updates.admin_notes = typeof body.admin_notes === "string" ? body.admin_notes.trim().slice(0, 4000) || null : null;

    const supabase = getServiceClient();
    const { error } = await supabase.from("feedback_messages").update(updates).eq("id", body.id);

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ ok: true });
}
