import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { noStoreJson } from "@/lib/server/request-security";
import { sendViewedDigestNotification } from "@/lib/server/rsvp-notifications";

function isAuthorized(request: NextRequest) {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) return false;
    return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("rsvp_history")
        .select("id, recorded_at, guests:guests!rsvp_history_guest_id_fkey(first_name, last_name, suffix), households(name)")
        .eq("event_type", "viewed")
        .is("notification_sent_at", null)
        .order("recorded_at", { ascending: true })
        .limit(250);

    if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
    }

    const items = (data ?? []).map((row) => {
        const guestRelation = Array.isArray(row.guests) ? row.guests[0] : row.guests;
        const householdRelation = Array.isArray(row.households) ? row.households[0] : row.households;

        return {
            id: row.id as string,
            recordedAt: row.recorded_at as string,
            guestName: [guestRelation?.first_name, guestRelation?.last_name, guestRelation?.suffix].filter(Boolean).join(" "),
            householdName: householdRelation?.name ?? "Unknown household",
        };
    });

    if (items.length === 0) {
        return noStoreJson({ ok: true, sent: false, count: 0 });
    }

    const result = await sendViewedDigestNotification(items);
    if (!result.sent) {
        return noStoreJson({ ok: true, sent: false, reason: result.reason, count: items.length });
    }

    const { error: updateError } = await supabase
        .from("rsvp_history")
        .update({ notification_sent_at: new Date().toISOString() })
        .in("id", items.map((item) => item.id));

    if (updateError) {
        return noStoreJson({ error: updateError.message }, { status: 500 });
    }

    return noStoreJson({ ok: true, sent: true, count: items.length });
}
