import { NextRequest } from "next/server";
import { createRSVPAccessToken } from "@/lib/rsvp/access-token";
import { compactNamePart, nameSimilarity } from "@/lib/rsvp/name-matching";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { enforceRateLimit, noStoreJson } from "@/lib/server/request-security";

type SearchableGuest = {
    id: string;
    household_id: string;
    first_name: string;
    last_name: string;
    suffix: string | null;
    nicknames: string | null;
    is_plus_one: boolean;
};

type SearchResultPreview = {
    matchedName: string;
    matchedGuestId: string;
    accessToken: string;
    primaryGuestCount: number;
    householdLabel?: string;
};

function getDisplayHouseholdName(name: string): string {
    return name.replace(/\s+\d+\s*$/, "").trim();
}

function getNicknameTokens(rawNicknames: string | null | undefined) {
    return (rawNicknames || "")
        .split(/[,;\/]/)
        .map((name) => name.trim())
        .filter(Boolean);
}

function isExactFirstNameMatch(inputFirst: string, guest: SearchableGuest) {
    const normalizedInput = compactNamePart(inputFirst);
    const aliases = [guest.first_name, ...getNicknameTokens(guest.nicknames)];
    return aliases.some((alias) => compactNamePart(alias) === normalizedInput);
}

function formatMatchedName(guest: SearchableGuest) {
    const suffix = guest.suffix?.trim();
    return suffix
        ? `${guest.first_name} ${guest.last_name} ${suffix}`
        : `${guest.first_name} ${guest.last_name}`;
}

async function buildSearchPreview(
    sb: ReturnType<typeof getServiceClient>,
    guest: SearchableGuest,
    options?: { includeHouseholdLabel?: boolean },
): Promise<SearchResultPreview | null> {
    const [{ data: householdData }, { count: primaryGuestCount }] = await Promise.all([
        sb.from("households").select("name").eq("id", guest.household_id).single(),
        sb
            .from("guests")
            .select("id", { count: "exact", head: true })
            .eq("household_id", guest.household_id)
            .eq("is_plus_one", false),
    ]);

    if (!householdData || !primaryGuestCount) {
        return null;
    }

    return {
        matchedName: formatMatchedName(guest),
        matchedGuestId: guest.id,
        accessToken: createRSVPAccessToken(guest.household_id, guest.id),
        primaryGuestCount,
        householdLabel: options?.includeHouseholdLabel
            ? primaryGuestCount > 1
                ? getDisplayHouseholdName(householdData.name)
                : "Single invitation"
            : undefined,
    };
}

export async function POST(request: NextRequest) {
    const rateLimitResponse = await enforceRateLimit(request, {
        bucket: "rsvp-search",
        limit: 12,
        windowSeconds: 60,
        message: "Too many RSVP searches. Please wait a moment and try again.",
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = (await request.json()) as { firstName?: unknown; lastName?: unknown };
    const cleanFirst = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const cleanLast = typeof body.lastName === "string" ? body.lastName.trim() : "";

    if (!cleanFirst || !cleanLast) {
        return noStoreJson({ error: "Please enter both your first and last name." }, { status: 400 });
    }

    const sb = getServiceClient();
    const { data: allGuests, error: searchError } = await sb
        .from("guests")
        .select("id, household_id, first_name, last_name, suffix, nicknames, is_plus_one");

    if (searchError || !allGuests?.length) {
        return noStoreJson(
            { error: "There was an error communicating with the database. Please try again." },
            { status: 500 },
        );
    }

    const searchableGuests = (allGuests as SearchableGuest[]).filter((guest) => !guest.is_plus_one);
    const exactMatches = searchableGuests.filter(
        (guest) =>
            compactNamePart(guest.last_name) === compactNamePart(cleanLast) &&
            isExactFirstNameMatch(cleanFirst, guest),
    );

    if (exactMatches.length > 1) {
        const choiceResults = await Promise.all(
            exactMatches.map((guest) => buildSearchPreview(sb, guest, { includeHouseholdLabel: true })),
        );
        const choices = choiceResults.filter(Boolean);
        if (choices.length < 2) {
            const first = choices[0];
            if (first) return noStoreJson(first);
            return noStoreJson({ error: "Could not load your invitation. Please try again." }, { status: 500 });
        }
        return noStoreJson({ choices });
    }

    const scored = searchableGuests
        .map((guest) => {
            const nicknameScores = getNicknameTokens(guest.nicknames).map((nickname) =>
                nameSimilarity(cleanFirst, nickname),
            );
            const firstScore = Math.max(
                nameSimilarity(cleanFirst, guest.first_name),
                ...(nicknameScores.length ? nicknameScores : [0]),
            );
            const lastScore = nameSimilarity(cleanLast, guest.last_name);
            return { guest, combinedScore: firstScore * lastScore };
        })
        .sort((a, b) => b.combinedScore - a.combinedScore);

    const THRESHOLD = 0.35;
    const EXACT_THRESHOLD = 0.72;
    const topMatch = exactMatches[0]
        ? { guest: exactMatches[0], combinedScore: 1 }
        : scored[0];
    const secondMatch = exactMatches[1] ? { guest: exactMatches[1], combinedScore: 1 } : scored[1];

    if (!topMatch || topMatch.combinedScore < THRESHOLD) {
        return noStoreJson(
            {
                error: "We couldn't find an invitation with that name. Double-check the spelling and try again.",
            },
            { status: 404 },
        );
    }

    if (
        !exactMatches.length &&
        secondMatch &&
        topMatch.combinedScore >= EXACT_THRESHOLD &&
        secondMatch.combinedScore >= EXACT_THRESHOLD &&
        Math.abs(topMatch.combinedScore - secondMatch.combinedScore) <= 0.03
    ) {
        const candidates = [topMatch.guest, secondMatch.guest];
        const choiceResults = await Promise.all(
            candidates.map((guest) => buildSearchPreview(sb, guest, { includeHouseholdLabel: true })),
        );
        const choices = choiceResults.filter(Boolean);
        if (choices.length >= 2) return noStoreJson({ choices });
    }

    if (topMatch.combinedScore < EXACT_THRESHOLD) {
        return noStoreJson(
            {
                error: "We couldn't find an invitation with that name. Double-check the spelling and try again.",
            },
            { status: 404 },
        );
    }

    const preview = await buildSearchPreview(sb, topMatch.guest);
    if (!preview) {
        return noStoreJson(
            { error: "We found your name, but couldn't load your invitation. Please try again." },
            { status: 500 },
        );
    }

    return noStoreJson(preview);
}
