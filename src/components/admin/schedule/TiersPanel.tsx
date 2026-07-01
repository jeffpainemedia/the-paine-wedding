"use client";

import { useEffect, useState } from "react";

type Tier = {
    id: string;
    slug: string;
    label: string;
    sort_order: number;
    is_public: boolean;
};

export default function TiersPanel() {
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState(true);
    const [newLabel, setNewLabel] = useState("");
    const [newOrder, setNewOrder] = useState("50");
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editOrder, setEditOrder] = useState("");

    async function load() {
        setLoading(true);
        const res = await fetch("/api/admin/schedule/tiers", { credentials: "include" });
        const data = await res.json() as { tiers?: Tier[] };
        setTiers(data.tiers ?? []);
        setLoading(false);
    }

    useEffect(() => { void load(); }, []);

    async function addTier() {
        if (!newLabel.trim()) return;
        setSaving(true);
        await fetch("/api/admin/schedule/tiers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: newLabel, sort_order: Number(newOrder) }),
            credentials: "include",
        });
        setNewLabel("");
        setNewOrder("50");
        setSaving(false);
        void load();
    }

    async function saveEdit(id: string) {
        setSaving(true);
        await fetch(`/api/admin/schedule/tiers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: editLabel, sort_order: Number(editOrder) }),
            credentials: "include",
        });
        setEditId(null);
        setSaving(false);
        void load();
    }

    async function deleteTier(id: string, label: string) {
        if (!confirm(`Delete tier "${label}"? Users must be reassigned first.`)) return;
        const res = await fetch(`/api/admin/schedule/tiers/${id}`, { method: "DELETE", credentials: "include" });
        const data = await res.json() as { error?: string };
        if (!res.ok) { alert(data.error ?? "Cannot delete."); return; }
        void load();
    }

    if (loading) return <div className="py-10 text-center text-text-secondary text-sm">Loading tiers…</div>;

    return (
        <div className="space-y-6">
            {/* List */}
            <div className="overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white shadow-sm">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-primary/8 bg-[#fbf8f3] px-5 py-3 text-[10px] uppercase tracking-[0.24em] text-text-secondary">
                    <div>Label / Slug</div>
                    <div>Order</div>
                    <div>Type</div>
                    <div />
                </div>
                {tiers.map((tier) => (
                    <div key={tier.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-primary/6 px-5 py-3 last:border-0">
                        {editId === tier.id ? (
                            <>
                                <input
                                    value={editLabel}
                                    onChange={(e) => setEditLabel(e.target.value)}
                                    className="rounded-lg border border-primary/20 px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                                />
                                <input
                                    type="number"
                                    value={editOrder}
                                    onChange={(e) => setEditOrder(e.target.value)}
                                    className="w-16 rounded-lg border border-primary/20 px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                                />
                                <div />
                                <div className="flex gap-2">
                                    <button onClick={() => void saveEdit(tier.id)} disabled={saving} className="rounded-full bg-primary px-3 py-1 text-[10px] text-white uppercase tracking-widest disabled:opacity-50">Save</button>
                                    <button onClick={() => setEditId(null)} className="rounded-full border border-primary/15 px-3 py-1 text-[10px] text-text-secondary uppercase tracking-widest">Cancel</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-sm font-medium text-primary">{tier.label}</p>
                                    <p className="text-[11px] text-text-secondary">{tier.slug}</p>
                                </div>
                                <p className="text-sm text-text-secondary">{tier.sort_order}</p>
                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${tier.is_public ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                                    {tier.is_public ? "Public" : "Login"}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditId(tier.id); setEditLabel(tier.label); setEditOrder(String(tier.sort_order)); }} className="text-xs text-text-secondary underline underline-offset-2 hover:text-primary">Edit</button>
                                    {!tier.is_public && (
                                        <button onClick={() => void deleteTier(tier.id, tier.label)} className="text-xs text-secondary underline underline-offset-2">Delete</button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Add tier */}
            <div className="rounded-[1.5rem] border border-primary/10 bg-white p-5 shadow-sm">
                <h3 className="text-xs uppercase tracking-[0.25em] text-text-secondary mb-4">Add Tier</h3>
                <div className="flex gap-3 flex-wrap">
                    <input
                        placeholder="Label (e.g. Photographer)"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="flex-1 min-w-40 rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                    />
                    <input
                        type="number"
                        placeholder="Sort order"
                        value={newOrder}
                        onChange={(e) => setNewOrder(e.target.value)}
                        className="w-24 rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                    />
                    <button
                        onClick={() => void addTier()}
                        disabled={saving || !newLabel.trim()}
                        className="rounded-full bg-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
                <p className="mt-2 text-[11px] text-text-secondary">Slug is auto-generated from the label. Sort order determines hierarchy (lower = seen by more people).</p>
            </div>
        </div>
    );
}
