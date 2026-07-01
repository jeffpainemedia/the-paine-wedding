"use client";

import { useEffect, useState } from "react";

type Tier = { id: string; slug: string; label: string };
type AdminEvent = {
    id: string;
    event_date: string;
    start_time: string;
    end_time: string | null;
    title: string;
    location: string | null;
    notes: string | null;
    sort_order: number;
    tier_ids: string[];
};

function fmt12(time: string): string {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const p = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${p}`;
}

const BLANK_EVENT: Omit<AdminEvent, "id"> = {
    event_date: "2026-09-26",
    start_time: "17:00",
    end_time: null,
    title: "",
    location: null,
    notes: null,
    sort_order: 0,
    tier_ids: [],
};

export default function EventsPanel() {
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Omit<AdminEvent, "id">>(BLANK_EVENT);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState<Omit<AdminEvent, "id">>(BLANK_EVENT);
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        const [er, tr] = await Promise.all([
            fetch("/api/admin/schedule/events", { credentials: "include" }),
            fetch("/api/admin/schedule/tiers", { credentials: "include" }),
        ]);
        const ed = await er.json() as { events?: AdminEvent[] };
        const td = await tr.json() as { tiers?: Tier[] };
        setEvents(ed.events ?? []);
        setTiers(td.tiers ?? []);
        setLoading(false);
    }

    useEffect(() => { void load(); }, []);

    function toggleTier(form: Omit<AdminEvent, "id">, tierId: string): Omit<AdminEvent, "id"> {
        const has = form.tier_ids.includes(tierId);
        return { ...form, tier_ids: has ? form.tier_ids.filter((id) => id !== tierId) : [...form.tier_ids, tierId] };
    }

    async function addEvent() {
        setSaving(true);
        const res = await fetch("/api/admin/schedule/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addForm),
            credentials: "include",
        });
        const data = await res.json() as { error?: string };
        if (!res.ok) { alert(data.error ?? "Failed."); setSaving(false); return; }
        setShowAdd(false);
        setAddForm(BLANK_EVENT);
        setSaving(false);
        void load();
    }

    async function saveEdit(id: string) {
        setSaving(true);
        const res = await fetch(`/api/admin/schedule/events/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm),
            credentials: "include",
        });
        const data = await res.json() as { error?: string };
        if (!res.ok) { alert(data.error ?? "Failed."); setSaving(false); return; }
        setEditId(null);
        setSaving(false);
        void load();
    }

    async function deleteEvent(id: string, title: string) {
        if (!confirm(`Delete "${title}"?`)) return;
        await fetch(`/api/admin/schedule/events/${id}`, { method: "DELETE", credentials: "include" });
        void load();
    }

    function TierSelector({ form, onChange }: { form: Omit<AdminEvent, "id">; onChange: (f: Omit<AdminEvent, "id">) => void }) {
        return (
            <div className="flex flex-wrap gap-1.5">
                {tiers.filter(t => !t.slug.startsWith("public") || true).map((tier) => (
                    <button
                        key={tier.id}
                        type="button"
                        onClick={() => onChange(toggleTier(form, tier.id))}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest border transition-colors ${
                            form.tier_ids.includes(tier.id)
                                ? "bg-primary text-white border-primary"
                                : "border-primary/20 text-text-secondary hover:border-primary/40"
                        }`}
                    >
                        {tier.label}
                    </button>
                ))}
            </div>
        );
    }

    function EventForm({ form, onChange }: { form: Omit<AdminEvent, "id">; onChange: (f: Omit<AdminEvent, "id">) => void }) {
        return (
            <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <input
                        type="time"
                        value={form.start_time}
                        onChange={(e) => onChange({ ...form, start_time: e.target.value })}
                        className="rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                    />
                    <input
                        type="time"
                        value={form.end_time ?? ""}
                        onChange={(e) => onChange({ ...form, end_time: e.target.value || null })}
                        placeholder="End time (optional)"
                        className="rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                    />
                    <input
                        type="number"
                        value={form.sort_order}
                        onChange={(e) => onChange({ ...form, sort_order: Number(e.target.value) })}
                        placeholder="Sort order"
                        className="rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                    />
                </div>
                <input
                    value={form.title}
                    onChange={(e) => onChange({ ...form, title: e.target.value })}
                    placeholder="Event title *"
                    className="w-full rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                />
                <input
                    value={form.location ?? ""}
                    onChange={(e) => onChange({ ...form, location: e.target.value || null })}
                    placeholder="Location (optional)"
                    className="w-full rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                />
                <textarea
                    value={form.notes ?? ""}
                    onChange={(e) => onChange({ ...form, notes: e.target.value || null })}
                    placeholder="Notes (optional)"
                    rows={2}
                    className="w-full rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40 resize-none"
                />
                <div>
                    <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-text-secondary">Visible to</p>
                    <TierSelector form={form} onChange={onChange} />
                </div>
            </div>
        );
    }

    if (loading) return <div className="py-10 text-center text-text-secondary text-sm">Loading events…</div>;

    return (
        <div className="space-y-5">
            {/* Add button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowAdd((v) => !v)}
                    className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                    + Add Event
                </button>
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="rounded-[1.5rem] border border-primary/10 bg-[#fbf8f3] p-5 space-y-3">
                    <h3 className="text-xs uppercase tracking-[0.25em] text-text-secondary">New Event</h3>
                    <EventForm form={addForm} onChange={setAddForm} />
                    <div className="flex gap-2">
                        <button onClick={() => void addEvent()} disabled={saving || !addForm.title} className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50">Create</button>
                        <button onClick={() => setShowAdd(false)} className="rounded-full border border-primary/15 px-5 py-2 text-xs text-text-secondary uppercase tracking-[0.2em]">Cancel</button>
                    </div>
                </div>
            )}

            {/* Events table */}
            <div className="overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white shadow-sm">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 border-b border-primary/8 bg-[#fbf8f3] px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                    <div>Time</div>
                    <div>Title</div>
                    <div>Tiers</div>
                    <div />
                </div>
                <div className="divide-y divide-primary/6">
                    {events.map((event) => (
                        editId === event.id ? (
                            <div key={event.id} className="bg-[#fdfaf6] p-5 space-y-3">
                                <EventForm form={editForm} onChange={setEditForm} />
                                <div className="flex gap-2">
                                    <button onClick={() => void saveEdit(event.id)} disabled={saving} className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50">Save</button>
                                    <button onClick={() => setEditId(null)} className="rounded-full border border-primary/15 px-5 py-2 text-xs text-text-secondary uppercase tracking-[0.2em]">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div key={event.id} className="grid grid-cols-[auto_1fr_auto_auto] items-start gap-3 px-5 py-3 hover:bg-[#fdfaf6]">
                                <div className="text-xs text-accent font-medium whitespace-nowrap pt-0.5">
                                    {fmt12(event.start_time)}{event.end_time ? `–${fmt12(event.end_time)}` : ""}
                                </div>
                                <div>
                                    <p className="text-sm text-primary font-medium">{event.title}</p>
                                    {event.location && <p className="text-[11px] text-text-secondary">{event.location}</p>}
                                    {event.notes && <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">{event.notes}</p>}
                                </div>
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                    {tiers.filter(t => event.tier_ids.includes(t.id)).map((t) => (
                                        <span key={t.id} className="rounded-full bg-primary/8 px-2 py-0.5 text-[9px] uppercase tracking-widest text-primary">{t.label}</span>
                                    ))}
                                </div>
                                <div className="flex gap-2 whitespace-nowrap">
                                    <button
                                        onClick={() => { setEditId(event.id); setEditForm({ event_date: event.event_date, start_time: event.start_time, end_time: event.end_time, title: event.title, location: event.location, notes: event.notes, sort_order: event.sort_order, tier_ids: [...event.tier_ids] }); }}
                                        className="text-xs text-text-secondary underline underline-offset-2 hover:text-primary"
                                    >Edit</button>
                                    <button onClick={() => void deleteEvent(event.id, event.title)} className="text-xs text-secondary underline underline-offset-2">Delete</button>
                                </div>
                            </div>
                        )
                    ))}
                    {events.length === 0 && (
                        <div className="px-5 py-10 text-center text-text-secondary text-sm">No events yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
