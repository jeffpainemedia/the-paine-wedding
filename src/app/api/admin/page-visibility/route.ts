import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";
import { MANAGED_PAGES } from "@/lib/page-visibility";
import { revalidatePath } from "next/cache";
import { noStoreJson } from "@/lib/server/request-security";

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

async function verifyAdmin(): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
        return verifyAdminSessionToken(token) !== null;
    } catch {
        return false;
    }
}

// GET: return all managed pages with their current hidden status
export async function GET() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getServiceClient();
    const { data: settings } = await sb
        .from("site_settings")
        .select("key, value")
        .like("key", "page.%.hidden");

    const hiddenMap: Record<string, boolean> = {};
    for (const row of settings ?? []) {
        hiddenMap[row.key] = row.value === "true";
    }

    const pages = MANAGED_PAGES.map((p) => ({
        slug: p.slug,
        label: p.label,
        hidden: hiddenMap[`page.${p.slug}.hidden`] ?? false,
    }));

    return noStoreJson({ pages });
}

// POST: { slug: string, hidden: boolean }
export async function POST(req: NextRequest) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { slug?: string; hidden?: boolean };
    const { slug, hidden } = body;

    if (!slug || typeof hidden !== "boolean") {
        return noStoreJson({ error: "Missing slug or hidden" }, { status: 400 });
    }

    const isManaged = MANAGED_PAGES.some((p) => p.slug === slug);
    if (!isManaged) {
        return noStoreJson({ error: "Unknown page slug" }, { status: 400 });
    }

    const sb = getServiceClient();
    const key = `page.${slug}.hidden`;

    if (hidden) {
        const { error } = await sb.from("site_settings").upsert({ key, value: "true" }, { onConflict: "key" });
        if (error) {
            return noStoreJson({ error: error.message }, { status: 500 });
        }
    } else {
        const { error } = await sb.from("site_settings").delete().eq("key", key);
        if (error) {
            return noStoreJson({ error: error.message }, { status: 500 });
        }
    }

    revalidatePath("/", "layout");
    revalidatePath(`/${slug}`);

    return noStoreJson({ ok: true });
}
