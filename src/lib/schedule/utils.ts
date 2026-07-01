import type { ScheduleEvent, ScheduleSection } from "./types";

export function formatTime(time: string): string {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatTimeRange(start: string, end: string | null): string {
    if (!end) return formatTime(start);
    return `${formatTime(start)}–${formatTime(end)}`;
}

export function groupEventsBySections(events: ScheduleEvent[]): ScheduleSection[] {
    const order: ScheduleSection["label"][] = ["Morning", "Afternoon", "Evening", "Late Night"];
    const map = new Map<ScheduleSection["label"], ScheduleEvent[]>();

    for (const event of events) {
        const h = parseInt(event.start_time.slice(0, 2), 10);
        const label: ScheduleSection["label"] =
            h >= 5 && h < 12 ? "Morning"
            : h >= 12 && h < 17 ? "Afternoon"
            : h >= 17 && h < 23 ? "Evening"
            : "Late Night";

        const arr = map.get(label) ?? [];
        arr.push(event);
        map.set(label, arr);
    }

    return order.filter((l) => map.has(l)).map((label) => ({ label, events: map.get(label)! }));
}
