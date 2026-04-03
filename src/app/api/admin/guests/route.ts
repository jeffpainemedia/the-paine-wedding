import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getServiceClient } from "@/lib/server/supabase-admin";
import { noStoreJson } from "@/lib/server/request-security";

async function verifyAdmin(): Promise<boolean> {
    return (await getAdminSession()) !== null;
}

function cleanOptionalText(value: unknown, maxLength: number) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.length > maxLength) {
        throw new Error(`Text is too long (max ${maxLength} characters).`);
    }
    return trimmed;
}

function cleanRequiredText(value: unknown, maxLength: number, label: string) {
    const cleaned = cleanOptionalText(value, maxLength);
    if (!cleaned) {
        throw new Error(`${label} is required.`);
    }
    return cleaned;
}

function derivePlusOnePlaceholderName(
    referenceName: string | null | undefined,
    fallbackLastName: string
) {
    const trimmed = referenceName?.trim() ?? "";
    if (!trimmed) {
        return { first_name: "Plus", last_name: "One" };
    }

    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
        return { first_name: parts[0], last_name: fallbackLastName };
    }

    return {
        first_name: parts.slice(0, -1).join(" "),
        last_name: parts.at(-1) ?? fallbackLastName,
    };
}

export async function GET() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getServiceClient();
    const { data, error } = await sb
        .from("guests")
        .select("*, households(id, name)")
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true });

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ guests: data ?? [] });
}

export async function POST(req: NextRequest) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
        householdName?: string;
        firstName?: string;
        lastName?: string;
        suffix?: string | null;
        nicknames?: string | null;
    };

    let householdName = "";
    let firstName = "";
    let lastName = "";
    try {
        householdName = cleanRequiredText(body.householdName, 120, "Household name");
        firstName = cleanRequiredText(body.firstName, 80, "First name");
        lastName = cleanRequiredText(body.lastName, 80, "Last name");
    } catch (error) {
        return noStoreJson(
            { error: error instanceof Error ? error.message : "Missing required fields" },
            { status: 400 },
        );
    }

    const sb = getServiceClient();
    let { data: household, error: householdLookupError } = await sb
        .from("households")
        .select("id")
        .eq("name", householdName)
        .maybeSingle();

    if (householdLookupError) {
        return noStoreJson({ error: householdLookupError.message }, { status: 500 });
    }

    if (!household) {
        const { data: createdHousehold, error: householdInsertError } = await sb
            .from("households")
            .insert({ name: householdName })
            .select("id")
            .single();

        if (householdInsertError) {
            return noStoreJson({ error: householdInsertError.message }, { status: 500 });
        }

        household = createdHousehold;
    }

    let duplicateQuery = sb
        .from("guests")
        .select("id")
        .eq("household_id", household.id)
        .eq("first_name", firstName)
        .eq("last_name", lastName);

    const suffix = cleanOptionalText(body.suffix, 30);
    duplicateQuery = suffix ? duplicateQuery.eq("suffix", suffix) : duplicateQuery.is("suffix", null);
    const { data: duplicateGuest, error: duplicateGuestError } = await duplicateQuery.maybeSingle();

    if (duplicateGuestError) {
        return noStoreJson({ error: duplicateGuestError.message }, { status: 500 });
    }
    if (duplicateGuest) {
        return noStoreJson(
            { error: "That guest already exists in this household." },
            { status: 409 },
        );
    }

    const { error } = await sb.from("guests").insert({
        first_name: firstName,
        last_name: lastName,
        suffix,
        nicknames: cleanOptionalText(body.nicknames, 120),
        household_id: household.id,
    });

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ ok: true });
}

// PATCH /api/admin/guests
// Body: { id: string, updates: Partial<GuestUpdateFields> }
//   OR: { household_id: string, attending: boolean | null }  — bulk household RSVP update
export async function PATCH(req: NextRequest) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
        // Single guest update
        id?: string;
        household_name?: string;
        target_household_name?: string;
        updates?: {
            first_name?: string;
            last_name?: string;
            suffix?: string | null;
            attending?: boolean | null;
            food_allergies?: string | null;
            dietary_restrictions?: string | null;
            song_request?: string | null;
            advice?: string | null;
            plus_one_name?: string | null;
            plus_one_allowed?: boolean;
            affiliation?: string | null;
            side?: string | null;
            likelihood?: string | null;
            viewed_rsvp?: boolean;
            is_plus_one?: boolean;
            plus_one_for_id?: string | null;
            plus_one_claimed?: boolean;
        };
        // Household bulk RSVP update
        household_id?: string;
        household_attending?: boolean | null;
        // Household bulk text field update (song_request / advice)
        household_field?: string;
        household_value?: string | null;
    };

    const sb = getServiceClient();

    // Bulk household RSVP update
    if (body.household_id && "household_attending" in body) {
        const { error } = await sb
            .from("guests")
            .update({
                attending: body.household_attending,
                viewed_rsvp: body.household_attending === null ? false : true,
            })
            .eq("household_id", body.household_id);

        if (error) {
            return noStoreJson({ error: error.message }, { status: 500 });
        }
        return noStoreJson({ ok: true });
    }

    // Bulk household text field update
    if (body.household_id && body.household_field) {
        const allowedHouseholdFields = ["song_request", "advice"];
        if (!allowedHouseholdFields.includes(body.household_field)) {
            return noStoreJson({ error: "Field not allowed for household update" }, { status: 400 });
        }
        const { error } = await sb
            .from("guests")
            .update({ [body.household_field]: body.household_value ?? null })
            .eq("household_id", body.household_id);

        if (error) {
            return noStoreJson({ error: error.message }, { status: 500 });
        }
        return noStoreJson({ ok: true });
    }

    // Single guest update
    if (!body.id || !body.updates) {
        return noStoreJson({ error: "Missing id or updates" }, { status: 400 });
    }

    const { data: currentGuest, error: currentGuestError } = await sb
        .from("guests")
        .select("id, household_id, first_name, last_name, plus_one_name, plus_one_allowed, is_plus_one, plus_one_for_id, plus_one_claimed")
        .eq("id", body.id)
        .single();

    if (currentGuestError || !currentGuest) {
        return noStoreJson({ error: currentGuestError?.message ?? "Guest not found" }, { status: 404 });
    }

    let resolvedHouseholdId = currentGuest.household_id;

    if (typeof body.target_household_name === "string") {
        const trimmedTargetHouseholdName = body.target_household_name.trim();
        if (!trimmedTargetHouseholdName) {
            return noStoreJson({ error: "Target household name is required." }, { status: 400 });
        }

        let { data: targetHousehold, error: targetHouseholdLookupError } = await sb
            .from("households")
            .select("id")
            .eq("name", trimmedTargetHouseholdName)
            .maybeSingle();

        if (targetHouseholdLookupError) {
            return noStoreJson({ error: targetHouseholdLookupError.message }, { status: 500 });
        }

        if (!targetHousehold) {
            const { data: createdTargetHousehold, error: targetHouseholdInsertError } = await sb
                .from("households")
                .insert({ name: trimmedTargetHouseholdName })
                .select("id")
                .single();

            if (targetHouseholdInsertError) {
                return noStoreJson({ error: targetHouseholdInsertError.message }, { status: 500 });
            }

            targetHousehold = createdTargetHousehold;
        }

        resolvedHouseholdId = targetHousehold.id;
    }

    if (body.household_id && typeof body.household_name === "string") {
        const trimmedName = body.household_name.trim();
        if (!trimmedName) {
            return noStoreJson({ error: "Household name is required." }, { status: 400 });
        }

        const { error: householdError } = await sb
            .from("households")
            .update({ name: trimmedName })
            .eq("id", body.household_id);

        if (householdError) {
            return noStoreJson({ error: householdError.message }, { status: 500 });
        }
    }

    // Whitelist the fields that can be edited
    const allowed = [
        "first_name", "last_name", "suffix", "attending",
        "food_allergies", "dietary_restrictions", "song_request", "advice",
        "plus_one_name", "plus_one_allowed", "affiliation", "side", "likelihood",
        "viewed_rsvp", "is_plus_one", "plus_one_for_id", "plus_one_claimed",
    ];
    const sanitized: Record<string, unknown> = {};
    for (const key of allowed) {
        if (key in body.updates) {
            const rawValue = body.updates[key as keyof typeof body.updates];
            if (
                key === "first_name" ||
                key === "last_name" ||
                key === "suffix" ||
                key === "plus_one_name" ||
                key === "food_allergies" ||
                key === "dietary_restrictions" ||
                key === "song_request" ||
                key === "advice" ||
                key === "affiliation" ||
                key === "side" ||
                key === "likelihood"
            ) {
                const maxLengthByField: Record<string, number> = {
                    first_name: 80,
                    last_name: 80,
                    suffix: 30,
                    plus_one_name: 120,
                    food_allergies: 300,
                    dietary_restrictions: 300,
                    song_request: 160,
                    advice: 1200,
                    affiliation: 40,
                    side: 40,
                    likelihood: 40,
                };
                const cleaned = cleanOptionalText(rawValue, maxLengthByField[key]);
                if ((key === "first_name" || key === "last_name") && !cleaned) {
                    return noStoreJson({ error: `${key.replace("_", " ")} is required.` }, { status: 400 });
                }
                sanitized[key] = cleaned;
                continue;
            }

            sanitized[key] = rawValue;
        }
    }

    if (Object.keys(sanitized).length === 0) {
        return noStoreJson({ error: "No valid fields to update" }, { status: 400 });
    }

    const isConvertingPlusOneToPrimary =
        currentGuest.is_plus_one && body.updates.is_plus_one === false;

    const nextIsPlusOne =
        "is_plus_one" in body.updates
            ? Boolean(body.updates.is_plus_one)
            : currentGuest.is_plus_one;
    const nextPlusOneForId =
        "plus_one_for_id" in body.updates
            ? typeof body.updates.plus_one_for_id === "string" && body.updates.plus_one_for_id.trim()
                ? body.updates.plus_one_for_id.trim()
                : null
            : currentGuest.plus_one_for_id;

    if (nextIsPlusOne && !nextPlusOneForId) {
        return noStoreJson({ error: "A plus-one guest must be linked to an invited guest." }, { status: 400 });
    }

    if (!nextIsPlusOne && nextPlusOneForId) {
        return noStoreJson(
            { error: "Only plus-one guests can be linked to an invited guest." },
            { status: 400 },
        );
    }

    if (nextPlusOneForId === body.id) {
        return noStoreJson({ error: "A guest cannot be linked as their own plus one." }, { status: 400 });
    }

    if (isConvertingPlusOneToPrimary) {
        sanitized.plus_one_allowed = false;
        sanitized.plus_one_name = null;
        sanitized.plus_one_for_id = null;
        sanitized.plus_one_claimed = false;
    }

    if (nextIsPlusOne) {
        sanitized.plus_one_allowed = false;
        sanitized.plus_one_name = null;
        sanitized.plus_one_for_id = nextPlusOneForId;
    }

    if (resolvedHouseholdId !== currentGuest.household_id) {
        sanitized.household_id = resolvedHouseholdId;
    }

    if (
        !currentGuest.is_plus_one &&
        (
            "plus_one_allowed" in body.updates ||
            "plus_one_name" in body.updates ||
            "last_name" in body.updates ||
            resolvedHouseholdId !== currentGuest.household_id
        )
    ) {
        const nextPlusOneAllowed = "plus_one_allowed" in body.updates
            ? Boolean(body.updates.plus_one_allowed)
            : currentGuest.plus_one_allowed;
        const nextLastName =
            typeof body.updates.last_name === "string" && body.updates.last_name.trim()
                ? body.updates.last_name.trim()
                : currentGuest.last_name;
        const nextReferenceName =
            "plus_one_name" in body.updates
                ? body.updates.plus_one_name
                : currentGuest.plus_one_name;

        const { data: existingPlusOnes, error: existingPlusOnesError } = await sb
            .from("guests")
            .select("id, plus_one_claimed")
            .eq("plus_one_for_id", currentGuest.id)
            .eq("is_plus_one", true);

        if (existingPlusOnesError) {
            return noStoreJson({ error: existingPlusOnesError.message }, { status: 500 });
        }

        if (!nextPlusOneAllowed) {
            if (existingPlusOnes && existingPlusOnes.length > 0) {
                const { error: deletePlusOneError } = await sb
                    .from("guests")
                    .delete()
                    .in("id", existingPlusOnes.map((guest) => guest.id));

                if (deletePlusOneError) {
                    return noStoreJson({ error: deletePlusOneError.message }, { status: 500 });
                }
            }
        } else {
            const placeholder = derivePlusOnePlaceholderName(nextReferenceName, nextLastName);

            if (!existingPlusOnes || existingPlusOnes.length === 0) {
                const { error: createPlusOneError } = await sb.from("guests").insert({
                    household_id: resolvedHouseholdId,
                    first_name: placeholder.first_name,
                    last_name: placeholder.last_name,
                    is_plus_one: true,
                    plus_one_for_id: currentGuest.id,
                    plus_one_claimed: false,
                    plus_one_allowed: false,
                });

                if (createPlusOneError) {
                    return noStoreJson({ error: createPlusOneError.message }, { status: 500 });
                }
            } else {
                const existingPlusOneIds = existingPlusOnes.map((guest) => guest.id);
                if (resolvedHouseholdId !== currentGuest.household_id) {
                    const { error: movePlusOneError } = await sb
                        .from("guests")
                        .update({ household_id: resolvedHouseholdId })
                        .in("id", existingPlusOneIds);

                    if (movePlusOneError) {
                        return noStoreJson({ error: movePlusOneError.message }, { status: 500 });
                    }
                }

                const unclaimedPlusOneIds = existingPlusOnes
                    .filter((guest) => !guest.plus_one_claimed)
                    .map((guest) => guest.id);

                if (unclaimedPlusOneIds.length > 0) {
                    const { error: syncPlusOneError } = await sb
                        .from("guests")
                        .update({
                            first_name: placeholder.first_name,
                            last_name: placeholder.last_name,
                        })
                        .in("id", unclaimedPlusOneIds);

                    if (syncPlusOneError) {
                        return noStoreJson({ error: syncPlusOneError.message }, { status: 500 });
                    }
                }
            }
        }
    }

    if (isConvertingPlusOneToPrimary && currentGuest.plus_one_for_id) {
        const { data: remainingLinkedPlusOnes, error: remainingLinkedPlusOnesError } = await sb
            .from("guests")
            .select("id")
            .eq("plus_one_for_id", currentGuest.plus_one_for_id)
            .eq("is_plus_one", true)
            .neq("id", currentGuest.id);

        if (remainingLinkedPlusOnesError) {
            return noStoreJson({ error: remainingLinkedPlusOnesError.message }, { status: 500 });
        }

        if (!remainingLinkedPlusOnes || remainingLinkedPlusOnes.length === 0) {
            const { error: detachFormerPrimaryError } = await sb
                .from("guests")
                .update({
                    plus_one_allowed: false,
                    plus_one_name: null,
                })
                .eq("id", currentGuest.plus_one_for_id);

            if (detachFormerPrimaryError) {
                return noStoreJson({ error: detachFormerPrimaryError.message }, { status: 500 });
            }
        }
    }

    const { error } = await sb
        .from("guests")
        .update(sanitized)
        .eq("id", body.id);

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ ok: true });
}

// DELETE /api/admin/guests?id=<uuid>
export async function DELETE(req: NextRequest) {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        return noStoreJson({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return noStoreJson({ error: "Missing id" }, { status: 400 });
    }

    const sb = getServiceClient();
    const { data: guest, error: guestLookupError } = await sb
        .from("guests")
        .select("id, is_plus_one")
        .eq("id", id)
        .single();

    if (guestLookupError || !guest) {
        return noStoreJson({ error: guestLookupError?.message ?? "Guest not found" }, { status: 404 });
    }

    if (!guest.is_plus_one) {
        const { data: linkedPlusOnes, error: linkedPlusOnesError } = await sb
            .from("guests")
            .select("id")
            .eq("plus_one_for_id", id)
            .eq("is_plus_one", true);

        if (linkedPlusOnesError) {
            return noStoreJson({ error: linkedPlusOnesError.message }, { status: 500 });
        }

        if (linkedPlusOnes && linkedPlusOnes.length > 0) {
            const { error: deleteLinkedPlusOnesError } = await sb
                .from("guests")
                .delete()
                .in("id", linkedPlusOnes.map((plusOne) => plusOne.id));

            if (deleteLinkedPlusOnesError) {
                return noStoreJson({ error: deleteLinkedPlusOnesError.message }, { status: 500 });
            }
        }
    }

    const { error } = await sb.from("guests").delete().eq("id", id);

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ ok: true });
}
