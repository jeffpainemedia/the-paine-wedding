import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";
import { noStoreJson } from "@/lib/server/request-security";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function sanitizeStoragePath(path: string) {
    return path
        .replace(/\\/g, "/")
        .replace(/^\//, "")
        .replace(/\.\.+/g, "")
        .replace(/[^a-z0-9/._-]/gi, "-")
        .replace(/\/+/g, "/")
        .toLowerCase();
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

/**
 * POST /api/admin/upload-image
 * Body: multipart/form-data with:
 *   file  — the image file
 *   path  — (optional) storage path, e.g. "hero/hero-main.jpg"
 *            Defaults to "uploads/{timestamp}-{filename}"
 *
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
    const supabase = await getAdminSupabase();
    if (!supabase) return noStoreJson({ error: "Unauthorized." }, { status: 401 });

    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const pathOverride = formData.get("path");

        if (!file || !(file instanceof File)) {
            return noStoreJson({ error: "file is required." }, { status: 400 });
        }

        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
            return noStoreJson(
                { error: "Only JPG, PNG, WebP, and AVIF images are allowed." },
                { status: 400 },
            );
        }

        if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
            return noStoreJson(
                { error: "Image uploads must be smaller than 10 MB." },
                { status: 400 },
            );
        }

        const ext = file.name.split(".").pop() ?? "jpg";
        const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, "-").toLowerCase();
        const storagePath =
            typeof pathOverride === "string" && pathOverride.trim()
                ? sanitizeStoragePath(pathOverride.trim())
                : `uploads/${Date.now()}-${safeName}`;

        if (!storagePath || storagePath.startsWith("../")) {
            return noStoreJson({ error: "Invalid upload path." }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { data, error } = await supabase.storage
            .from("site-images")
            .upload(storagePath, buffer, {
                contentType: file.type || `image/${ext}`,
                upsert: true,
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from("site-images")
            .getPublicUrl(data.path);

        // Append cache-busting version param so the browser always fetches
        // the new image even if the same storage path was overwritten via upsert.
        const cacheBustedUrl = `${urlData.publicUrl}?v=${Date.now()}`;

        return noStoreJson({ url: cacheBustedUrl, path: data.path });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        return noStoreJson({ error: message }, { status: 500 });
    }
}
