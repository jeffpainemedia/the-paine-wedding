"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SignInPopover from "./SignInPopover";
import TierBadge from "./TierBadge";
import type { ScheduleEvent, ScheduleSection } from "@/lib/schedule/types";
import { formatTimeRange, groupEventsBySections } from "@/lib/schedule/utils";

const CACHE_KEY = "schedule-cache-v1";

type CachedSchedule = {
    events: ScheduleEvent[];
    tierSlug: string;
    savedAt: number;
};

type AuthState = {
    displayName: string;
    tierLabel: string;
    roleLabel: string;
} | null;


function SectionPill({ label }: { label: string }) {
    return (
        <div className="my-8 flex items-center gap-4 print:my-4">
            <div className="h-px flex-1 bg-accent/25" />
            <span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-[10px] uppercase tracking-[0.3em] text-accent">
                {label}
            </span>
            <div className="h-px flex-1 bg-accent/25" />
        </div>
    );
}

function EventRow({ event }: { event: ScheduleEvent }) {
    const timeStr = formatTimeRange(event.start_time, event.end_time);
    return (
        <div className="group relative flex gap-5 py-5 md:gap-8 print:py-3 print:gap-4">
            {/* Timeline spine */}
            <div className="relative flex flex-col items-center print:hidden">
                <div className="mt-1.5 h-3 w-3 rounded-full border-2 border-accent bg-white ring-4 ring-surface" />
                <div className="mt-1 flex-1 w-px bg-primary/10" />
            </div>

            {/* Time */}
            <div className="w-28 shrink-0 pt-0.5 text-right md:w-32 print:w-24">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-accent print:text-[10px]">
                    {timeStr}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
                <p className="font-heading text-lg text-primary leading-snug md:text-xl print:text-base">
                    {event.title}
                </p>
                {event.location && (
                    <p className="mt-1 text-xs uppercase tracking-[0.15em] text-text-secondary print:text-[10px]">
                        {event.location}
                    </p>
                )}
                {event.notes && (
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary print:text-xs">
                        {event.notes}
                    </p>
                )}
            </div>
        </div>
    );
}

type Props = {
    initialEvents: ScheduleEvent[];
    initialTierSlug: string;
    initialAuth: AuthState;
};

export default function ScheduleClient({ initialEvents, initialTierSlug, initialAuth }: Props) {
    const [auth, setAuth] = useState<AuthState>(initialAuth);
    const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);
    const [isOffline, setIsOffline] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const fetchedRef = useRef(false);

    // Register service worker
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            void navigator.serviceWorker.register("/sw-schedule.js", { scope: "/schedule" }).catch(() => { /* non-fatal */ });
        }
    }, []);

    // Check online status
    useEffect(() => {
        const update = () => setIsOffline(!navigator.onLine);
        update();
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);

    // Load from localStorage cache on mount
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(CACHE_KEY);
            if (raw) {
                const cached = JSON.parse(raw) as CachedSchedule;
                // Only use cache if same tier
                if (cached.tierSlug === initialTierSlug && cached.events.length > 0) {
                    setLastUpdated(new Date(cached.savedAt));
                }
            }
        } catch { /* non-fatal */ }
    }, [initialTierSlug]);

    // Fetch fresh events and update cache
    const refreshEvents = useCallback(async () => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        try {
            const res = await fetch("/api/schedule/events", { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json() as { events: ScheduleEvent[]; tierSlug: string };
            setEvents(data.events);
            const now = Date.now();
            setLastUpdated(new Date(now));
            const cached: CachedSchedule = { events: data.events, tierSlug: data.tierSlug, savedAt: now };
            window.localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
        } catch { /* offline — use initial data */ }
    }, []);

    useEffect(() => {
        void refreshEvents();
    }, [refreshEvents]);

    async function handleSignedIn(displayName: string, tierLabel: string) {
        // Fetch user details for roleLabel
        try {
            const res = await fetch("/api/schedule/auth", { credentials: "include" });
            const data = await res.json() as { user?: { displayName: string; tierLabel: string; roleLabel: string } };
            setAuth({
                displayName: data.user?.displayName ?? displayName,
                tierLabel: data.user?.tierLabel ?? tierLabel,
                roleLabel: data.user?.roleLabel ?? "",
            });
        } catch {
            setAuth({ displayName, tierLabel, roleLabel: "" });
        }
        // Reload events for new tier
        fetchedRef.current = false;
        await refreshEvents();
    }

    async function handleLogout() {
        await fetch("/api/schedule/auth", { method: "DELETE", credentials: "include" });
        setAuth(null);
        window.localStorage.removeItem(CACHE_KEY);
        // Reload to public view
        window.location.reload();
    }

    function handlePrint() {
        window.print();
    }

    // Public visitors get a single flat list — sections only kick in for
    // signed-in viewers whose schedule spans the whole day.
    const sections = auth ? groupEventsBySections(events) : [];
    const showSections = sections.length > 1;

    return (
        <div>
            {/* Auth bar */}
            <div className="flex items-center justify-between mb-8 print:hidden">
                <div>
                    {auth ? (
                        <TierBadge
                            displayName={auth.displayName}
                            tierLabel={auth.tierLabel}
                            roleLabel={auth.roleLabel}
                            onLogout={() => void handleLogout()}
                        />
                    ) : (
                        <p className="text-xs text-text-secondary tracking-wide">
                            Bridal party?{" "}
                            <span className="text-primary">Sign in for your full schedule.</span>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrint}
                        title="Save as PDF — your browser will open a print dialog. Choose 'Save as PDF' as destination."
                        className="flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/60 px-3.5 py-2 text-[11px] uppercase tracking-[0.2em] text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
                    >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
                            <path d="M10 3v9m0 0-3-3m3 3 3-3M4 14v2a1 1 0 001 1h10a1 1 0 001-1v-2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Save PDF
                    </button>
                    {!auth && (
                        <SignInPopover onSignedIn={(d, t) => void handleSignedIn(d, t)} />
                    )}
                </div>
            </div>

            {/* Offline banner */}
            {isOffline && (
                <div className="mb-6 rounded-xl border border-accent/25 bg-accent/8 px-4 py-2.5 text-center text-xs text-accent print:hidden">
                    Offline{lastUpdated ? ` · Last updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                </div>
            )}

            {/* Timeline */}
            {events.length === 0 ? (
                <div className="py-16 text-center text-text-secondary">
                    <p className="font-heading text-2xl text-primary">Schedule coming soon</p>
                </div>
            ) : (
                <div>
                    {/* Print header — hidden on screen */}
                    <div className="hidden print:block mb-6 text-center">
                        <p className="font-heading text-3xl text-primary">Wedding Day Schedule</p>
                        <p className="text-sm text-text-secondary mt-1">Ashlyn & Jeffrey · September 26, 2026</p>
                        {auth && (
                            <p className="text-xs text-accent mt-1 uppercase tracking-widest">{auth.tierLabel} · {auth.displayName}</p>
                        )}
                    </div>

                    {showSections ? (
                        sections.map((section) => (
                            <div key={section.label}>
                                <SectionPill label={section.label} />
                                <div className="divide-y divide-primary/6 print:divide-primary/10">
                                    {section.events.map((event) => (
                                        <EventRow key={event.id} event={event} />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="divide-y divide-primary/6 print:divide-primary/10">
                            {events.map((event) => (
                                <EventRow key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
