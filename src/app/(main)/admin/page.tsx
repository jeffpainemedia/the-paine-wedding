"use client";

import React, { useEffect, useRef, useState } from "react";
import AdminFrame from "@/components/admin/AdminFrame";
import AdminLoginCard from "@/components/admin/AdminLoginCard";
import GuestEditDrawer from "@/components/admin/GuestEditDrawer";
import { useAdminSession } from "@/components/admin/useAdminSession";

type Guest = {
    id: string;
    first_name: string;
    last_name: string;
    suffix: string | null;
    nicknames: string | null;
    attending: boolean | null;
    meal_choice: string | null;
    food_allergies: string | null;
    dietary_restrictions: string | null;
    song_request: string | null;
    advice: string | null;
    plus_one_name: string | null;
    plus_one_allowed: boolean;
    affiliation: string | null;
    side: string | null;
    likelihood: string | null;
    viewed_rsvp: boolean;
    is_plus_one: boolean;
    plus_one_for_id: string | null;
    plus_one_claimed: boolean;
    // Already returned by the API (select("*, ...")) — exposed here so the
    // "Recently RSVPed" sort can use it. Read-only in the admin UI.
    updated_at?: string | null;
    households: { id: string; name: string };
};

type SortField = "name" | "household" | "rsvp" | "plusone" | "updated";
type SortDir = "asc" | "desc";
type HistorySortField = "when" | "guest" | "household" | "activity" | "dietary" | "song" | "advice";
type MobileViewMode = "sticky" | "accordion";

type RSVPHistoryEntry = {
    id: string;
    recorded_at: string;
    event_type: "submitted" | "viewed" | "updated";
    event_group_id: string;
    actor_guest_id: string | null;
    attending: boolean | null;
    change_summary: string | null;
    food_allergies: string | null;
    song_request: string | null;
    advice: string | null;
    guest_id: string;
    household_id: string;
    guests: { first_name: string; last_name: string; suffix: string | null; households: { name: string } | null } | null;
    households: { name: string } | null;
};

type HistoryGroup = {
    id: string;
    entryIds: string[];
    recordedAt: string;
    eventType: "submitted" | "viewed" | "updated";
    actorGuestId: string | null;
    actorName: string;
    people: string[];
    householdName: string;
    attending: boolean | null;
    changeSummary: string | null;
    foodAllergies: string | null;
    songRequest: string | null;
    advice: string | null;
};

type HistoryEditState = {
    ids: string[];
    recordedAt: string;
    eventType: "submitted" | "viewed" | "updated";
    activity: "attending" | "declined" | "updated";
    changeSummary: string;
    foodAllergies: string;
    songRequest: string;
    advice: string;
    label: string;
};

type RsvpPopover = {
    anchorRect: DOMRect;
    guestId?: string;
    householdId?: string;
    current: boolean | null;
    isPlusOne?: boolean;
    plusOneClaimed?: boolean;
};

type TextEdit = {
    anchorRect: DOMRect;
    guestId: string;
    field: string;
    value: string;
    multiline: boolean;
    label: string;
    householdId?: string;
};

function TruncatedText({ text, cellKey, expandedTexts, setExpandedTexts }: {
    text: string | null;
    cellKey: string;
    expandedTexts: Record<string, boolean>;
    setExpandedTexts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
    if (!text) return <span className="text-text-secondary/40">—</span>;
    const isExpanded = expandedTexts[cellKey];
    // Estimate if text is long enough to overflow 2 lines (~80 chars)
    const needsTruncation = text.length > 80;
    if (!needsTruncation) return <>{text}</>;
    return (
        <div className="relative">
            <div className={isExpanded ? undefined : "line-clamp-2"}>
                {text}
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); setExpandedTexts(prev => ({ ...prev, [cellKey]: !isExpanded })); }}
                className="mt-0.5 flex items-center gap-0.5 text-[10px] text-primary/50 hover:text-primary transition-colors"
            >
                <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                {isExpanded ? "collapse" : "expand"}
            </button>
        </div>
    );
}

function getHouseholdRsvpScore(guests: Guest[]): number {
    if (guests.some((g) => g.attending === true)) return 2;
    if (guests.every((g) => g.attending === false)) return 0;
    return 1;
}

function aggregateAttending(guests: Guest[]): boolean | null {
    if (guests.some((g) => g.attending === true)) return true;
    if (guests.every((g) => g.attending === false)) return false;
    return null;
}

function getGuestDisplayName(guest: Guest) {
    if (
        guest.is_plus_one &&
        !guest.plus_one_claimed &&
        ((guest.first_name === "Plus" && guest.last_name === "One") ||
            (guest.first_name === "Plus One" && !guest.last_name))
    ) {
        return "Plus One";
    }

    return [guest.first_name, guest.last_name].filter(Boolean).join(" ");
}

function getFullName(firstName: string | null | undefined, lastName: string | null | undefined, suffix?: string | null) {
    return [firstName, lastName, suffix].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function csvCell(value: unknown) {
    const text = value == null ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

function renderHouseholdDisplayName(householdName: string) {
    const match = householdName.match(/^(.*?)(\s+\d+)$/);
    if (!match) return householdName;

    return (
        <>
            {match[1]}
            <span className="whitespace-nowrap">{match[2]}</span>
        </>
    );
}

function getDefaultGuestSortValue(guest: Guest) {
    return `${guest.last_name} ${guest.first_name}`.toLowerCase();
}

function compareHouseholdGuests(a: Guest, b: Guest, sortField: SortField, sortDir: SortDir) {
    if (sortField === "rsvp") {
        const order = (g: Guest) => g.attending === true ? 0 : g.attending === null ? 1 : 2;
        const diff = order(a) - order(b);
        if (diff !== 0) return sortDir === "asc" ? diff : -diff;
    }

    const cmp = getDefaultGuestSortValue(a).localeCompare(getDefaultGuestSortValue(b));
    return sortDir === "asc" ? cmp : -cmp;
}

function getOrderedHouseholdGuests(householdGuests: Guest[], sortField: SortField, sortDir: SortDir) {
    const primaries = householdGuests
        .filter((guest) => !guest.is_plus_one)
        .sort((a, b) => compareHouseholdGuests(a, b, sortField, sortDir));

    const plusOnes = householdGuests.filter((guest) => guest.is_plus_one);
    const plusOnesByPrimaryId = new Map<string, Guest[]>();

    plusOnes.forEach((guest) => {
        const primaryId = guest.plus_one_for_id;
        if (!primaryId) return;
        const current = plusOnesByPrimaryId.get(primaryId) ?? [];
        current.push(guest);
        plusOnesByPrimaryId.set(primaryId, current);
    });

    plusOnesByPrimaryId.forEach((linkedPlusOnes) => {
        linkedPlusOnes.sort((a, b) => compareHouseholdGuests(a, b, "name", "asc"));
    });

    const attachedPrimaryIds = new Set(primaries.map((guest) => guest.id));
    const unattachedPlusOnes = plusOnes
        .filter((guest) => !guest.plus_one_for_id || !attachedPrimaryIds.has(guest.plus_one_for_id))
        .sort((a, b) => compareHouseholdGuests(a, b, "name", "asc"));

    const orderedGuests: Guest[] = [];
    primaries.forEach((primary) => {
        orderedGuests.push(primary);
        const linkedPlusOnes = plusOnesByPrimaryId.get(primary.id) ?? [];
        orderedGuests.push(...linkedPlusOnes);
    });

    orderedGuests.push(...unattachedPlusOnes);
    return orderedGuests;
}

function getPlusOneCompanionLabel(guest: Guest, householdGuests: Guest[]) {
    if (!guest.is_plus_one || !guest.plus_one_for_id) return null;
    const primaryGuest = householdGuests.find((householdGuest) => householdGuest.id === guest.plus_one_for_id);
    if (!primaryGuest) return null;
    return getGuestDisplayName(primaryGuest);
}

function RsvpBadge({
    attending,
    viewedRsvp,
    isPlusOne,
    plusOneClaimed,
    editable,
    onClick,
}: {
    attending: boolean | null;
    viewedRsvp?: boolean;
    isPlusOne?: boolean;
    plusOneClaimed?: boolean;
    editable?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
    const ring = editable ? "ring-2 ring-offset-1 ring-primary/20 cursor-pointer hover:ring-primary/50" : "";
    const base = `rounded px-2 py-1 text-xs transition-colors ${ring}`;

    if (isPlusOne && !plusOneClaimed && attending === null)
        return <button onClick={onClick} className={`${base} bg-gray-50 text-gray-500 border border-dashed border-gray-300`}>Not Added</button>;
    if (attending === true)
        return <button onClick={onClick} className={`${base} bg-green-50 text-green-700`}>Attending</button>;
    if (attending === false)
        return <button onClick={onClick} className={`${base} bg-red-50 text-red-700`}>Declined</button>;
    if (viewedRsvp)
        return <button onClick={onClick} className={`${base} bg-blue-50 text-blue-600`}>Viewed</button>;
    return <button onClick={onClick} className={`${base} bg-yellow-50 text-yellow-600`}>Pending</button>;
}

function ActionIconButton({
    label,
    active = false,
    onClick,
    children,
}: {
    label: string;
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className={`flex items-center justify-center rounded-full border px-2.5 py-2 transition-colors md:px-3 md:py-1.5 ${
                active
                    ? "border-primary bg-primary text-white"
                    : "border-primary/20 bg-white text-primary hover:bg-primary/5"
            }`}
        >
            <span aria-hidden>{children}</span>
            <span className="sr-only">{label}</span>
        </button>
    );
}

export default function AdminDashboard() {
    const STICKY_BAR_TOP = 96;
    const { status, role, login, logout } = useAdminSession();
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importText, setImportText] = useState("");
    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState("");
    const [envError, setEnvError] = useState(false);
    const [activeTab, setActiveTab] = useState<"guests" | "history">("guests");
    const [rsvpHistory, setRsvpHistory] = useState<RSVPHistoryEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [sortField, setSortField] = useState<SortField>("household");
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [historySortField, setHistorySortField] = useState<HistorySortField>("when");
    const [historySortDir, setHistorySortDir] = useState<SortDir>("desc");
    const [secondarySort, setSecondarySort] = useState(true);
    const [pageVisibility, setPageVisibility] = useState<Array<{ slug: string; label: string; hidden: boolean }>>([]);
    const [pagesLoading, setPagesLoading] = useState(false);
    const [pagesError, setPagesError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [guestSearch, setGuestSearch] = useState("");
    const [showGuestSearch, setShowGuestSearch] = useState(false);
    const [historySearch, setHistorySearch] = useState("");
    const [showHistorySearch, setShowHistorySearch] = useState(false);
    const [historyUnreadIds, setHistoryUnreadIds] = useState<string[]>([]);
    const [expandedHistoryIds, setExpandedHistoryIds] = useState<string[]>([]);
    const [historyEdit, setHistoryEdit] = useState<HistoryEditState | null>(null);
    const [historySaving, setHistorySaving] = useState(false);

    // Inline editing state
    const [rsvpPopover, setRsvpPopover] = useState<RsvpPopover | null>(null);
    const [textEdit, setTextEdit] = useState<TextEdit | null>(null);
    const [expandedTexts, setExpandedTexts] = useState<Record<string, boolean>>({});
    const [textEditValue, setTextEditValue] = useState("");
    const [textEditSaving, setTextEditSaving] = useState(false);
    const textInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const guestSearchInputRef = useRef<HTMLInputElement | null>(null);
    const historySearchInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
    const [showAddGuest, setShowAddGuest] = useState(false);
    const [newGuest, setNewGuest] = useState({
        householdName: "",
        firstName: "",
        lastName: "",
        suffix: "",
        nicknames: "",
    });
    const [addingGuest, setAddingGuest] = useState(false);
    const [addGuestError, setAddGuestError] = useState<string | null>(null);
    const [guestMobileView, setGuestMobileView] = useState<MobileViewMode>("accordion");
    const [historyMobileView, setHistoryMobileView] = useState<MobileViewMode>("accordion");
    const [expandedGuestAccordionIds, setExpandedGuestAccordionIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (status !== "authenticated") return;
        const timer = window.setTimeout(() => {
            void fetchData();
            void fetchPageVisibility();
            void fetchHistory();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [status]);

    // Focus input when text edit opens
    useEffect(() => {
        if (textEdit) {
            setTextEditValue(textEdit.value);
            setTimeout(() => {
                if (textInputRef.current) {
                    textInputRef.current.focus();
                    textInputRef.current.select();
                }
            }, 10);
        }
    }, [textEdit]);

    useEffect(() => {
        if (!showGuestSearch || activeTab !== "guests") return;
        const id = window.setTimeout(() => guestSearchInputRef.current?.focus(), 10);
        return () => window.clearTimeout(id);
    }, [showGuestSearch, activeTab]);

    useEffect(() => {
        if (!showHistorySearch || activeTab !== "history") return;
        const id = window.setTimeout(() => historySearchInputRef.current?.focus(), 10);
        return () => window.clearTimeout(id);
    }, [showHistorySearch, activeTab]);

    // Close popovers on Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setRsvpPopover(null);
                setTextEdit(null);
                setHistoryEdit(null);
            }
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    async function fetchPageVisibility() {
        setPagesLoading(true);
        setPagesError(null);
        try {
            const res = await fetch("/api/admin/page-visibility", { credentials: "same-origin" });
            if (!res.ok) throw new Error("Failed to load page visibility");
            const data = await res.json() as { pages: Array<{ slug: string; label: string; hidden: boolean }> };
            setPageVisibility(data.pages);
        } catch (e) {
            setPagesError(e instanceof Error ? e.message : "Unknown error");
        }
        setPagesLoading(false);
    }

    async function fetchHistory() {
        setHistoryLoading(true);
        try {
            const res = await fetch("/api/admin/rsvp-history", { credentials: "same-origin" });
            const data = await res.json() as { history?: RSVPHistoryEntry[]; error?: string };
            if (res.ok && data.history) setRsvpHistory(data.history);
        } catch { /* non-critical */ }
        setHistoryLoading(false);
    }

    function toLocalDateTimeValue(value: string) {
        const date = new Date(value);
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
    }

    function openHistoryEdit(group: HistoryGroup) {
        setHistoryEdit({
            ids: group.entryIds,
            recordedAt: toLocalDateTimeValue(group.recordedAt),
            eventType: group.eventType,
            activity:
                group.eventType === "viewed"
                    ? "updated"
                    : group.attending === true
                        ? "attending"
                        : group.attending === false
                            ? "declined"
                            : "updated",
            foodAllergies: group.foodAllergies ?? "",
            songRequest: group.songRequest ?? "",
            advice: group.advice ?? "",
            changeSummary: group.changeSummary ?? "",
            label: group.actorName,
        });
    }

    async function saveHistoryEdit() {
        if (!historyEdit) return;
        setHistorySaving(true);
        try {
            const attending =
                historyEdit.eventType === "viewed"
                    ? null
                    : historyEdit.activity === "attending"
                        ? true
                        : historyEdit.activity === "declined"
                            ? false
                            : null;

            const res = await fetch("/api/admin/rsvp-history", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: historyEdit.ids,
                    updates: {
                        recorded_at: historyEdit.recordedAt,
                        event_type: historyEdit.eventType,
                        attending,
                        change_summary: historyEdit.changeSummary,
                        food_allergies: historyEdit.foodAllergies,
                        song_request: historyEdit.songRequest,
                        advice: historyEdit.advice,
                    },
                }),
            });
            const data = await res.json() as { error?: string };
            if (!res.ok) throw new Error(data.error ?? "Could not update history.");

            setHistoryEdit(null);
            await fetchHistory();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not update history.");
        } finally {
            setHistorySaving(false);
        }
    }

    async function deleteHistoryGroup(group: HistoryGroup) {
        const label = group.actorName || "this entry";
        if (!window.confirm(`Delete ${label}'s history entry?`)) return;

        try {
            const res = await fetch("/api/admin/rsvp-history", {
                method: "DELETE",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: group.entryIds }),
            });
            const data = await res.json() as { error?: string };
            if (!res.ok) throw new Error(data.error ?? "Could not delete history.");

            setRsvpHistory((prev) => prev.filter((entry) => !group.entryIds.includes(entry.id)));
            markHistorySeen(group.id);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not delete history.");
        }
    }

    async function fetchData(options?: { preserveScroll?: boolean; silent?: boolean }) {
        const preserveScroll = options?.preserveScroll ?? false;
        const silent = options?.silent ?? false;
        const scrollY = preserveScroll ? window.scrollY : null;

        if (!silent) setLoading(true);
        const isMissingEnv =
            process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") ||
            !process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (isMissingEnv) {
            setEnvError(true);
            if (!silent) setLoading(false);
            return;
        }
        const res = await fetch("/api/admin/guests", { credentials: "same-origin" });
        const data = await res.json() as { guests?: Guest[]; error?: string };
        if (!res.ok) { setError(data.error ?? "Failed to load guests."); }
        else { setGuests(data.guests ?? []); setError(null); }
        if (!silent) setLoading(false);

        if (scrollY !== null) {
            window.requestAnimationFrame(() => {
                window.scrollTo({ top: scrollY, behavior: "auto" });
            });
        }
    }

    async function handleImport() {
        setImporting(true);
        setImportMessage("");
        const allRows = importText.split("\n").filter((row) => row.trim());
        const firstCell = (allRows[0] || "").split("\t")[0] || (allRows[0] || "").split(",")[0];
        const rows = firstCell.toLowerCase().includes("household") ? allRows.slice(1) : allRows;
        if (rows.length === 0) { setImportMessage("No data found."); setImporting(false); return; }
        let successCount = 0; let errorCount = 0;
        for (const row of rows) {
            const cols = row.split("\t").map((v) => v.trim());
            const finalCols = cols.length >= 3 ? cols : row.split(",").map((v) => v.trim());
            if (finalCols.length < 3) { errorCount++; continue; }
            const [householdName, firstName, lastName] = finalCols;
            const rawSuffix = (finalCols[3] || "").trim();
            const suffix = rawSuffix === "" || rawSuffix === "#N/A" ? null : rawSuffix;
            const rawNicknames = (finalCols[4] || "").trim();
            const nicknames = rawNicknames === "" || rawNicknames === "#N/A" ? null : rawNicknames;
            try {
                const res = await fetch("/api/admin/guests", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ householdName, firstName, lastName, suffix, nicknames }),
                });
                if (!res.ok) throw new Error("Import row failed");
                successCount++;
            } catch (err) { console.error(err); errorCount++; }
        }
        setImportMessage(`Import complete. Added ${successCount} guests.${errorCount > 0 ? ` Failed: ${errorCount} rows.` : ""}`);
        setImportText("");
        setImporting(false);
        void fetchData();
    }

    async function togglePageVisibility(slug: string, hidden: boolean) {
        setPageVisibility((prev) => prev.map((p) => (p.slug === slug ? { ...p, hidden } : p)));
        try {
            await fetch("/api/admin/page-visibility", {
                method: "POST", credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, hidden }),
            });
        } catch { void fetchPageVisibility(); }
    }

    function handleSort(field: SortField) {
        if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortField(field); setSortDir("asc"); }
    }

    // ── Inline edit helpers ──────────────────────────────────────────────────

    function openRsvp(e: React.MouseEvent, guest: Guest, householdId?: string) {
        if (!editMode) return;
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setRsvpPopover({
            anchorRect: rect,
            current: guest.attending,
            guestId: guest.id,
            isPlusOne: guest.is_plus_one,
            plusOneClaimed: guest.plus_one_claimed,
        });
    }

    function openHouseholdRsvp(e: React.MouseEvent, current: boolean | null, householdId: string) {
        if (!editMode) return;
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setRsvpPopover({ anchorRect: rect, current, householdId });
    }

    function openTextEdit(
        e: React.MouseEvent<HTMLElement>,
        guestId: string,
        field: string,
        value: string | null,
        label: string,
        multiline: boolean,
        householdId?: string
    ) {
        if (!editMode) return;
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setTextEdit({ anchorRect: rect, guestId, field, value: value ?? "", multiline, label, householdId });
    }

    async function saveRsvp(attending: boolean | null) {
        if (!rsvpPopover) return;
        try {
            if (rsvpPopover.guestId) {
                const viewedRsvp = attending === null ? false : true;
                await fetch("/api/admin/guests", {
                    method: "PATCH", credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: rsvpPopover.guestId, updates: { attending, viewed_rsvp: viewedRsvp } }),
                });
                setGuests((prev) => prev.map((g) => g.id === rsvpPopover.guestId ? { ...g, attending, viewed_rsvp: viewedRsvp } : g));
            } else if (rsvpPopover.householdId) {
                const viewedRsvp = attending === null ? false : true;
                await fetch("/api/admin/guests", {
                    method: "PATCH", credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ household_id: rsvpPopover.householdId, household_attending: attending }),
                });
                setGuests((prev) => prev.map((g) => g.households.id === rsvpPopover.householdId ? { ...g, attending, viewed_rsvp: viewedRsvp } : g));
            }
        } catch (err) { console.error(err); }
        setRsvpPopover(null);
    }

    async function saveText() {
        if (!textEdit) return;
        setTextEditSaving(true);
        const value = textEditValue.trim() || null;
        try {
            if (textEdit.householdId) {
                await fetch("/api/admin/guests", {
                    method: "PATCH", credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ household_id: textEdit.householdId, household_field: textEdit.field, household_value: value }),
                });
                setGuests((prev) => prev.map((g) => g.households.id === textEdit.householdId ? { ...g, [textEdit.field]: value } : g));
            } else {
                const updates: Record<string, string | null> = { [textEdit.field]: value };
                if (textEdit.field === "food_allergies" || textEdit.field === "dietary_restrictions") {
                    updates.food_allergies = value;
                    updates.dietary_restrictions = value;
                }
                await fetch("/api/admin/guests", {
                    method: "PATCH", credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: textEdit.guestId, updates }),
                });
                setGuests((prev) => prev.map((g) => g.id === textEdit.guestId ? { ...g, ...updates } : g));
            }
        } catch (err) { console.error(err); }
        setTextEditSaving(false);
        setTextEdit(null);
    }

    // ── Positioning helpers ──────────────────────────────────────────────────

    function rsvpPopoverStyle(rect: DOMRect): React.CSSProperties {
        const w = 170; const h = 130;
        let left = rect.left;
        let top = rect.bottom + 6;
        if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
        if (top + h > window.innerHeight - 8) top = rect.top - h - 6;
        return { position: "fixed", top, left, zIndex: 50, minWidth: w };
    }

    function textEditStyle(rect: DOMRect, multiline: boolean): React.CSSProperties {
        const w = Math.max(280, Math.min(rect.width, 420));
        const h = multiline ? 230 : 160;
        let left = rect.left;
        let top = rect.top;
        if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
        if (top + h > window.innerHeight - 8) top = Math.max(8, window.innerHeight - h - 8);
        return { position: "fixed", top, left, zIndex: 50, width: w };
    }

    // ── Sort / group ─────────────────────────────────────────────────────────

    function getGroupedHouseholds() {
        const map: Record<string, Guest[]> = {};
        for (const g of guests) {
            const n = g.households?.name || "Unknown";
            if (!map[n]) map[n] = [];
            map[n].push(g);
        }
        let entries = Object.entries(map).map(([householdName, householdGuests]) => ({ householdName, householdGuests }));
        if (sortField === "rsvp") {
            entries.sort((a, b) => {
                const sa = getHouseholdRsvpScore(a.householdGuests);
                const sb2 = getHouseholdRsvpScore(b.householdGuests);
                if (sa !== sb2) return sortDir === "asc" ? sb2 - sa : sa - sb2;
                return a.householdName.localeCompare(b.householdName);
            });
        } else if (sortField === "updated") {
            // Sort households by the most-recent updated_at among their guests.
            // Default direction is newest-first ("desc") so the freshest RSVPs
            // show at the top. Households whose guests have never been
            // updated fall to the bottom regardless of direction.
            const householdLastUpdate = (gs: Guest[]) =>
                gs.reduce((acc, g) => {
                    const t = g.updated_at ? Date.parse(g.updated_at) : 0;
                    return t > acc ? t : acc;
                }, 0);
            entries.sort((a, b) => {
                const ta = householdLastUpdate(a.householdGuests);
                const tb = householdLastUpdate(b.householdGuests);
                if (ta !== tb) return sortDir === "asc" ? ta - tb : tb - ta;
                return a.householdName.localeCompare(b.householdName);
            });
        } else if (sortField === "name") {
            for (const e of entries) e.householdGuests.sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`));
            entries.sort((a, b) => {
                const af = a.householdGuests[0]; const bf = b.householdGuests[0];
                const av = af ? `${af.last_name} ${af.first_name}` : "";
                const bv = bf ? `${bf.last_name} ${bf.first_name}` : "";
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            });
        } else {
            entries.sort((a, b) => sortDir === "asc" ? a.householdName.localeCompare(b.householdName) : b.householdName.localeCompare(a.householdName));
        }
        return entries;
    }

    function getSortedGuests() {
        return [...guests].sort((a, b) => {
            if (sortField === "rsvp") {
                const order = (g: Guest) => g.attending === true ? 0 : g.attending === null ? 1 : 2;
                return sortDir === "asc" ? order(a) - order(b) : order(b) - order(a);
            }
            if (sortField === "updated") {
                const ta = a.updated_at ? Date.parse(a.updated_at) : 0;
                const tb = b.updated_at ? Date.parse(b.updated_at) : 0;
                if (ta !== tb) return sortDir === "asc" ? ta - tb : tb - ta;
                return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
            }
            const vals: Record<SortField, string> = {
                name: `${a.last_name} ${a.first_name}`.toLowerCase(),
                household: (a.households?.name || "").toLowerCase(),
                plusone: (a.plus_one_name || "").toLowerCase(),
                rsvp: "",
                updated: "",
            };
            const valsB: Record<SortField, string> = {
                name: `${b.last_name} ${b.first_name}`.toLowerCase(),
                household: (b.households?.name || "").toLowerCase(),
                plusone: (b.plus_one_name || "").toLowerCase(),
                rsvp: "",
                updated: "",
            };
            const cmp = vals[sortField].localeCompare(valsB[sortField]);
            return sortDir === "asc" ? cmp : -cmp;
        });
    }

    const totalInvited = guests.length;
    const totalAttending = guests.filter((g) => g.attending === true).length;
    const totalDeclined = guests.filter((g) => g.attending === false).length;
    const totalPending = guests.filter((g) => g.attending === null).length;
    const groupByHousehold = secondarySort;
    const isGuestSearchVisible = activeTab === "guests" && (showGuestSearch || guestSearch.length > 0);
    const isHistorySearchVisible = activeTab === "history" && (showHistorySearch || historySearch.length > 0);
    const guestNameById = new Map(guests.map((guest) => [guest.id, getFullName(guest.first_name, guest.last_name, guest.suffix)]));
    const historyGroups = (() => {
        const grouped = new Map<string, HistoryGroup>();

        rsvpHistory.forEach((entry) => {
            const viewedDateKey = entry.recorded_at.slice(0, 10);
            const key =
                entry.event_type === "viewed"
                    ? `viewed:${entry.actor_guest_id ?? entry.guest_id}:${entry.household_id}:${viewedDateKey}`
                    : (entry.event_group_id || entry.id);
            const entryGuestName =
                entry.guests
                    ? getFullName(entry.guests.first_name, entry.guests.last_name, entry.guests.suffix)
                    : guestNameById.get(entry.guest_id) ?? "Unknown";
            const actorName =
                (entry.actor_guest_id ? guestNameById.get(entry.actor_guest_id) : null)
                ?? entryGuestName;
            const householdName = entry.households?.name ?? entry.guests?.households?.name ?? "—";
            const existing = grouped.get(key);

            if (!existing) {
                grouped.set(key, {
                    id: key,
                    entryIds: [entry.id],
                    recordedAt: entry.recorded_at,
                    eventType: entry.event_type ?? "submitted",
                    actorGuestId: entry.actor_guest_id ?? null,
                    actorName,
                    people: entryGuestName ? [entryGuestName] : [],
                    householdName,
                    attending: entry.attending,
                    changeSummary: entry.change_summary,
                    foodAllergies: entry.food_allergies,
                    songRequest: entry.song_request,
                    advice: entry.advice,
                });
                return;
            }

            if (!existing.entryIds.includes(entry.id)) {
                existing.entryIds.push(entry.id);
            }
            if (entryGuestName && !existing.people.includes(entryGuestName)) {
                existing.people.push(entryGuestName);
            }
            if (!existing.changeSummary && entry.change_summary) {
                existing.changeSummary = entry.change_summary;
            }
        });

        return [...grouped.values()].map((group) => {
            const others = group.people.filter((name) => name !== group.actorName);
            return {
                ...group,
                people: [group.actorName, ...others],
            };
        });
    })();
    const filteredHistoryGroups = historyGroups.filter((group) => {
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        return [
            group.actorName,
            group.householdName,
            group.eventType,
            group.changeSummary ?? "",
            group.foodAllergies ?? "",
            group.songRequest ?? "",
            group.advice ?? "",
            ...group.people,
        ].some((value) => value.toLowerCase().includes(q));
    });
    const sortedHistoryGroups = [...filteredHistoryGroups].sort((a, b) => {
        const activityRank = (group: HistoryGroup) => {
            if (group.eventType === "viewed") return 0;
            if (group.eventType === "updated") return 2;
            if (group.attending === true) return 3;
            if (group.attending === false) return 1;
            return 2;
        };

        const values: Record<HistorySortField, string | number> = {
            when: new Date(a.recordedAt).getTime(),
            guest: a.actorName.toLowerCase(),
            household: a.householdName.toLowerCase(),
            activity: activityRank(a),
            dietary: (a.foodAllergies ?? "").toLowerCase(),
            song: (a.songRequest ?? "").toLowerCase(),
            advice: (a.advice ?? "").toLowerCase(),
        };
        const valuesB: Record<HistorySortField, string | number> = {
            when: new Date(b.recordedAt).getTime(),
            guest: b.actorName.toLowerCase(),
            household: b.householdName.toLowerCase(),
            activity: activityRank(b),
            dietary: (b.foodAllergies ?? "").toLowerCase(),
            song: (b.songRequest ?? "").toLowerCase(),
            advice: (b.advice ?? "").toLowerCase(),
        };

        const valueA = values[historySortField];
        const valueB = valuesB[historySortField];
        const cmp = typeof valueA === "number" && typeof valueB === "number"
            ? valueA - valueB
            : String(valueA).localeCompare(String(valueB));

        if (cmp !== 0) {
            return historySortDir === "asc" ? cmp : -cmp;
        }

        const fallback = new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime();
        return historySortDir === "asc" ? fallback : -fallback;
    });
    const historyGroupIdsKey = historyGroups.map((group) => group.id).join("|");

    function SortIcon({ field }: { field: SortField }) {
        if (sortField !== field) return <span className="ml-1 text-gray-300 text-[10px]">↕</span>;
        return <span className="ml-1 text-primary text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>;
    }
    function HistorySortIcon({ field }: { field: HistorySortField }) {
        if (historySortField !== field) return <span className="ml-1 text-gray-300 text-[10px]">↕</span>;
        return <span className="ml-1 text-primary text-[10px]">{historySortDir === "asc" ? "↑" : "↓"}</span>;
    }
    function Th({ field, children, className = "" }: { field: SortField; children: React.ReactNode; className?: string }) {
        return (
            <th className={`px-6 py-4 font-normal cursor-pointer select-none hover:text-primary transition-colors whitespace-nowrap ${className}`} onClick={() => handleSort(field)}>
                {children}<SortIcon field={field} />
            </th>
        );
    }
    function handleHistorySort(field: HistorySortField) {
        if (historySortField === field) {
            setHistorySortDir((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setHistorySortField(field);
        setHistorySortDir(field === "when" ? "desc" : "asc");
    }

    const editCellCls = editMode ? "cursor-text hover:bg-primary/5 rounded transition-colors" : "";
    const editCellTitle = editMode ? "Click to edit" : undefined;
    const householdOptions = [...new Set(guests.map((g) => g.households?.name).filter(Boolean))].sort();
    const selectedGuest = selectedGuestId ? guests.find((g) => g.id === selectedGuestId) ?? null : null;

    useEffect(() => {
        if (activeTab !== "history") {
            setHistoryUnreadIds([]);
            return;
        }

        const storageKey = "admin_history_seen_group_ids";
        let seenIds: string[] = [];

        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) seenIds = JSON.parse(raw) as string[];
        } catch {
            seenIds = [];
        }

        const unseen = historyGroups
            .map((group) => group.id)
            .filter((id) => !seenIds.includes(id));

        setHistoryUnreadIds(unseen);

        if (unseen.length > 0) {
            try {
                localStorage.setItem(storageKey, JSON.stringify([...new Set([...seenIds, ...unseen])]));
            } catch {
                // ignore localStorage failures
            }
        }
    }, [activeTab, historyGroupIdsKey]);

    function markHistorySeen(groupId: string) {
        setHistoryUnreadIds((prev) => prev.filter((id) => id !== groupId));
    }

    function downloadCsv(filename: string, rows: Array<Array<unknown>>) {
        const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function getGuestRsvpExportStatus(guest: Guest) {
        if (guest.is_plus_one && !guest.plus_one_claimed && guest.attending === null) return "Not Added";
        if (guest.attending === true) return "Attending";
        if (guest.attending === false) return "Declined";
        if (guest.viewed_rsvp) return "Viewed";
        return "Pending";
    }

    function handleExportGuests() {
        const rows: Array<Array<unknown>> = [
            [
                "Household",
                "First Name",
                "Last Name",
                "Suffix",
                "Role",
                "Linked To",
                "Plus One Allowed",
                "Plus One Claimed",
                "RSVP Status",
                "Dietary Restrictions",
                "Song Request",
                "Advice",
                "Affiliation",
                "Side",
                "Likelihood",
            ],
            ...guests.map((guest) => [
                guest.households?.name ?? "",
                guest.first_name,
                guest.last_name,
                guest.suffix ?? "",
                guest.is_plus_one ? "Plus-one guest" : "Primary guest",
                guest.plus_one_for_id ? guestNameById.get(guest.plus_one_for_id) ?? "" : "",
                guest.plus_one_allowed ? "Yes" : "No",
                guest.plus_one_claimed ? "Yes" : "No",
                getGuestRsvpExportStatus(guest),
                guest.dietary_restrictions ?? guest.food_allergies ?? "",
                guest.song_request ?? "",
                guest.advice ?? "",
                guest.affiliation ?? "",
                guest.side ?? "",
                guest.likelihood ?? "",
            ]),
        ];

        downloadCsv(`wedding-guests-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    }

    function handleExportHistory() {
        const rows: Array<Array<unknown>> = [
            [
                "Recorded At",
                "Event Type",
                "Event Group ID",
                "Actor Guest",
                "Guest",
                "Household",
                "Activity",
                "Change Summary",
                "Dietary Restrictions",
                "Song Request",
                "Advice",
            ],
            ...rsvpHistory.map((entry) => {
                const actorName = entry.actor_guest_id ? guestNameById.get(entry.actor_guest_id) ?? "" : "";
                const guestName = entry.guests
                    ? getFullName(entry.guests.first_name, entry.guests.last_name, entry.guests.suffix)
                    : guestNameById.get(entry.guest_id) ?? "Unknown";
                const activity =
                    entry.event_type === "viewed"
                        ? "Viewed RSVP"
                        : entry.event_type === "updated"
                            ? "Updated RSVP"
                        : entry.attending === true
                            ? "Attending"
                            : entry.attending === false
                                ? "Declined"
                                : "Updated";

                return [
                    entry.recorded_at,
                    entry.event_type,
                    entry.event_group_id,
                    actorName,
                    guestName,
                    entry.households?.name ?? entry.guests?.households?.name ?? "",
                    activity,
                    entry.change_summary ?? "",
                    entry.food_allergies ?? "",
                    entry.song_request ?? "",
                    entry.advice ?? "",
                ];
            }),
        ];

        downloadCsv(`wedding-rsvp-history-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    }

    async function handleAddGuest() {
        if (!newGuest.householdName.trim() || !newGuest.firstName.trim() || !newGuest.lastName.trim()) {
            setAddGuestError("Household, first name, and last name are required.");
            return;
        }

        setAddingGuest(true);
        setAddGuestError(null);
        try {
            const res = await fetch("/api/admin/guests", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    householdName: newGuest.householdName.trim(),
                    firstName: newGuest.firstName.trim(),
                    lastName: newGuest.lastName.trim(),
                    suffix: newGuest.suffix.trim() || null,
                    nicknames: newGuest.nicknames.trim() || null,
                }),
            });
            const data = await res.json() as { error?: string };
            if (!res.ok) {
                throw new Error(data.error ?? "Could not add guest.");
            }

            setNewGuest({ householdName: "", firstName: "", lastName: "", suffix: "", nicknames: "" });
            setShowAddGuest(false);
            await fetchData({ preserveScroll: true, silent: true });
        } catch (error) {
            setAddGuestError(error instanceof Error ? error.message : "Could not add guest.");
        } finally {
            setAddingGuest(false);
        }
    }

    if (status === "checking") return <div className="min-h-screen bg-base" />;
    if (status !== "authenticated") return <AdminLoginCard onLogin={login} />;

    return (
        <AdminFrame section="rsvp" role={role} title="Admin Dashboard" onLogout={logout}>

            {/* ── RSVP dropdown popover ── */}
            {rsvpPopover && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setRsvpPopover(null)} />
                    <div className="overflow-hidden rounded-xl border border-primary/12 bg-white shadow-2xl" style={rsvpPopoverStyle(rsvpPopover.anchorRect)}>
                        {/* Not Added option — only for plus ones */}
                        {rsvpPopover.isPlusOne && (
                            <button
                                onClick={() => {
                                    if (rsvpPopover.guestId) {
                                        void fetch("/api/admin/guests", {
                                            method: "PATCH", credentials: "same-origin",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ id: rsvpPopover.guestId, updates: { attending: null, plus_one_claimed: false } }),
                                        }).then(() => {
                                            setGuests((prev) => prev.map((g) => g.id === rsvpPopover.guestId ? { ...g, attending: null, plus_one_claimed: false } : g));
                                            setRsvpPopover(null);
                                        });
                                    }
                                }}
                                className={`flex w-full items-center gap-2.5 px-5 py-3 text-left text-sm transition-colors text-gray-500 hover:bg-gray-50`}
                            >
                                <span className={`text-[8px] ${!rsvpPopover.current && !rsvpPopover.plusOneClaimed ? "opacity-100" : "opacity-0"}`}>●</span>
                                Not Added
                            </button>
                        )}
                        {([
                            { label: "Attending", value: true as boolean | null, cls: "text-green-700 hover:bg-green-50" },
                            { label: "Declined", value: false as boolean | null, cls: "text-red-700 hover:bg-red-50" },
                            { label: "Pending", value: null as boolean | null, cls: "text-yellow-600 hover:bg-yellow-50" },
                            { label: "Viewed", value: "viewed" as unknown as boolean | null, cls: "text-blue-600 hover:bg-blue-50" },
                        ] as const).map(({ label, value, cls }) => (
                            <button
                                key={label}
                                onClick={() => {
                                    if (label === "Viewed") {
                                        if (rsvpPopover.guestId) {
                                            void fetch("/api/admin/guests", {
                                                method: "PATCH", credentials: "same-origin",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ id: rsvpPopover.guestId, updates: { attending: null, viewed_rsvp: true } }),
                                            }).then(() => {
                                                setGuests((prev) => prev.map((g) => g.id === rsvpPopover.guestId ? { ...g, attending: null, viewed_rsvp: true } : g));
                                                setRsvpPopover(null);
                                            });
                                        }
                                    } else {
                                        void saveRsvp(value);
                                    }
                                }}
                                className={`flex w-full items-center gap-2.5 px-5 py-3 text-left text-sm transition-colors ${cls}`}
                            >
                                <span className={`text-[8px] ${rsvpPopover.current === value ? "opacity-100" : "opacity-0"}`}>●</span>
                                {label}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* ── Text / multiline edit popover ── */}
            {textEdit && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setTextEdit(null)} />
                    <div className="rounded-xl border border-primary/20 bg-white p-3 shadow-2xl" style={textEditStyle(textEdit.anchorRect, textEdit.multiline)}>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-secondary">{textEdit.label}</p>
                        {textEdit.multiline ? (
                            <textarea
                                ref={(el) => { textInputRef.current = el; }}
                                rows={4}
                                className="w-full resize-none rounded-lg border border-primary/12 bg-surface/60 px-3 py-2 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                value={textEditValue}
                                onChange={(e) => setTextEditValue(e.target.value)}
                            />
                        ) : (
                            <input
                                ref={(el) => { textInputRef.current = el; }}
                                type="text"
                                className="w-full rounded-lg border border-primary/12 bg-surface/60 px-3 py-2 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                value={textEditValue}
                                onChange={(e) => setTextEditValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") void saveText(); }}
                            />
                        )}
                        <div className="mt-2 flex justify-end gap-1.5">
                            <button onClick={() => setTextEdit(null)} className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:bg-surface/80 transition-colors" title="Cancel">✕</button>
                            <button onClick={() => void saveText()} disabled={textEditSaving} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors" title="Save">
                                {textEditSaving ? "…" : "✓"}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {historyEdit && (
                <>
                    <div className="fixed inset-0 z-40 bg-primary/15 backdrop-blur-sm" onClick={() => setHistoryEdit(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl rounded-[1.6rem] border border-primary/12 bg-white p-6 shadow-2xl">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">History Entry</p>
                                    <h3 className="mt-1 font-heading text-2xl text-primary">{historyEdit.label}</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHistoryEdit(null)}
                                    className="rounded-full border border-primary/12 px-3 py-1 text-sm text-text-secondary transition-colors hover:bg-surface/80"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-1.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Recorded</span>
                                    <input
                                        type="datetime-local"
                                        value={historyEdit.recordedAt}
                                        onChange={(e) => setHistoryEdit((prev) => prev ? { ...prev, recordedAt: e.target.value } : prev)}
                                        className="w-full rounded-xl border border-primary/12 bg-surface/60 px-3 py-2 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Event Type</span>
                                    <select
                                        value={historyEdit.eventType}
                                        onChange={(e) => setHistoryEdit((prev) => prev ? { ...prev, eventType: e.target.value as "submitted" | "viewed" | "updated" } : prev)}
                                        className="w-full rounded-xl border border-primary/12 bg-surface/60 px-3 py-2 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                    >
                                        <option value="submitted">Submitted</option>
                                        <option value="updated">Updated RSVP</option>
                                        <option value="viewed">Viewed RSVP</option>
                                    </select>
                                </label>
                            </div>

                            {(historyEdit.eventType === "submitted" || historyEdit.eventType === "updated") && (
                                <div className="mt-4">
                                    <label className="space-y-1.5">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Status</span>
                                        <select
                                            value={historyEdit.activity}
                                            onChange={(e) => setHistoryEdit((prev) => prev ? { ...prev, activity: e.target.value as "attending" | "declined" | "updated" } : prev)}
                                            className="w-full rounded-xl border border-primary/12 bg-surface/60 px-3 py-2 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                        >
                                            <option value="attending">Attending</option>
                                            <option value="declined">Declined</option>
                                            <option value="updated">Updated</option>
                                        </select>
                                    </label>
                                </div>
                            )}

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <label className="space-y-1.5 md:col-span-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Change Summary</span>
                                    <input
                                        type="text"
                                        value={historyEdit.changeSummary}
                                        onChange={(e) => setHistoryEdit((prev) => prev ? { ...prev, changeSummary: e.target.value } : prev)}
                                        className="w-full rounded-xl border border-primary/12 bg-surface/60 px-3 py-2 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Dietary</span>
                                    <input
                                        type="text"
                                        value={historyEdit.foodAllergies}
                                        onChange={(e) => setHistoryEdit((prev) => prev ? { ...prev, foodAllergies: e.target.value } : prev)}
                                        className="w-full rounded-xl border border-primary/12 bg-surface/60 px-3 py-2 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Song</span>
                                    <input
                                        type="text"
                                        value={historyEdit.songRequest}
                                        onChange={(e) => setHistoryEdit((prev) => prev ? { ...prev, songRequest: e.target.value } : prev)}
                                        className="w-full rounded-xl border border-primary/12 bg-surface/60 px-3 py-2 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                    />
                                </label>
                            </div>

                            <label className="mt-4 block space-y-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">Advice</span>
                                <textarea
                                    rows={5}
                                    value={historyEdit.advice}
                                    onChange={(e) => setHistoryEdit((prev) => prev ? { ...prev, advice: e.target.value } : prev)}
                                    className="w-full resize-none rounded-xl border border-primary/12 bg-surface/60 px-3 py-2 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                />
                            </label>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setHistoryEdit(null)}
                                    className="rounded-full border border-primary/12 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface/80"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void saveHistoryEdit()}
                                    disabled={historySaving}
                                    className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {historySaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {envError && <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">Add valid Supabase keys to `.env.local`.</div>}
            {error && <div className="mb-8 rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

            {loading ? (
                <div className="py-16 text-center text-text-secondary">Loading guest data...</div>
            ) : (
                <div className="space-y-10">
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { mobileLabel: "Total", desktopLabel: "Total Invited", value: totalInvited, color: "text-primary" },
                            { mobileLabel: "Yes", desktopLabel: "Attending", value: totalAttending, color: "text-green-700" },
                            { mobileLabel: "No", desktopLabel: "Declined", value: totalDeclined, color: "text-red-700" },
                            { mobileLabel: "Pending", desktopLabel: "Pending", value: totalPending, color: "text-yellow-600" },
                        ].map(({ mobileLabel, desktopLabel, value, color }) => (
                            <div key={desktopLabel} className="rounded-[1.2rem] border border-primary/8 bg-[#fbf8f3] px-2 py-3 text-center md:rounded-[1.5rem] md:px-4 md:py-5">
                                <h3 className="text-[9px] uppercase tracking-wider text-text-secondary md:text-[10px] md:tracking-widest">
                                    <span className="md:hidden">{mobileLabel}</span>
                                    <span className="hidden md:inline">{desktopLabel}</span>
                                </h3>
                                <p className={`mt-1 text-xl font-heading md:mt-2 md:text-3xl ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Table card */}
                    <div className="rounded-[1.8rem] border border-primary/10 bg-white shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <div className="border-b border-primary/8 bg-[#fbf8f3]/60 px-4 py-4 md:px-6">
                            <div className="flex items-center gap-6">
                                {(["guests", "history"] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`shrink-0 border-b-2 pb-1 text-sm uppercase tracking-widest transition-colors capitalize ${
                                            activeTab === tab ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-primary"
                                        }`}
                                    >
                                        {tab}
                                        {tab === "history" && historyUnreadIds.length > 0 && (
                                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{historyUnreadIds.length}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="sticky z-30 bg-white shadow-[0_8px_20px_rgba(20,42,68,0.06)]" style={{ top: STICKY_BAR_TOP }}>
                            <div className="border-b border-primary/8 bg-white/95 backdrop-blur">
                                {(activeTab === "guests" || activeTab === "history") && (
                                    <>
                                        <div className="grid gap-2 px-4 pb-3 pt-3 md:hidden" style={{ gridTemplateColumns: activeTab === "guests" ? "repeat(6,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))" }}>
                                            {activeTab === "guests" && (
                                                <>
                                                    <ActionIconButton
                                                        label={showAddGuest ? "Close add guest" : "Add guest"}
                                                        active={showAddGuest}
                                                        onClick={() => {
                                                            setShowAddGuest((v) => !v);
                                                            setAddGuestError(null);
                                                        }}
                                                    >
                                                        {showAddGuest ? "×" : "+"}
                                                    </ActionIconButton>
                                                    <ActionIconButton
                                                        label={groupByHousehold ? "Grouped by household" : "List by guest"}
                                                        active={groupByHousehold}
                                                        onClick={() => setSecondarySort((v) => !v)}
                                                    >
                                                        ⌂
                                                    </ActionIconButton>
                                                    <ActionIconButton label="Export guest CSV" onClick={handleExportGuests}>
                                                        ⭳
                                                    </ActionIconButton>
                                                </>
                                            )}
                                            {activeTab === "history" && (
                                                <ActionIconButton label="Export history CSV" onClick={handleExportHistory}>
                                                    ⭳
                                                </ActionIconButton>
                                            )}
                                            {activeTab === "history" && (
                                                <ActionIconButton
                                                    label={historyMobileView === "accordion" ? "Switch to sticky column view" : "Switch to accordion view"}
                                                    active={false}
                                                    onClick={() => setHistoryMobileView((v) => v === "accordion" ? "sticky" : "accordion")}
                                                >
                                                    {historyMobileView === "accordion" ? (
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                                                            <rect x="1" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.4" rx="0.5" />
                                                            <rect x="7" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.4" rx="0.5" />
                                                            <rect x="1" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.4" rx="0.5" />
                                                            <rect x="7" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.4" rx="0.5" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                                                            <path d="M1 3h10M1 6h10M1 9h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                                        </svg>
                                                    )}
                                                </ActionIconButton>
                                            )}
                                            <ActionIconButton
                                                label={activeTab === "guests"
                                                    ? (isGuestSearchVisible ? "Hide guest search" : "Show guest search")
                                                    : (isHistorySearchVisible ? "Hide history search" : "Show history search")}
                                                active={activeTab === "guests" ? isGuestSearchVisible : isHistorySearchVisible}
                                                onClick={() => {
                                                    if (activeTab === "guests" && isGuestSearchVisible && guestSearch.trim()) {
                                                        setGuestSearch("");
                                                        setShowGuestSearch(false);
                                                        return;
                                                    }
                                                    if (activeTab === "history" && isHistorySearchVisible && historySearch.trim()) {
                                                        setHistorySearch("");
                                                        setShowHistorySearch(false);
                                                        return;
                                                    }
                                                    if (activeTab === "guests") {
                                                        setShowGuestSearch((v) => !v);
                                                    } else {
                                                        setShowHistorySearch((v) => !v);
                                                    }
                                                }}
                                            >
                                                ⌕
                                            </ActionIconButton>
                                            {activeTab === "guests" && (
                                                <ActionIconButton
                                                    label={editMode ? "Done editing" : "Edit guests"}
                                                    active={editMode}
                                                    onClick={() => {
                                                        setEditMode((v) => !v);
                                                        setRsvpPopover(null);
                                                        setTextEdit(null);
                                                    }}
                                                >
                                                    ✎
                                                </ActionIconButton>
                                            )}
                                            {activeTab === "guests" && (
                                                <ActionIconButton
                                                    label={guestMobileView === "accordion" ? "Switch to sticky column view" : "Switch to accordion view"}
                                                    active={false}
                                                    onClick={() => setGuestMobileView((v) => v === "accordion" ? "sticky" : "accordion")}
                                                >
                                                    {guestMobileView === "accordion" ? (
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                                                            <rect x="1" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.4" rx="0.5" />
                                                            <rect x="7" y="1" width="4" height="4" stroke="currentColor" strokeWidth="1.4" rx="0.5" />
                                                            <rect x="1" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.4" rx="0.5" />
                                                            <rect x="7" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.4" rx="0.5" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                                                            <path d="M1 3h10M1 6h10M1 9h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                                        </svg>
                                                    )}
                                                </ActionIconButton>
                                            )}
                                        </div>

                                        <div className="hidden flex-wrap items-center gap-2 border-t border-primary/5 px-4 pb-3 pt-2 md:flex">
                                            {activeTab === "guests" && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setShowAddGuest((v) => !v);
                                                            setAddGuestError(null);
                                                        }}
                                                        className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${showAddGuest ? "bg-primary text-white" : "border border-primary/20 text-primary hover:bg-primary/5"}`}
                                                    >
                                                        {showAddGuest ? "Close" : "Add Guest"}
                                                    </button>
                                                    <button
                                                        onClick={() => setSecondarySort((v) => !v)}
                                                        className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${groupByHousehold ? "bg-primary text-white" : "border border-primary/20 text-primary hover:bg-primary/5"}`}
                                                    >
                                                        By Household
                                                    </button>
                                                    <button
                                                        onClick={handleExportGuests}
                                                        className="rounded-full border border-primary/20 px-3 py-1.5 text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary/5"
                                                    >
                                                        Export CSV
                                                    </button>
                                                </>
                                            )}
                                            {activeTab === "history" && (
                                                <button
                                                    onClick={handleExportHistory}
                                                    className="rounded-full border border-primary/20 px-3 py-1.5 text-xs uppercase tracking-widest text-primary transition-colors hover:bg-primary/5"
                                                >
                                                    Export CSV
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (activeTab === "guests" && isGuestSearchVisible && guestSearch.trim()) {
                                                        setGuestSearch("");
                                                        setShowGuestSearch(false);
                                                        return;
                                                    }
                                                    if (activeTab === "history" && isHistorySearchVisible && historySearch.trim()) {
                                                        setHistorySearch("");
                                                        setShowHistorySearch(false);
                                                        return;
                                                    }
                                                    if (activeTab === "guests") {
                                                        setShowGuestSearch((v) => !v);
                                                    } else {
                                                        setShowHistorySearch((v) => !v);
                                                    }
                                                }}
                                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${(activeTab === "guests" ? isGuestSearchVisible : isHistorySearchVisible) ? "bg-primary text-white" : "border border-primary/20 text-primary hover:bg-primary/5"}`}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                                                    <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.5" />
                                                    <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                                Search
                                            </button>
                                            {activeTab === "guests" && (
                                                <button
                                                    onClick={() => handleSort("updated")}
                                                    title="Sort by who most recently RSVPed"
                                                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${sortField === "updated" ? "bg-primary text-white" : "border border-primary/20 text-primary hover:bg-primary/5"}`}
                                                >
                                                    Recent RSVPs
                                                    {sortField === "updated" && <SortIcon field="updated" />}
                                                </button>
                                            )}
                                            {activeTab === "guests" && (
                                                <button
                                                    onClick={() => { setEditMode((v) => !v); setRsvpPopover(null); setTextEdit(null); }}
                                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${editMode ? "bg-accent text-white" : "border border-primary/20 text-primary hover:bg-primary/5"}`}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                                                        <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                                                    </svg>
                                                    {editMode ? "Done" : "Edit"}
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {activeTab === "guests" && editMode && (
                                <div className="border-b border-primary/8 bg-accent/5 px-4 py-2 text-[11px] text-primary/60 md:px-6 md:text-xs">
                                    Tap a guest name, RSVP badge, or text cell to edit.
                                </div>
                            )}

                            {isGuestSearchVisible && (
                                <div className="border-b border-primary/8 bg-white px-4 py-2">
                                    <div className="relative">
                                        <input
                                            ref={guestSearchInputRef}
                                            type="text"
                                            value={guestSearch}
                                            onChange={(e) => setGuestSearch(e.target.value)}
                                            placeholder="Search guests..."
                                            className="w-full rounded-lg border border-primary/12 bg-surface/60 px-3 py-1.5 pr-10 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary/40 focus:outline-none"
                                        />
                                        {guestSearch.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setGuestSearch("");
                                                    guestSearchInputRef.current?.focus();
                                                }}
                                                className="absolute inset-y-0 right-2 my-auto flex h-6 w-6 items-center justify-center rounded-full text-text-secondary/60 transition-colors hover:bg-primary/5 hover:text-primary"
                                                aria-label="Clear guest search"
                                                title="Clear guest search"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                                                    <path d="M2 2L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                    <path d="M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isHistorySearchVisible && (
                                <div className="border-b border-primary/8 bg-white px-4 py-2">
                                    <div className="relative">
                                        <input
                                            ref={historySearchInputRef}
                                            type="text"
                                            value={historySearch}
                                            onChange={(e) => setHistorySearch(e.target.value)}
                                            placeholder="Search history..."
                                            className="w-full rounded-lg border border-primary/12 bg-surface/60 px-3 py-1.5 pr-10 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary/40 focus:outline-none"
                                        />
                                        {historySearch.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHistorySearch("");
                                                    historySearchInputRef.current?.focus();
                                                }}
                                                className="absolute inset-y-0 right-2 my-auto flex h-6 w-6 items-center justify-center rounded-full text-text-secondary/60 transition-colors hover:bg-primary/5 hover:text-primary"
                                                aria-label="Clear history search"
                                                title="Clear history search"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                                                    <path d="M2 2L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                    <path d="M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === "guests" && guestMobileView === "sticky" && (
                                <div className="grid grid-cols-[minmax(0,1.35fr)_0.8fr_0.8fr_0.9fr_0.9fr] items-center border-b border-primary/8 bg-surface/80 px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-text-secondary md:hidden">
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleSort("name")}>
                                        Guest <SortIcon field="name" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleSort("rsvp")}>
                                        RSVP <SortIcon field="rsvp" />
                                    </button>
                                    <div className="text-left">Food</div>
                                    <div className="text-left">Song</div>
                                    <div className="text-left">Advice</div>
                                </div>
                            )}

                            {activeTab === "history" && historyMobileView === "sticky" && (
                                <div className="grid grid-cols-[0.95fr_1.1fr_1.05fr_0.85fr_1fr] items-center border-b border-primary/8 bg-surface/80 px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-text-secondary md:hidden">
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("when")}>
                                        When <HistorySortIcon field="when" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("guest")}>
                                        Guest <HistorySortIcon field="guest" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("household")}>
                                        Home <HistorySortIcon field="household" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("activity")}>
                                        Act <HistorySortIcon field="activity" />
                                    </button>
                                    <div className="text-left">Notes</div>
                                </div>
                            )}

                            {activeTab === "guests" && (
                                <div
                                    className="hidden md:grid items-center border-b border-primary/8 bg-surface/80 px-6 py-4 text-xs uppercase tracking-widest text-text-secondary"
                                    style={{ gridTemplateColumns: "28.8% 13.7% 16.4% 19.2% 21.9%" }}
                                >
                                    <button className="min-w-[210px] text-left font-normal transition-colors hover:text-primary" onClick={() => handleSort("name")}>
                                        Guest Name
                                        <SortIcon field="name" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleSort("rsvp")}>
                                        RSVP
                                        <SortIcon field="rsvp" />
                                    </button>
                                    <div className="text-left">Allergies</div>
                                    <div className="text-left">Song Request</div>
                                    <div className="text-left">Advice</div>
                                </div>
                            )}

                            {activeTab === "history" && (
                                <div
                                    className="hidden md:grid items-center border-b border-primary/8 bg-surface/80 px-6 py-4 text-xs uppercase tracking-widest text-text-secondary"
                                    style={{ gridTemplateColumns: "13% 16% 15% 12% 12% 12% 20%" }}
                                >
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("when")}>
                                        When
                                        <HistorySortIcon field="when" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("guest")}>
                                        Guest
                                        <HistorySortIcon field="guest" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("household")}>
                                        Household
                                        <HistorySortIcon field="household" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("activity")}>
                                        Activity
                                        <HistorySortIcon field="activity" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("dietary")}>
                                        Dietary
                                        <HistorySortIcon field="dietary" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("song")}>
                                        Song
                                        <HistorySortIcon field="song" />
                                    </button>
                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("advice")}>
                                        Advice
                                        <HistorySortIcon field="advice" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {activeTab === "guests" ? (
                            <div className="overflow-hidden rounded-b-[1.8rem]">
                                {showAddGuest && (
                                    <div className="border-b border-primary/8 bg-primary/[0.03] px-6 py-5">
                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.75fr_1fr] xl:grid-cols-[1.4fr_1fr_1fr_0.75fr_1fr_auto]">
                                            <input
                                                list="admin-household-options"
                                                value={newGuest.householdName}
                                                onChange={(e) => setNewGuest((prev) => ({ ...prev, householdName: e.target.value }))}
                                                placeholder="Household name"
                                                className="rounded-lg border border-primary/12 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary/40 focus:outline-none"
                                            />
                                            <input
                                                value={newGuest.firstName}
                                                onChange={(e) => setNewGuest((prev) => ({ ...prev, firstName: e.target.value }))}
                                                placeholder="First name"
                                                className="rounded-lg border border-primary/12 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary/40 focus:outline-none"
                                            />
                                            <input
                                                value={newGuest.lastName}
                                                onChange={(e) => setNewGuest((prev) => ({ ...prev, lastName: e.target.value }))}
                                                placeholder="Last name"
                                                className="rounded-lg border border-primary/12 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary/40 focus:outline-none"
                                            />
                                            <input
                                                value={newGuest.suffix}
                                                onChange={(e) => setNewGuest((prev) => ({ ...prev, suffix: e.target.value }))}
                                                placeholder="Suffix"
                                                className="rounded-lg border border-primary/12 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary/40 focus:outline-none"
                                            />
                                            <input
                                                value={newGuest.nicknames}
                                                onChange={(e) => setNewGuest((prev) => ({ ...prev, nicknames: e.target.value }))}
                                                placeholder="Nicknames"
                                                className="rounded-lg border border-primary/12 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary/40 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => void handleAddGuest()}
                                                disabled={addingGuest}
                                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50 md:col-span-2 lg:col-span-5 xl:col-span-1 xl:justify-self-start"
                                            >
                                                {addingGuest ? "Adding..." : "Save"}
                                            </button>
                                        </div>
                                        <datalist id="admin-household-options">
                                            {householdOptions.map((householdName) => (
                                                <option key={householdName} value={householdName} />
                                            ))}
                                        </datalist>
                                        {addGuestError && (
                                            <p className="mt-3 text-sm text-red-700">{addGuestError}</p>
                                        )}
                                    </div>
                                )}
                                <div className={`overflow-x-auto${guestMobileView === "accordion" ? " hidden md:block" : ""}`}>
                                    <table className="w-full table-fixed text-left text-sm">
                                        <colgroup className="hidden md:table-column-group">
                                            <col style={{ width: "28.8%" }} />
                                            <col style={{ width: "13.7%" }} />
                                            <col style={{ width: "16.4%" }} />
                                            <col style={{ width: "19.2%" }} />
                                            <col style={{ width: "21.9%" }} />
                                        </colgroup>
                                        <thead className="border-b border-gray-200 bg-surface/80 text-xs uppercase tracking-widest text-text-secondary md:hidden">
                                            <tr>
                                                <Th field="name" className={`min-w-[210px]${guestMobileView === "sticky" ? " sticky left-0 z-10 bg-white shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]" : ""}`}>Guest Name</Th>
                                                <Th field="rsvp">RSVP</Th>
                                                <th className="px-6 py-4 font-normal whitespace-nowrap">Allergies</th>
                                                <th className="px-6 py-4 font-normal whitespace-nowrap">Song Request</th>
                                                <th className="px-6 py-4 font-normal whitespace-nowrap">Advice</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {groupByHousehold ? (
                                                getGroupedHouseholds().filter(({ householdName, householdGuests }) => {
                                                    if (!guestSearch.trim()) return true;
                                                    const q = guestSearch.toLowerCase();
                                                    return householdName.toLowerCase().includes(q) || householdGuests.some((g) => `${g.first_name} ${g.last_name}`.toLowerCase().includes(q));
                                                }).map(({ householdName, householdGuests }) => {
                                                    const orderedHouseholdGuests = getOrderedHouseholdGuests(householdGuests, sortField, sortDir);
                                                    const aggAttending = aggregateAttending(householdGuests);
                                                    const hhId = orderedHouseholdGuests[0]?.households.id;
                                                    const repGuestId = orderedHouseholdGuests[0]?.id ?? "";
                                                    const householdAllergies = householdGuests.find((g) => (g.food_allergies ?? g.dietary_restrictions))?.food_allergies
                                                        ?? householdGuests.find((g) => (g.food_allergies ?? g.dietary_restrictions))?.dietary_restrictions
                                                        ?? null;
                                                    const householdSong = householdGuests.find((g) => g.song_request)?.song_request ?? null;
                                                    const householdAdvice = householdGuests.find((g) => g.advice)?.advice ?? null;
                                                    return (
                                                        <React.Fragment key={householdName}>
                                                            {/* Household header */}
                                                            <tr className="border-t-2 border-gray-100 bg-surface/40">
                                                                <td colSpan={1} className={`min-w-[210px] px-6 py-3 font-heading font-bold text-primary${guestMobileView === "sticky" ? " sticky left-0 z-10 bg-[#f5f1eb] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]" : ""}`}>
                                                                    {renderHouseholdDisplayName(householdName)}
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <RsvpBadge
                                                                        attending={aggAttending}
                                                                        editable={editMode}
                                                                        onClick={(e) => hhId && openHouseholdRsvp(e, aggAttending, hhId)}
                                                                    />
                                                                </td>
                                                                <td
                                                                    className={`px-6 py-3 text-text-secondary text-xs break-words ${editCellCls}`}
                                                                    title={editCellTitle}
                                                                    onClick={(e) => openTextEdit(e, repGuestId, "dietary_restrictions", householdAllergies, "Dietary restrictions / allergies", false, hhId)}
                                                                >
                                                                    {householdAllergies || <span className="text-text-secondary/40">—</span>}
                                                                </td>
                                                                <td
                                                                    className={`px-6 py-3 italic text-text-secondary text-xs break-words ${editCellCls}`}
                                                                    title={editCellTitle}
                                                                    onClick={(e) => openTextEdit(e, repGuestId, "song_request", householdSong, "Song Request", false, hhId)}
                                                                >
                                                                    <TruncatedText text={householdSong} cellKey={`${hhId}:song`} expandedTexts={expandedTexts} setExpandedTexts={setExpandedTexts} />
                                                                </td>
                                                                <td
                                                                    className={`px-6 py-3 text-text-secondary text-xs leading-relaxed break-words ${editCellCls}`}
                                                                    title={editCellTitle}
                                                                    onClick={(e) => openTextEdit(e, repGuestId, "advice", householdAdvice, "Advice", true, hhId)}
                                                                >
                                                                    <TruncatedText text={householdAdvice} cellKey={`${hhId}:advice`} expandedTexts={expandedTexts} setExpandedTexts={setExpandedTexts} />
                                                                </td>
                                                            </tr>
                                                            {/* Guest sub-rows */}
                                                            {orderedHouseholdGuests.map((guest) => {
                                                                const companionLabel = getPlusOneCompanionLabel(guest, householdGuests);
                                                                return (
                                                                <tr key={guest.id} className={`hover:bg-surface/10 transition-colors ${guest.is_plus_one ? "border-l-[3px] border-l-amber-400 bg-amber-50/20" : ""}`}>
                                                                    <td
                                                                        className={`px-6 py-3 ${guest.is_plus_one ? "pl-14" : "pl-10"} font-medium text-text-secondary ${editMode ? "cursor-pointer rounded transition-colors hover:bg-primary/5" : ""}${guestMobileView === "sticky" ? ` sticky left-0 z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] ${guest.is_plus_one ? "bg-[#fefcf6]" : "bg-white"}` : ""}`}
                                                                        onClick={() => editMode && setSelectedGuestId(guest.id)}
                                                                    >
                                                                        <div className="flex flex-col gap-1">
                                                                            <div>
                                                                                {getGuestDisplayName(guest)}
                                                                                {guest.suffix ? <span className="ml-1 text-gray-400">{guest.suffix}</span> : null}
                                                                                {guest.is_plus_one && <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 border border-amber-300">+1</span>}
                                                                            </div>
                                                                            {companionLabel && (
                                                                                <span className="text-[11px] uppercase tracking-widest text-amber-700/75">
                                                                                    With {companionLabel}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        <RsvpBadge
                                                                            attending={guest.attending}
                                                                            viewedRsvp={guest.viewed_rsvp}
                                                                            isPlusOne={guest.is_plus_one}
                                                                            plusOneClaimed={guest.plus_one_claimed}
                                                                            editable={editMode}
                                                                            onClick={(e) => openRsvp(e, guest)}
                                                                        />
                                                                    </td>
                                                                    <td
                                                                        className={`px-6 py-3 text-text-secondary text-xs break-words ${editCellCls}`}
                                                                        title={editCellTitle}
                                                                        onClick={(e) => openTextEdit(e, guest.id, "dietary_restrictions", guest.dietary_restrictions ?? guest.food_allergies, "Dietary restrictions / allergies", false)}
                                                                    >
                                                                        {guest.food_allergies || guest.dietary_restrictions || <span className="text-text-secondary/40">—</span>}
                                                                    </td>
                                                                    <td className="px-6 py-3 text-text-secondary/40 text-xs">—</td>
                                                                    <td className="px-6 py-3 text-text-secondary/40 text-xs">—</td>
                                                                </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })
                                            ) : (
                                                getSortedGuests().filter((g) => {
                                                    if (!guestSearch.trim()) return true;
                                                    const q = guestSearch.toLowerCase();
                                                    return `${g.first_name} ${g.last_name}`.toLowerCase().includes(q) || (g.households?.name ?? "").toLowerCase().includes(q);
                                                }).map((guest) => (
                                                    <tr key={guest.id} className={`hover:bg-surface/10 transition-colors ${guest.is_plus_one ? "border-l-[3px] border-l-amber-400 bg-amber-50/20" : ""}`}>
                                                        <td
                                                            className={`px-6 py-3 font-medium text-text-secondary ${editMode ? "cursor-pointer rounded transition-colors hover:bg-primary/5" : ""}${guestMobileView === "sticky" ? ` sticky left-0 z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] ${guest.is_plus_one ? "bg-[#fefcf6]" : "bg-white"}` : ""}`}
                                                            onClick={() => editMode && setSelectedGuestId(guest.id)}
                                                        >
                                                            {getGuestDisplayName(guest)}
                                                            {guest.suffix ? <span className="ml-1 text-gray-400">{guest.suffix}</span> : null}
                                                            {guest.is_plus_one && <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 border border-amber-300">+1</span>}
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <RsvpBadge
                                                                attending={guest.attending}
                                                                viewedRsvp={guest.viewed_rsvp}
                                                                isPlusOne={guest.is_plus_one}
                                                                plusOneClaimed={guest.plus_one_claimed}
                                                                editable={editMode}
                                                                onClick={(e) => openRsvp(e, guest)}
                                                            />
                                                        </td>
                                                        <td
                                                            className={`px-6 py-3 text-text-secondary text-xs break-words ${editCellCls}`}
                                                            title={editCellTitle}
                                                            onClick={(e) => openTextEdit(e, guest.id, "dietary_restrictions", guest.dietary_restrictions ?? guest.food_allergies, "Dietary restrictions / allergies", false)}
                                                        >
                                                            {guest.food_allergies || guest.dietary_restrictions || <span className="text-text-secondary/40">—</span>}
                                                        </td>
                                                        <td
                                                            className={`px-6 py-3 italic text-text-secondary text-xs break-words ${editCellCls}`}
                                                            title={editCellTitle}
                                                            onClick={(e) => openTextEdit(e, guest.id, "song_request", guest.song_request, "Song Request", false)}
                                                        >
                                                            <TruncatedText text={guest.song_request} cellKey={`${guest.id}:song`} expandedTexts={expandedTexts} setExpandedTexts={setExpandedTexts} />
                                                        </td>
                                                        <td
                                                            className={`px-6 py-3 text-text-secondary text-xs leading-relaxed break-words ${editCellCls}`}
                                                            title={editCellTitle}
                                                            onClick={(e) => openTextEdit(e, guest.id, "advice", guest.advice, "Advice", true)}
                                                        >
                                                            <TruncatedText text={guest.advice} cellKey={`${guest.id}:advice`} expandedTexts={expandedTexts} setExpandedTexts={setExpandedTexts} />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Accordion view — mobile only */}
                                {guestMobileView === "accordion" && (
                                    <div className="md:hidden">
                                        {/* Sort controls */}
                                        <div className="flex items-center gap-2 border-b border-primary/6 px-4 py-2">
                                            <span className="text-[9px] uppercase tracking-widest text-text-secondary">Sort:</span>
                                            {(["name", "rsvp", "updated"] as const).map((f) => (
                                                <button
                                                    key={f}
                                                    onClick={() => handleSort(f)}
                                                    className={`flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors ${sortField === f ? "bg-primary text-white" : "border border-primary/15 text-text-secondary hover:bg-primary/5"}`}
                                                >
                                                    {f === "name" ? "Name" : f === "rsvp" ? "RSVP" : "Recent"} <SortIcon field={f} />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {groupByHousehold ? (
                                                getGroupedHouseholds()
                                                    .filter(({ householdName, householdGuests }) => {
                                                        if (!guestSearch.trim()) return true;
                                                        const q = guestSearch.toLowerCase();
                                                        return householdName.toLowerCase().includes(q) || householdGuests.some((g) => `${g.first_name} ${g.last_name}`.toLowerCase().includes(q));
                                                    })
                                                    .map(({ householdName, householdGuests }) => {
                                                        const orderedHouseholdGuests = getOrderedHouseholdGuests(householdGuests, sortField, sortDir);
                                                        const aggAttending = aggregateAttending(householdGuests);
                                                        const hhId = orderedHouseholdGuests[0]?.households.id;
                                                        const repGuestId = orderedHouseholdGuests[0]?.id ?? "";
                                                        const householdAllergies = householdGuests.find((g) => (g.food_allergies ?? g.dietary_restrictions))?.food_allergies
                                                            ?? householdGuests.find((g) => (g.food_allergies ?? g.dietary_restrictions))?.dietary_restrictions
                                                            ?? null;
                                                        const householdSong = householdGuests.find((g) => g.song_request)?.song_request ?? null;
                                                        const householdAdvice = householdGuests.find((g) => g.advice)?.advice ?? null;
                                                        return (
                                                            <React.Fragment key={householdName}>
                                                                {/* Household header card */}
                                                                <div className="bg-surface/40 px-4 py-3 border-t-2 border-gray-100">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="font-heading font-bold text-primary text-sm">{renderHouseholdDisplayName(householdName)}</span>
                                                                        <RsvpBadge
                                                                            attending={aggAttending}
                                                                            editable={editMode}
                                                                            onClick={(e) => hhId && openHouseholdRsvp(e, aggAttending, hhId)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {/* Guest cards */}
                                                                {orderedHouseholdGuests.map((guest) => {
                                                                    const isExpanded = expandedGuestAccordionIds.has(guest.id);
                                                                    const companionLabel = getPlusOneCompanionLabel(guest, householdGuests);
                                                                    return (
                                                                        <div
                                                                            key={guest.id}
                                                                            className={`transition-colors ${guest.is_plus_one ? "border-l-[3px] border-l-amber-400" : ""}`}
                                                                        >
                                                                            <div
                                                                                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                                                                                onClick={() => {
                                                                                    if (editMode) { setSelectedGuestId(guest.id); return; }
                                                                                    setExpandedGuestAccordionIds((prev) => {
                                                                                        const next = new Set(prev);
                                                                                        if (next.has(guest.id)) next.delete(guest.id); else next.add(guest.id);
                                                                                        return next;
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                                                                                        {getGuestDisplayName(guest)}
                                                                                        {guest.suffix ? <span className="text-gray-400">{guest.suffix}</span> : null}
                                                                                        {guest.is_plus_one && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700 border border-amber-300">+1</span>}
                                                                                    </div>
                                                                                    {companionLabel && <div className="text-[10px] uppercase tracking-widest text-amber-700/75 mt-0.5">With {companionLabel}</div>}
                                                                                </div>
                                                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                                    <RsvpBadge
                                                                                        attending={guest.attending}
                                                                                        viewedRsvp={guest.viewed_rsvp}
                                                                                        isPlusOne={guest.is_plus_one}
                                                                                        plusOneClaimed={guest.plus_one_claimed}
                                                                                        editable={editMode}
                                                                                        onClick={(e) => { if (editMode) { e.stopPropagation(); openRsvp(e, guest); } }}
                                                                                    />
                                                                                    <svg className={`w-3.5 h-3.5 text-text-secondary/40 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5l4 4 4-4" /></svg>
                                                                                </div>
                                                                            </div>
                                                                            {isExpanded && (
                                                                                <div className="border-t border-primary/6 px-4 pb-3 pt-2 space-y-2">
                                                                                    <div className="flex gap-3 text-xs">
                                                                                        <span className="w-16 shrink-0 text-[9px] uppercase tracking-widest text-text-secondary/60 pt-0.5">Allergies</span>
                                                                                        <span
                                                                                            className={`text-text-secondary flex-1 ${editCellCls}`}
                                                                                            onClick={(e) => editMode && openTextEdit(e, guest.id, "dietary_restrictions", guest.dietary_restrictions ?? guest.food_allergies, "Dietary restrictions / allergies", false)}
                                                                                        >
                                                                                            {guest.food_allergies || guest.dietary_restrictions || <span className="text-text-secondary/40">—</span>}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex gap-3 text-xs">
                                                                                        <span className="w-16 shrink-0 text-[9px] uppercase tracking-widest text-text-secondary/60 pt-0.5">Song</span>
                                                                                        <span
                                                                                            className={`italic text-text-secondary flex-1 ${editCellCls}`}
                                                                                            onClick={(e) => editMode && openTextEdit(e, guest.id, "song_request", guest.song_request, "Song Request", false)}
                                                                                        >
                                                                                            {guest.song_request || <span className="text-text-secondary/40">—</span>}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex gap-3 text-xs">
                                                                                        <span className="w-16 shrink-0 text-[9px] uppercase tracking-widest text-text-secondary/60 pt-0.5">Advice</span>
                                                                                        <span
                                                                                            className={`text-text-secondary flex-1 leading-relaxed ${editCellCls}`}
                                                                                            onClick={(e) => editMode && openTextEdit(e, guest.id, "advice", guest.advice, "Advice", true)}
                                                                                        >
                                                                                            {guest.advice || <span className="text-text-secondary/40">—</span>}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </React.Fragment>
                                                        );
                                                    })
                                            ) : (
                                                getSortedGuests()
                                                    .filter((g) => {
                                                        if (!guestSearch.trim()) return true;
                                                        const q = guestSearch.toLowerCase();
                                                        return `${g.first_name} ${g.last_name}`.toLowerCase().includes(q) || (g.households?.name ?? "").toLowerCase().includes(q);
                                                    })
                                                    .map((guest) => {
                                                        const isExpanded = expandedGuestAccordionIds.has(guest.id);
                                                        return (
                                                            <div
                                                                key={guest.id}
                                                                className={`transition-colors ${guest.is_plus_one ? "border-l-[3px] border-l-amber-400" : ""}`}
                                                            >
                                                                <div
                                                                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                                                                    onClick={() => {
                                                                        if (editMode) { setSelectedGuestId(guest.id); return; }
                                                                        setExpandedGuestAccordionIds((prev) => {
                                                                            const next = new Set(prev);
                                                                            if (next.has(guest.id)) next.delete(guest.id); else next.add(guest.id);
                                                                            return next;
                                                                        });
                                                                    }}
                                                                >
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                                                                            {getGuestDisplayName(guest)}
                                                                            {guest.suffix ? <span className="text-gray-400">{guest.suffix}</span> : null}
                                                                            {guest.is_plus_one && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700 border border-amber-300">+1</span>}
                                                                        </div>
                                                                        <div className="text-[10px] text-text-secondary/60 mt-0.5">{guest.households?.name ?? ""}</div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                        <RsvpBadge
                                                                            attending={guest.attending}
                                                                            viewedRsvp={guest.viewed_rsvp}
                                                                            isPlusOne={guest.is_plus_one}
                                                                            plusOneClaimed={guest.plus_one_claimed}
                                                                            editable={editMode}
                                                                            onClick={(e) => { if (editMode) { e.stopPropagation(); openRsvp(e, guest); } }}
                                                                        />
                                                                        <svg className={`w-3.5 h-3.5 text-text-secondary/40 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5l4 4 4-4" /></svg>
                                                                    </div>
                                                                </div>
                                                                {isExpanded && (
                                                                    <div className="border-t border-primary/6 px-4 pb-3 pt-2 space-y-2">
                                                                        <div className="flex gap-3 text-xs">
                                                                            <span className="w-16 shrink-0 text-[9px] uppercase tracking-widest text-text-secondary/60 pt-0.5">Allergies</span>
                                                                            <span
                                                                                className={`text-text-secondary flex-1 ${editCellCls}`}
                                                                                onClick={(e) => editMode && openTextEdit(e, guest.id, "dietary_restrictions", guest.dietary_restrictions ?? guest.food_allergies, "Dietary restrictions / allergies", false)}
                                                                            >
                                                                                {guest.food_allergies || guest.dietary_restrictions || <span className="text-text-secondary/40">—</span>}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex gap-3 text-xs">
                                                                            <span className="w-16 shrink-0 text-[9px] uppercase tracking-widest text-text-secondary/60 pt-0.5">Song</span>
                                                                            <span
                                                                                className={`italic text-text-secondary flex-1 ${editCellCls}`}
                                                                                onClick={(e) => editMode && openTextEdit(e, guest.id, "song_request", guest.song_request, "Song Request", false)}
                                                                            >
                                                                                {guest.song_request || <span className="text-text-secondary/40">—</span>}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex gap-3 text-xs">
                                                                            <span className="w-16 shrink-0 text-[9px] uppercase tracking-widest text-text-secondary/60 pt-0.5">Advice</span>
                                                                            <span
                                                                                className={`text-text-secondary flex-1 leading-relaxed ${editCellCls}`}
                                                                                onClick={(e) => editMode && openTextEdit(e, guest.id, "advice", guest.advice, "Advice", true)}
                                                                            >
                                                                                {guest.advice || <span className="text-text-secondary/40">—</span>}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === "history" ? (
                            <div className="overflow-hidden rounded-b-[1.8rem] overflow-x-auto">
                                {historyLoading ? (
                                    <div className="py-10 text-center text-text-secondary text-sm">Loading history...</div>
                                ) : filteredHistoryGroups.length === 0 ? (
                                    <div className="py-10 text-center text-text-secondary text-sm">
                                        {historySearch.trim() ? "No history matches that search." : "No RSVP changes recorded yet."}
                                    </div>
                                ) : (
                                    <>
                                        <div className={`divide-y divide-gray-100 md:hidden${historyMobileView !== "accordion" ? " hidden" : ""}`}>
                                            {sortedHistoryGroups.map((group) => {
                                                const additionalPeople = group.people.slice(1);
                                                const isUnread = historyUnreadIds.includes(group.id);
                                                const isExpanded = expandedHistoryIds.includes(group.id);

                                                return (
                                                    <div
                                                        key={group.id}
                                                        className={`px-4 py-4 transition-colors ${isUnread ? "bg-blue-50/70 ring-1 ring-inset ring-blue-300" : ""}`}
                                                        onClick={() => markHistorySeen(group.id)}
                                                    >
                                                        {editMode && (
                                                            <div className="mb-3 flex justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openHistoryEdit(group);
                                                                    }}
                                                                    className="rounded-full border border-primary/20 bg-white px-3 py-1 text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-primary/5"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        void deleteHistoryGroup(group);
                                                                    }}
                                                                    className="rounded-full border border-red-200 bg-white px-3 py-1 text-[10px] uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-[0.95fr_1.1fr_1.05fr_0.85fr_1fr] gap-3 text-xs">
                                                            <div className="text-text-secondary">
                                                                <div>{new Date(group.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                                                                <div className="mt-1 text-[10px] text-text-secondary/60">
                                                                    {new Date(group.recordedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-text-primary break-words">{group.actorName}</div>
                                                                {additionalPeople.length > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            markHistorySeen(group.id);
                                                                            setExpandedHistoryIds((prev) =>
                                                                                prev.includes(group.id)
                                                                                    ? prev.filter((id) => id !== group.id)
                                                                                    : [...prev, group.id]
                                                                            );
                                                                        }}
                                                                        className="mt-1 rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary"
                                                                    >
                                                                        {isExpanded ? "Hide" : `+${additionalPeople.length}`}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 break-words text-text-secondary">{group.householdName || "—"}</div>
                                                            <div>
                                                                {group.eventType === "viewed" ? (
                                                                    <span className="rounded bg-blue-50 px-2 py-1 text-[10px] text-blue-700">Viewed</span>
                                                                ) : group.eventType === "updated" ? (
                                                                    <span className="rounded bg-primary/5 px-2 py-1 text-[10px] text-primary/70">Updated</span>
                                                                ) : group.attending === true ? (
                                                                    <span className="rounded bg-green-50 px-2 py-1 text-[10px] text-green-700">Yes</span>
                                                                ) : group.attending === false ? (
                                                                    <span className="rounded bg-red-50 px-2 py-1 text-[10px] text-red-700">No</span>
                                                                ) : (
                                                                    <span className="rounded bg-primary/5 px-2 py-1 text-[10px] text-primary/70">Edit</span>
                                                                )}
                                                                {group.changeSummary && (
                                                                    <div className="mt-1 break-words text-[10px] text-text-secondary">{group.changeSummary}</div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 space-y-1 break-words text-text-secondary">
                                                                {group.foodAllergies ? <div>{group.foodAllergies}</div> : null}
                                                                {group.songRequest ? <div className="italic">{group.songRequest}</div> : null}
                                                                {group.advice ? <div>{group.advice}</div> : null}
                                                                {!group.foodAllergies && !group.songRequest && !group.advice ? <div>—</div> : null}
                                                            </div>
                                                        </div>
                                                        {isExpanded && additionalPeople.length > 0 && (
                                                            <div className="mt-3 border-t border-primary/8 pt-3">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {additionalPeople.map((name) => (
                                                                        <span key={`${group.id}:${name}`} className="rounded-full border border-primary/10 bg-white px-3 py-1 text-[10px] text-text-secondary">
                                                                            {name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* History sticky column view — mobile only */}
                                        {historyMobileView === "sticky" && (
                                            <div className="overflow-x-auto md:hidden">
                                                <table className="w-full text-left text-sm">
                                                    <tbody className="divide-y divide-gray-100">
                                                        {sortedHistoryGroups.map((group) => {
                                                            const additionalPeople = group.people.slice(1);
                                                            const isUnread = historyUnreadIds.includes(group.id);
                                                            const isExpanded = expandedHistoryIds.includes(group.id);
                                                            return (
                                                                <React.Fragment key={group.id}>
                                                                    <tr
                                                                        className={`align-top transition-colors ${isUnread ? "bg-blue-50/70 ring-1 ring-inset ring-blue-300" : ""}`}
                                                                        onClick={() => markHistorySeen(group.id)}
                                                                    >
                                                                        <td className="sticky left-0 z-10 bg-white shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] w-[90px] min-w-[90px] px-3 py-3 text-text-secondary text-xs whitespace-nowrap">
                                                                            <div>{new Date(group.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                                                                            <div className="mt-0.5 text-[10px] text-text-secondary/60">{new Date(group.recordedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                                                                        </td>
                                                                        <td className="min-w-[120px] px-3 py-3 font-medium text-text-primary text-xs">
                                                                            <div>{group.actorName}</div>
                                                                            {additionalPeople.length > 0 && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { e.stopPropagation(); markHistorySeen(group.id); setExpandedHistoryIds((prev) => prev.includes(group.id) ? prev.filter((id) => id !== group.id) : [...prev, group.id]); }}
                                                                                    className="mt-1 rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary"
                                                                                >
                                                                                    {isExpanded ? "Hide" : `+${additionalPeople.length}`}
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                        <td className="min-w-[110px] px-3 py-3 text-text-secondary text-xs">{group.householdName || "—"}</td>
                                                                        <td className="min-w-[80px] px-3 py-3 text-xs">
                                                                            {group.eventType === "viewed" ? (
                                                                                <span className="rounded bg-blue-50 px-2 py-1 text-[10px] text-blue-700">Viewed</span>
                                                                            ) : group.eventType === "updated" ? (
                                                                                <span className="rounded bg-primary/5 px-2 py-1 text-[10px] text-primary/70">Updated</span>
                                                                            ) : group.attending === true ? (
                                                                                <span className="rounded bg-green-50 px-2 py-1 text-[10px] text-green-700">Yes</span>
                                                                            ) : group.attending === false ? (
                                                                                <span className="rounded bg-red-50 px-2 py-1 text-[10px] text-red-700">No</span>
                                                                            ) : (
                                                                                <span className="rounded bg-primary/5 px-2 py-1 text-[10px] text-primary/70">Edit</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="min-w-[140px] px-3 py-3 text-xs text-text-secondary space-y-1">
                                                                            {group.foodAllergies ? <div>{group.foodAllergies}</div> : null}
                                                                            {group.songRequest ? <div className="italic">{group.songRequest}</div> : null}
                                                                            {group.advice ? <div className="line-clamp-2">{group.advice}</div> : null}
                                                                            {!group.foodAllergies && !group.songRequest && !group.advice ? <div>—</div> : null}
                                                                        </td>
                                                                    </tr>
                                                                    {isExpanded && additionalPeople.length > 0 && (
                                                                        <tr className="bg-primary/[0.03]">
                                                                            <td className="sticky left-0 z-10 bg-[#f9f5ef] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] px-3 py-2 text-text-secondary/50 text-xs">Also</td>
                                                                            <td colSpan={4} className="px-3 py-2 text-xs text-text-secondary">
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {additionalPeople.map((name) => (
                                                                                        <span key={`${group.id}:${name}`} className="rounded-full border border-primary/10 bg-white px-2 py-0.5 text-[10px] text-text-secondary">{name}</span>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                        <table className="hidden w-full table-fixed text-left text-sm md:table">
                                        <colgroup className="hidden md:table-column-group">
                                            <col style={{ width: "13%" }} />
                                            <col style={{ width: "16%" }} />
                                            <col style={{ width: "15%" }} />
                                            <col style={{ width: "12%" }} />
                                            <col style={{ width: "12%" }} />
                                            <col style={{ width: "12%" }} />
                                            <col style={{ width: "20%" }} />
                                        </colgroup>
                                        <thead className="hidden border-b border-gray-200 bg-surface/80 text-xs uppercase tracking-widest text-text-secondary">
                                            <tr>
                                                <th className="px-6 py-4 font-normal whitespace-nowrap">
                                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("when")}>
                                                        When
                                                        <HistorySortIcon field="when" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 font-normal whitespace-nowrap">
                                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("guest")}>
                                                        Guest
                                                        <HistorySortIcon field="guest" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 font-normal whitespace-nowrap">
                                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("household")}>
                                                        Household
                                                        <HistorySortIcon field="household" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 font-normal whitespace-nowrap">
                                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("activity")}>
                                                        Activity
                                                        <HistorySortIcon field="activity" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 font-normal whitespace-nowrap">
                                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("dietary")}>
                                                        Dietary
                                                        <HistorySortIcon field="dietary" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 font-normal whitespace-nowrap">
                                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("song")}>
                                                        Song
                                                        <HistorySortIcon field="song" />
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4 font-normal whitespace-nowrap">
                                                    <button className="text-left font-normal transition-colors hover:text-primary" onClick={() => handleHistorySort("advice")}>
                                                        Advice
                                                        <HistorySortIcon field="advice" />
                                                    </button>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {sortedHistoryGroups.map((group) => {
                                                const additionalPeople = group.people.slice(1);
                                                const isUnread = historyUnreadIds.includes(group.id);
                                                const isExpanded = expandedHistoryIds.includes(group.id);

                                                return (
                                                    <React.Fragment key={group.id}>
                                                        <tr
                                                            className={`align-top transition-colors hover:bg-surface/10 ${isUnread ? "bg-blue-50/70 ring-1 ring-inset ring-blue-300" : ""}`}
                                                            onClick={() => markHistorySeen(group.id)}
                                                        >
                                                            <td className="px-6 py-3 text-text-secondary text-xs whitespace-nowrap">
                                                                {new Date(group.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                <span className="block text-text-secondary/50">{new Date(group.recordedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                                                            </td>
                                                            <td className="px-6 py-3 font-medium text-text-primary">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span>{group.actorName}</span>
                                                                    {additionalPeople.length > 0 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                markHistorySeen(group.id);
                                                                                setExpandedHistoryIds((prev) =>
                                                                                    prev.includes(group.id)
                                                                                        ? prev.filter((id) => id !== group.id)
                                                                                        : [...prev, group.id]
                                                                                );
                                                                            }}
                                                                            className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-primary/10"
                                                                        >
                                                                            {isExpanded ? "Hide" : `+${additionalPeople.length}`}
                                                                        </button>
                                                                    )}
                                                                    {editMode && (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    openHistoryEdit(group);
                                                                                }}
                                                                                className="rounded-full border border-primary/20 bg-white px-2 py-0.5 text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-primary/5"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    void deleteHistoryGroup(group);
                                                                                }}
                                                                                className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-widest text-red-600 transition-colors hover:bg-red-50"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-text-secondary text-xs">{group.householdName || "—"}</td>
                                                            <td className="px-6 py-3">
                                                                {group.eventType === "viewed" ? (
                                                                    <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">Viewed RSVP</span>
                                                                ) : group.eventType === "updated" ? (
                                                                    <span className="rounded bg-primary/5 px-2 py-1 text-xs text-primary/70">Updated RSVP</span>
                                                                ) : group.attending === true ? (
                                                                    <span className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">Attending</span>
                                                                ) : group.attending === false ? (
                                                                    <span className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">Declined</span>
                                                                ) : (
                                                                    <span className="rounded bg-primary/5 px-2 py-1 text-xs text-primary/70">Updated</span>
                                                                )}
                                                                {group.changeSummary && (
                                                                    <div className="mt-1 text-[10px] leading-relaxed text-text-secondary">{group.changeSummary}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-3 text-text-secondary text-xs">{group.foodAllergies || "—"}</td>
                                                            <td className="px-6 py-3 italic text-text-secondary text-xs">{group.songRequest || "—"}</td>
                                                            <td className="px-6 py-3 text-text-secondary text-xs">{group.advice || "—"}</td>
                                                        </tr>
                                                        {isExpanded && additionalPeople.length > 0 && (
                                                            <tr className="bg-primary/[0.03]">
                                                                <td className="px-6 py-3 text-text-secondary/50 text-xs">Also included</td>
                                                                <td colSpan={6} className="px-6 py-3 text-sm text-text-secondary">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {additionalPeople.map((name) => (
                                                                            <span key={`${group.id}:${name}`} className="rounded-full border border-primary/10 bg-white px-3 py-1 text-xs text-text-secondary">
                                                                                {name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                        </table>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 md:p-8">
                                <div className="mb-6">
                                    <h3 className="font-heading text-lg text-primary mb-1">Page Visibility</h3>
                                    <p className="text-sm text-text-secondary">Hidden pages show a 404 to visitors who are not logged into admin. Toggle ON to make publicly accessible.</p>
                                </div>
                                {pagesLoading ? <p className="text-sm text-text-secondary py-4">Loading...</p> :
                                    pagesError ? <p className="text-sm text-red-600 py-4">{pagesError}</p> : (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {pageVisibility.map((page) => (
                                                <div key={page.slug} className="flex items-center justify-between rounded-xl border border-primary/8 bg-surface/60 px-5 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-primary">{page.label}</p>
                                                        <p className="text-xs text-text-secondary mt-0.5">/{page.slug}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => void togglePageVisibility(page.slug, !page.hidden)}
                                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${page.hidden ? "bg-gray-200" : "bg-primary"}`}
                                                        role="switch" aria-checked={!page.hidden}
                                                    >
                                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${page.hidden ? "translate-x-0" : "translate-x-5"}`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                <p className="mt-6 text-xs text-text-secondary"><span className="font-medium">On</span> = visible · <span className="font-medium">Off</span> = hidden</p>
                            </div>
                        )}
                    </div>

                    {/* Import */}
                    <div className="rounded-[1.8rem] border border-primary/10 bg-white p-8 shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <h2 className="font-heading text-2xl text-primary">Import Guests</h2>
                        <p className="mt-3 text-sm text-text-secondary">Paste from Excel or Google Sheets: household, first name, last name, suffix, nicknames.</p>
                        {importMessage && (
                            <div className={`mt-6 rounded-[1rem] border p-4 text-sm ${importMessage.includes("Failed") ? "border-yellow-200 bg-yellow-50 text-yellow-800" : "border-green-200 bg-green-50 text-green-800"}`}>
                                {importMessage}
                            </div>
                        )}
                        <div className="mt-6 space-y-4">
                            <textarea
                                className="min-h-[150px] w-full resize-none rounded-[1rem] border border-gray-200 bg-surface p-4 font-mono text-sm focus:border-primary focus:outline-none"
                                placeholder={`The Paine Family\tAshlyn\tBimmerle\t\t\nThe Paine Family\tJeffrey\tPaine\t\t`}
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                            />
                            <button onClick={() => { void handleImport(); }} disabled={importing || !importText.trim()}
                                className="rounded-full bg-primary px-6 py-3 text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                                {importing ? "Importing..." : "Run Import"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <GuestEditDrawer
                guest={selectedGuest}
                householdMates={
                    selectedGuest
                        ? guests
                            .filter((g) => g.households.id === selectedGuest.households.id)
                            .map((g) => ({
                                id: g.id,
                                first_name: g.first_name,
                                last_name: g.last_name,
                                attending: g.attending,
                            }))
                        : []
                }
                householdOptions={householdOptions}
                onClose={() => setSelectedGuestId(null)}
                onSaved={(_updatedGuest) => {
                    void fetchData({ preserveScroll: true, silent: true });
                }}
                onHouseholdRsvp={(householdId, attending) => {
                    setGuests((prev) => prev.map((g) => (g.households.id === householdId ? { ...g, attending } : g)));
                }}
                onDelete={(guestId) => {
                    setGuests((prev) => prev.filter((g) => g.id !== guestId));
                }}
            />
        </AdminFrame>
    );
}
