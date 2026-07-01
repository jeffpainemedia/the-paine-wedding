import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/server/supabase-admin";
import { SCHEDULE_AUTH_COOKIE, verifyScheduleToken } from "./auth";
import type { ScheduleAuthPayload, ScheduleEvent, ScheduleSection, ScheduleTier } from "./types";

/** Get the current schedule auth payload from cookies (server-side). */
export async function getScheduleUser(): Promise<ScheduleAuthPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(SCHEDULE_AUTH_COOKIE)?.value;
        return verifyScheduleToken(token);
    } catch {
        return null;
    }
}

/** Fetch all tiers (sorted). */
export async function getAllTiers(): Promise<ScheduleTier[]> {
    const sb = getServiceClient();
    const { data } = await sb
        .from("schedule_tiers")
        .select("id, slug, label, sort_order, is_public")
        .order("sort_order");
    return (data ?? []) as ScheduleTier[];
}

/** Fetch the public tier. */
export async function getPublicTier(): Promise<ScheduleTier | null> {
    const sb = getServiceClient();
    const { data } = await sb
        .from("schedule_tiers")
        .select("id, slug, label, sort_order, is_public")
        .eq("is_public", true)
        .maybeSingle();
    return (data as ScheduleTier | null) ?? null;
}

/** Fetch every event across every tier (admin view). */
export async function getAllEvents(): Promise<ScheduleEvent[]> {
    const sb = getServiceClient();
    const { data } = await sb
        .from("schedule_events")
        .select("id, event_date, start_time, end_time, title, location, notes, sort_order")
        .order("start_time")
        .order("sort_order");
    return (data ?? []) as ScheduleEvent[];
}

/** Fetch events for a given tier id. */
export async function getEventsForTier(tierId: string): Promise<ScheduleEvent[]> {
    const sb = getServiceClient();

    // Step 1: get the event IDs visible to this tier
    const { data: visData } = await sb
        .from("schedule_event_visibility")
        .select("event_id")
        .eq("tier_id", tierId);

    const eventIds = (visData ?? []).map((r) => (r as { event_id: string }).event_id);
    if (eventIds.length === 0) return [];

    // Step 2: fetch those events directly — no join duplication possible
    const { data } = await sb
        .from("schedule_events")
        .select("id, event_date, start_time, end_time, title, location, notes, sort_order")
        .in("id", eventIds)
        .order("start_time")
        .order("sort_order");

    return (data ?? []) as ScheduleEvent[];
}

/** Group events into time-of-day sections. */
export function groupEventsBySections(events: ScheduleEvent[]): ScheduleSection[] {
    const sections: ScheduleSection[] = [];

    for (const event of events) {
        const hour = parseInt(event.start_time.slice(0, 2), 10);
        const label: ScheduleSection["label"] =
            hour >= 5 && hour < 12 ? "Morning"
            : hour >= 12 && hour < 17 ? "Afternoon"
            : hour >= 17 && hour < 23 ? "Evening"
            : "Late Night";

        const existing = sections.find((s) => s.label === label);
        if (existing) {
            existing.events.push(event);
        } else {
            sections.push({ label, events: [event] });
        }
    }

    return sections;
}

/** Format 24h time string to 12h display (e.g. "17:00" → "5:00 PM") */
export function formatTime(time: string): string {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** Format a time range */
export function formatTimeRange(start: string, end: string | null): string {
    if (!end) return formatTime(start);
    return `${formatTime(start)}–${formatTime(end)}`;
}
