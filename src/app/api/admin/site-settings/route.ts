import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";
import { revalidatePath } from "next/cache";
import { noStoreJson } from "@/lib/server/request-security";

const ALLOWED_SETTING_PATTERNS = [
    /^couple\.names$/,
    /^date\.(display|dayOfWeek|rsvpDeadline|rsvpDeadlineIso)$/,
    /^venue\.(name|address|city|cityDisplay|fullAddress|mapsUrl|mapsEmbedSrc|ceremonyTime|cocktailTime|receptionTime|sendOffTime|parking|shuttle)$/,
    /^dresscode\.(short|summary|ladies|gentlemen)$/,
    /^images\.hero$/,
    /^images\.attire\.(ladies|gents)\.\d+$/,
    /^meta\.(title|description)$/,
    /^schedule$/,
    /^schedule\.\d+\.(title|time|description)$/,
    /^faq$/,
    /^faq\.\d+\.(q|a)$/,
    /^registry$/,
    /^story\.subtitle$/,
    /^story\.item\.\d+\.(image|title|description)$/,
    /^home\.intro$/,
    /^bridal-party\.(bridesmaids|groomsmen)\.\d+\.image$/,
    /^page\.[a-z0-9-]+\.hidden$/,
    /^games\.crossword\.overrides$/,
];

function isAllowedSiteSettingKey(key: string) {
    return ALLOWED_SETTING_PATTERNS.some((pattern) => pattern.test(key));
}

function isReasonableSettingValue(value: unknown) {
    try {
        return JSON.stringify(value).length <= 100_000;
    } catch {
        return false;
    }
}

async function getAdminSupabase() {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSessionToken(token);
    if (!session) return null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return null;

    return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

/** GET /api/admin/site-settings — return all settings as { key: value } map */
export async function GET() {
    const supabase = await getAdminSupabase();
    if (!supabase) return noStoreJson({ error: "Unauthorized." }, { status: 401 });

    try {
        const { data, error } = await supabase
            .from("site_settings")
            .select("key, value")
            .order("key");

        if (error) throw error;

        const settings: Record<string, unknown> = {};
        for (const row of data ?? []) {
            settings[row.key as string] = row.value;
        }

        return noStoreJson({ settings });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not load settings.";
        return noStoreJson({ error: message }, { status: 500 });
    }
}

/** POST /api/admin/site-settings — upsert one setting: { key, value } */
export async function POST(request: NextRequest) {
    const supabase = await getAdminSupabase();
    if (!supabase) return noStoreJson({ error: "Unauthorized." }, { status: 401 });

    try {
        const body = await request.json() as { key?: string; value?: unknown };
        const { key, value } = body;

        if (typeof key !== "string" || !key.trim()) {
            return noStoreJson({ error: "key is required." }, { status: 400 });
        }
        if (value === undefined) {
            return noStoreJson({ error: "value is required." }, { status: 400 });
        }

        const trimmedKey = key.trim();
        if (!isAllowedSiteSettingKey(trimmedKey)) {
            return noStoreJson({ error: "This setting key is not allowed." }, { status: 400 });
        }
        if (!isReasonableSettingValue(value)) {
            return noStoreJson({ error: "This setting value is too large." }, { status: 400 });
        }

        const { error } = await supabase
            .from("site_settings")
            .upsert({ key: trimmedKey, value }, { onConflict: "key" });

        if (error) throw error;

        // Revalidate all public pages so changes take effect immediately
        revalidatePath("/", "layout");

        return noStoreJson({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not save setting.";
        return noStoreJson({ error: message }, { status: 500 });
    }
}

/** DELETE /api/admin/site-settings — delete one setting: { key } in body */
export async function DELETE(request: NextRequest) {
    const supabase = await getAdminSupabase();
    if (!supabase) return noStoreJson({ error: "Unauthorized." }, { status: 401 });

    try {
        const body = await request.json() as { key?: string };
        const { key } = body;

        if (typeof key !== "string" || !key.trim()) {
            return noStoreJson({ error: "key is required." }, { status: 400 });
        }

        const trimmedKey = key.trim();
        if (!isAllowedSiteSettingKey(trimmedKey)) {
            return noStoreJson({ error: "This setting key is not allowed." }, { status: 400 });
        }

        const { error } = await supabase
            .from("site_settings")
            .delete()
            .eq("key", trimmedKey);

        if (error) throw error;

        revalidatePath("/", "layout");

        return noStoreJson({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not delete setting.";
        return noStoreJson({ error: message }, { status: 500 });
    }
}
