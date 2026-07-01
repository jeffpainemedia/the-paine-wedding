"use client";

import { useEffect, useState } from "react";

type Session = {
    id: string;
    user_id: string | null;
    username_snapshot: string;
    tier_snapshot: string;
    logged_in_at: string;
    ip: string | null;
    user_agent: string | null;
    country: string | null;
};

export default function ActivityLogPanel() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const LIMIT = 50;

    async function load(newOffset = 0) {
        setLoading(true);
        const res = await fetch(`/api/admin/schedule/sessions?limit=${LIMIT}&offset=${newOffset}`, { credentials: "include" });
        const data = await res.json() as { sessions?: Session[]; total?: number };
        setSessions(data.sessions ?? []);
        setTotal(data.total ?? 0);
        setOffset(newOffset);
        setLoading(false);
    }

    useEffect(() => { void load(); }, []);

    const tierColors: Record<string, string> = {
        "public": "bg-primary/8 text-primary",
        "bridal-party": "bg-accent/10 text-accent",
        "vip": "bg-secondary/10 text-secondary",
    };

    return (
        <div className="space-y-5">
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-primary/8 bg-[#fbf8f3] p-5">
                    <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Total Logins</p>
                    <p className="mt-3 font-heading text-4xl text-primary">{total}</p>
                </div>
                <div className="rounded-[1.5rem] border border-primary/8 bg-[#fbf8f3] p-5">
                    <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Most Recent</p>
                    <p className="mt-3 text-lg text-primary">
                        {sessions[0]?.username_snapshot ?? "—"}
                    </p>
                    {sessions[0] && (
                        <p className="text-xs text-text-secondary mt-1">{new Date(sessions[0].logged_in_at).toLocaleString()}</p>
                    )}
                </div>
                <div className="rounded-[1.5rem] border border-primary/8 bg-[#fbf8f3] p-5">
                    <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Unique Users (this page)</p>
                    <p className="mt-3 font-heading text-4xl text-primary">
                        {new Set(sessions.map((s) => s.username_snapshot)).size}
                    </p>
                </div>
            </div>

            {/* Log */}
            <div className="overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white shadow-sm overflow-x-auto">
                <div className="grid grid-cols-[1.5fr_1fr_auto_1fr_auto] gap-3 border-b border-primary/8 bg-[#fbf8f3] px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-text-secondary min-w-[600px]">
                    <div>User</div>
                    <div>Tier</div>
                    <div>Country</div>
                    <div>Time</div>
                    <div>IP</div>
                </div>
                {loading ? (
                    <div className="px-5 py-10 text-center text-text-secondary text-sm">Loading…</div>
                ) : (
                    <div className="divide-y divide-primary/6 min-w-[600px]">
                        {sessions.map((s) => (
                            <div key={s.id} className="grid grid-cols-[1.5fr_1fr_auto_1fr_auto] items-center gap-3 px-5 py-3 text-sm">
                                <div>
                                    <span className="font-medium text-primary">{s.username_snapshot}</span>
                                    {s.user_agent && (
                                        <p className="text-[10px] text-text-secondary truncate max-w-[200px]" title={s.user_agent}>
                                            {s.user_agent.slice(0, 60)}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${tierColors[s.tier_snapshot] ?? "bg-primary/8 text-primary"}`}>
                                        {s.tier_snapshot}
                                    </span>
                                </div>
                                <div className="text-text-secondary text-xs">{s.country ?? "—"}</div>
                                <div className="text-text-secondary text-xs">
                                    {new Date(s.logged_in_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </div>
                                <div className="text-text-secondary text-xs font-mono">{s.ip ?? "—"}</div>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="px-5 py-10 text-center text-text-secondary">No activity yet.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {total > LIMIT && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-text-secondary">
                        Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={offset === 0}
                            onClick={() => void load(offset - LIMIT)}
                            className="rounded-full border border-primary/15 px-4 py-1.5 text-xs text-text-secondary disabled:opacity-40 hover:text-primary"
                        >
                            ← Prev
                        </button>
                        <button
                            disabled={offset + LIMIT >= total}
                            onClick={() => void load(offset + LIMIT)}
                            className="rounded-full border border-primary/15 px-4 py-1.5 text-xs text-text-secondary disabled:opacity-40 hover:text-primary"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
