import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";
import {
    getCrosswordCatalog,
    getCrosswordPuzzleById,
    parseCrosswordOverrides,
    type CrosswordEntryOverride,
} from "@/lib/games/crossword";
import { noStoreJson } from "@/lib/server/request-security";

const CROSSWORD_OVERRIDES_KEY = "games.crossword.overrides";

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

type AdminSupabase = NonNullable<Awaited<ReturnType<typeof getAdminSupabase>>>;

async function loadCrosswordOverrides(supabase: AdminSupabase) {
    const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", CROSSWORD_OVERRIDES_KEY)
        .maybeSingle();

    if (error) throw error;
    return parseCrosswordOverrides(data?.value);
}

function normalizeOverrideEntries(entries: unknown): CrosswordEntryOverride[] {
    if (!Array.isArray(entries)) {
        throw new Error("entries must be an array.");
    }

    if (entries.length > 32) {
        throw new Error("Too many override entries were provided.");
    }

    return entries.map((entry, index) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            throw new Error(`Entry ${index + 1} is invalid.`);
        }

        const record = entry as Record<string, unknown>;
        const id = typeof record.id === "string" ? record.id.trim() : "";
        const answer = typeof record.answer === "string" ? record.answer.trim().toUpperCase().replace(/[^A-Z]/g, "") : "";
        const clue = typeof record.clue === "string" ? record.clue.trim() : "";

        if (!id) throw new Error(`Entry ${index + 1} is missing an id.`);
        if (id.length > 32) throw new Error(`Entry ${index + 1} has an invalid id.`);
        if (!answer) throw new Error(`Entry ${id} is missing an answer.`);
        if (answer.length > 32) throw new Error(`Entry ${id} answer is too long.`);
        if (!clue) throw new Error(`Entry ${id} is missing a clue.`);
        if (clue.length > 200) throw new Error(`Entry ${id} clue is too long.`);

        return { id, answer, clue };
    });
}

export async function GET(request: NextRequest) {
    const supabase = await getAdminSupabase();
    if (!supabase) return noStoreJson({ error: "Unauthorized." }, { status: 401 });

    try {
        const overrides = await loadCrosswordOverrides(supabase);
        const catalog = getCrosswordCatalog(overrides);
        const requestedPuzzleId = request.nextUrl.searchParams.get("puzzleId")?.trim();
        const selectedPuzzleId = requestedPuzzleId || catalog[0]?.id || null;
        const selectedPuzzle = selectedPuzzleId ? getCrosswordPuzzleById(selectedPuzzleId, overrides) : null;
        const basePuzzle = selectedPuzzleId ? getCrosswordPuzzleById(selectedPuzzleId) : null;

        return noStoreJson({
            catalog,
            selectedPuzzleId,
            puzzle: selectedPuzzle,
            basePuzzle,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not load crossword puzzles.";
        return noStoreJson({ error: message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const supabase = await getAdminSupabase();
    if (!supabase) return noStoreJson({ error: "Unauthorized." }, { status: 401 });

    try {
        const body = await request.json() as { puzzleId?: string; entries?: unknown };
        const puzzleId = typeof body.puzzleId === "string" ? body.puzzleId.trim() : "";
        if (!puzzleId) {
            return noStoreJson({ error: "puzzleId is required." }, { status: 400 });
        }

        const entries = normalizeOverrideEntries(body.entries);
        const currentOverrides = await loadCrosswordOverrides(supabase);

        // Validate by rebuilding the puzzle with the proposed overrides.
        const validatedPuzzle = getCrosswordPuzzleById(puzzleId, { ...currentOverrides, [puzzleId]: entries });
        if (!validatedPuzzle) {
            return noStoreJson({ error: "Puzzle not found." }, { status: 404 });
        }

        const basePuzzle = getCrosswordPuzzleById(puzzleId);
        if (!basePuzzle) {
            return noStoreJson({ error: "Puzzle not found." }, { status: 404 });
        }

        const nextOverrides = { ...currentOverrides };
        const changedEntries = validatedPuzzle.entries
            .filter((entry) => {
                const original = basePuzzle.entries.find((item) => item.id === entry.id);
                return original && (original.answer !== entry.answer || original.clue !== entry.clue);
            })
            .map((entry) => ({
                id: entry.id,
                answer: entry.answer,
                clue: entry.clue,
            }));

        if (changedEntries.length === 0) {
            delete nextOverrides[puzzleId];
        } else {
            nextOverrides[puzzleId] = changedEntries;
        }

        const { error } = await supabase
            .from("site_settings")
            .upsert({ key: CROSSWORD_OVERRIDES_KEY, value: nextOverrides }, { onConflict: "key" });

        if (error) throw error;

        revalidatePath("/", "layout");
        revalidatePath("/games/crossword");
        revalidatePath("/admin/games");

        return noStoreJson({
            ok: true,
            puzzle: validatedPuzzle,
            overridesSaved: changedEntries.length,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not save crossword puzzle.";
        const status = message.includes("missing") || message.includes("invalid") || message.includes("too long")
            ? 400
            : 500;
        return noStoreJson({ error: message }, { status });
    }
}
