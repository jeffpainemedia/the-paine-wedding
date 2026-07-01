import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceClient, getAdminSession } from "@/lib/server/supabase-admin";
import { noStoreJson } from "@/lib/server/request-security";
import { generatePassphrase } from "../../route";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAdminSession();
    if (!session) return noStoreJson({ error: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    const plainPassword = generatePassphrase();
    const password_hash = await bcrypt.hash(plainPassword, 10);

    const sb = getServiceClient();
    const { error } = await sb
        .from("schedule_users")
        .update({ password_hash, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    return noStoreJson({ plainPassword });
}
