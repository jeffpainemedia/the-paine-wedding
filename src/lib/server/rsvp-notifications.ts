import { Resend } from "resend";

type ImmediateRsvpNotification = {
    eventType: "submitted" | "updated";
    actorName: string;
    householdName: string;
    changeSummary: string | null;
    attendingCount: number;
    declinedCount: number;
    pendingCount: number;
    songRequest: string | null;
    advice: string | null;
};

type ViewedDigestItem = {
    id: string;
    recordedAt: string;
    guestName: string;
    householdName: string;
};

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) return null;
    return new Resend(apiKey);
}

function getFromEmail() {
    return (
        process.env.RESEND_FROM_EMAIL?.trim() ||
        process.env.EMAIL_FROM?.trim() ||
        null
    );
}

function getAlertRecipients() {
    const raw =
        process.env.RSVP_ALERT_EMAILS?.trim() ||
        process.env.RSVP_ALERT_EMAIL?.trim() ||
        process.env.ADMIN_ALERT_EMAIL?.trim() ||
        "";

    const recipients = raw
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

    return recipients.length > 0 ? recipients : null;
}

function isConfigured() {
    return Boolean(getResendClient() && getFromEmail() && getAlertRecipients());
}

function summarizeAttendance(attendingCount: number, declinedCount: number, pendingCount: number) {
    const parts: string[] = [];
    if (attendingCount > 0) parts.push(`${attendingCount} attending`);
    if (declinedCount > 0) parts.push(`${declinedCount} declined`);
    if (pendingCount > 0) parts.push(`${pendingCount} pending`);
    return parts.join(", ") || "No RSVP status changes";
}

export async function sendImmediateRsvpNotification(payload: ImmediateRsvpNotification) {
    if (!isConfigured()) return { sent: false, reason: "missing_config" } as const;

    const resend = getResendClient();
    const from = getFromEmail();
    const to = getAlertRecipients();
    if (!resend || !from || !to) return { sent: false, reason: "missing_config" } as const;

    const actionLabel = payload.eventType === "submitted" ? "RSVP Submitted" : "RSVP Updated";
    const summary = summarizeAttendance(payload.attendingCount, payload.declinedCount, payload.pendingCount);
    const subject = `${actionLabel}: ${payload.actorName}`;

    const detailLines = [
        `Guest: ${payload.actorName}`,
        `Household: ${payload.householdName}`,
        `Summary: ${summary}`,
        payload.changeSummary ? `Changes: ${payload.changeSummary}` : null,
        payload.songRequest ? `Song request: ${payload.songRequest}` : null,
        payload.advice ? `Advice: ${payload.advice}` : null,
        `Time: ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })} Central`,
    ].filter(Boolean);

    await resend.emails.send({
        from,
        to,
        subject,
        text: detailLines.join("\n"),
    });

    return { sent: true } as const;
}

export async function sendViewedDigestNotification(items: ViewedDigestItem[]) {
    if (items.length === 0) return { sent: false, reason: "no_items" } as const;
    if (!isConfigured()) return { sent: false, reason: "missing_config" } as const;

    const resend = getResendClient();
    const from = getFromEmail();
    const to = getAlertRecipients();
    if (!resend || !from || !to) return { sent: false, reason: "missing_config" } as const;

    const lines = items.map((item) => {
        const when = new Date(item.recordedAt).toLocaleString("en-US", { timeZone: "America/Chicago" });
        return `- ${item.guestName} (${item.householdName}) viewed RSVP on ${when} Central`;
    });

    await resend.emails.send({
        from,
        to,
        subject: `Weekly RSVP View Digest (${items.length})`,
        text: [
            "Here is your weekly digest of RSVP invitation views that have not been emailed yet.",
            "",
            ...lines,
        ].join("\n"),
    });

    return { sent: true } as const;
}
