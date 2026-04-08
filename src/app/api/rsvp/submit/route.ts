import { NextRequest } from "next/server";
import { verifyRSVPAccessToken } from "@/lib/rsvp/access-token";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";
import { sendImmediateRsvpNotification } from "@/lib/server/rsvp-notifications";

type GuestResponse = {
    attending: boolean | null;
    food_allergies: string;
    firstName: string;
    lastName: string;
    nameEdited: boolean;
};

type Guest = {
    id: string;
    first_name: string;
    last_name: string;
    household_id: string;
    attending: boolean | null;
    food_allergies: string | null;
    song_request: string | null;
    advice: string | null;
    is_plus_one: boolean;
    plus_one_for_id: string | null;
    plus_one_allowed?: boolean | null;
    plus_one_name?: string | null;
    plus_one_claimed?: boolean | null;
    updated_at: string;
};

function getUniqueChangeSummary(parts: string[]) {
    return [...new Set(parts.filter(Boolean))].join(" • ") || null;
}

function getTrimmedOptionalText(value: unknown, maxLength: number, label: string) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed) return null;
    if (trimmed.length > maxLength) {
        throw new Error(`${label} is too long.`);
    }
    return trimmed;
}

export async function POST(request: NextRequest) {
    const rateLimitResponse = await enforceRateLimit(request, {
        bucket: "rsvp-submit",
        limit: 8,
        windowSeconds: 60 * 10,
        message: "Too many RSVP submissions. Please wait a moment and try again.",
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = (await request.json()) as {
        accessToken?: unknown;
        responses?: Record<string, GuestResponse>;
        songRequest?: unknown;
        advice?: unknown;
        versions?: Record<string, string>;
    };

    const accessToken = typeof body.accessToken === "string" ? body.accessToken : undefined;

    if (!accessToken || !body.responses || !body.versions) {
        return noStoreJson({ error: "Missing RSVP payload." }, { status: 400 });
    }

    const verified = verifyRSVPAccessToken(accessToken);
    if (!verified) {
        return noStoreJson(
            { error: "Your RSVP session has expired. Please search for your invitation again." },
            { status: 401 },
        );
    }

    let songRequest: string | null = null;
    let advice: string | null = null;
    try {
        songRequest = getTrimmedOptionalText(body.songRequest, 160, "Song request");
        advice = getTrimmedOptionalText(body.advice, 1200, "Advice");
    } catch (error) {
        return noStoreJson(
            { error: error instanceof Error ? error.message : "Invalid RSVP details." },
            { status: 400 },
        );
    }

    const sb = getServiceClient();
    const { data: guests, error: guestError } = await sb
        .from("guests")
        .select("*")
        .eq("household_id", verified.householdId);

    if (guestError || !guests) {
        return noStoreJson({ error: "Could not load your invitation." }, { status: 500 });
    }

    const typedGuests = guests as Guest[];
    const matchedGuest = typedGuests.find((guest) => guest.id === verified.guestId && !guest.is_plus_one);
    if (!matchedGuest) {
        return noStoreJson(
            { error: "Your invitation changed since your last visit. Please search again before submitting." },
            { status: 409 },
        );
    }

    const { data: household } = await sb
        .from("households")
        .select("name")
        .eq("id", verified.householdId)
        .single();

    const hasConflict = typedGuests.some((guest) => body.versions?.[guest.id] !== guest.updated_at);
    if (hasConflict) {
        return noStoreJson(
            {
                error:
                    "Your invitation was updated while you were viewing it. Please refresh and review the latest details before submitting.",
            },
            { status: 409 },
        );
    }

    const primaryGuests = typedGuests.filter((guest) => !guest.is_plus_one);
    const plusOneGuests = typedGuests.filter((guest) => guest.is_plus_one);
    const hasSubmittedBefore =
        primaryGuests.some((guest) => guest.attending !== null) ||
        plusOneGuests.some((guest) => guest.plus_one_claimed === true) ||
        typedGuests.some((guest) => Boolean(guest.song_request || guest.advice || guest.food_allergies));
    const primaryAttendance = new Map<string, boolean | null>();
    const updates: Array<Record<string, unknown>> = [];
    const changeSummaryParts: string[] = [];

    try {
        for (const guest of primaryGuests) {
            const response = body.responses[guest.id];
            if (!response || response.attending === null) {
                return noStoreJson(
                    { error: `Please select Attending or Declined for ${guest.first_name}.` },
                    { status: 400 },
                );
            }

            const foodAllergies = getTrimmedOptionalText(
                response.food_allergies,
                300,
                `${guest.first_name}'s dietary restriction`,
            );

            if (guest.attending !== response.attending) {
                changeSummaryParts.push("Changed RSVP");
            }
            if ((guest.food_allergies ?? "") !== (foodAllergies ?? "")) {
                changeSummaryParts.push("Updated Dietary Info");
            }
            if ((guest.song_request ?? "") !== (songRequest ?? "")) {
                changeSummaryParts.push(songRequest ? "Updated Song Request" : "Removed Song Request");
            }
            if ((guest.advice ?? "") !== (advice ?? "")) {
                changeSummaryParts.push(advice ? "Updated Advice" : "Removed Advice");
            }

            primaryAttendance.set(guest.id, response.attending);
            updates.push({
                id: guest.id,
                first_name: guest.first_name,
                last_name: guest.last_name,
                household_id: guest.household_id,
                attending: response.attending,
                meal_choice: null,
                food_allergies: foodAllergies,
                song_request: songRequest,
                advice,
                viewed_rsvp: true,
                is_plus_one: false,
                plus_one_for_id: null,
                plus_one_claimed: false,
                plus_one_allowed: guest.plus_one_allowed ?? false,
                plus_one_name: guest.plus_one_name ?? null,
            });
        }

        for (const plusOneGuest of plusOneGuests) {
            const response = body.responses[plusOneGuest.id];
            const firstName = typeof response?.firstName === "string" ? response.firstName.trim() : "";
            const lastName = typeof response?.lastName === "string" ? response.lastName.trim() : "";
            const isNamed = Boolean(response?.nameEdited && firstName && lastName);
            const wasClaimed = plusOneGuest.plus_one_claimed === true;

            if (isNamed && firstName.length + lastName.length > 120) {
                return noStoreJson({ error: "Plus-one name is too long." }, { status: 400 });
            }

            const sponsoringGuestId = plusOneGuest.plus_one_for_id ?? "";
            const sponsoringGuestAttending = primaryAttendance.get(sponsoringGuestId);

            if (isNamed && response?.attending === null) {
                return noStoreJson(
                    { error: `Please select Attending or Declined for ${firstName}.` },
                    { status: 400 },
                );
            }

            if (isNamed && response?.attending === true && sponsoringGuestAttending !== true) {
                return noStoreJson(
                    { error: "A plus one can only attend if their invited guest is also attending." },
                    { status: 400 },
                );
            }

            const foodAllergies = isNamed
                ? getTrimmedOptionalText(
                      response?.food_allergies,
                      300,
                      `${firstName}'s dietary restriction`,
                  )
                : null;

            if (!wasClaimed && isNamed) {
                changeSummaryParts.push("Added Plus One");
            } else if (wasClaimed && !isNamed) {
                changeSummaryParts.push("Removed Plus One");
            } else if (wasClaimed && isNamed) {
                const previousName = `${plusOneGuest.first_name} ${plusOneGuest.last_name}`.trim();
                const nextName = `${firstName} ${lastName}`.trim();
                if (previousName !== nextName) {
                    changeSummaryParts.push("Updated Plus One");
                }
                if (plusOneGuest.attending !== (response?.attending ?? null)) {
                    changeSummaryParts.push("Updated Plus One RSVP");
                }
                if ((plusOneGuest.food_allergies ?? "") !== (foodAllergies ?? "")) {
                    changeSummaryParts.push("Updated Plus One Dietary Info");
                }
            }

            updates.push({
                id: plusOneGuest.id,
                first_name: isNamed ? firstName : plusOneGuest.first_name,
                last_name: isNamed ? lastName : plusOneGuest.last_name,
                household_id: plusOneGuest.household_id,
                attending: isNamed ? (response?.attending ?? null) : null,
                meal_choice: null,
                food_allergies: foodAllergies,
                song_request: isNamed ? songRequest : null,
                advice: isNamed ? advice : null,
                viewed_rsvp: isNamed,
                is_plus_one: true,
                plus_one_for_id: plusOneGuest.plus_one_for_id,
                plus_one_claimed: isNamed,
                plus_one_allowed: false,
                plus_one_name: null,
            });
        }
    } catch (error) {
        return noStoreJson(
            { error: error instanceof Error ? error.message : "Invalid RSVP details." },
            { status: 400 },
        );
    }

    for (const update of updates) {
        const { id, ...guestUpdate } = update;
        const { error: updateError } = await sb
            .from("guests")
            .update(guestUpdate)
            .eq("id", String(id));

        if (updateError) {
            return noStoreJson({ error: updateError.message }, { status: 500 });
        }
    }

    const eventGroupId = crypto.randomUUID();
    const changeSummary = getUniqueChangeSummary(changeSummaryParts);
    const historyRows = primaryGuests.map((guest) => ({
        guest_id: guest.id,
        actor_guest_id: verified.guestId,
        household_id: guest.household_id,
        event_type: hasSubmittedBefore ? "updated" : "submitted",
        event_group_id: eventGroupId,
        change_summary: changeSummary,
        attending: body.responses?.[guest.id]?.attending ?? null,
        food_allergies: body.responses?.[guest.id]?.food_allergies?.trim() || null,
        song_request: songRequest,
        advice,
    }));

    const { error: historyError } = await sb.from("rsvp_history").insert(historyRows);
    if (historyError) {
        return noStoreJson({ error: historyError.message }, { status: 500 });
    }

    const attendingCount = primaryGuests.filter((guest) => body.responses?.[guest.id]?.attending === true).length;
    const declinedCount = primaryGuests.filter((guest) => body.responses?.[guest.id]?.attending === false).length;
    const pendingCount = primaryGuests.length - attendingCount - declinedCount;

    void sendImmediateRsvpNotification({
        eventType: hasSubmittedBefore ? "updated" : "submitted",
        actorName: `${matchedGuest.first_name} ${matchedGuest.last_name}`.trim(),
        householdName: household?.name ?? "Unknown household",
        changeSummary,
        attendingCount,
        declinedCount,
        pendingCount,
        songRequest,
        advice,
    }).catch((error) => {
        console.error("Failed to send RSVP notification email:", error);
    });

    return noStoreJson({ ok: true });
}
