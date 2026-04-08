"use client";

import { useEffect, useMemo, useState } from "react";
import AdminFrame from "@/components/admin/AdminFrame";
import AdminLoginCard from "@/components/admin/AdminLoginCard";
import { useAdminSession } from "@/components/admin/useAdminSession";

type FeedbackItem = {
    id: string;
    created_at: string;
    updated_at: string;
    reporter_name: string | null;
    reporter_email: string | null;
    category: "bug" | "content" | "suggestion" | "other";
    source_page: string | null;
    message: string;
    status: "new" | "seen" | "closed";
    admin_notes: string | null;
    metadata: Record<string, unknown> | null;
};

export default function FeedbackAdminPage() {
    const { status, role, login, logout } = useAdminSession();
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [notesValue, setNotesValue] = useState("");
    const [saving, setSaving] = useState(false);

    async function fetchFeedback() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/feedback", { credentials: "same-origin" });
            const data = (await res.json()) as { feedback?: FeedbackItem[]; error?: string };
            if (!res.ok) throw new Error(data.error ?? "Could not load feedback.");
            setItems(data.feedback ?? []);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : "Could not load feedback.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (status === "authenticated") {
            void fetchFeedback();
        }
    }, [status]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return items;
        return items.filter((item) =>
            [
                item.reporter_name ?? "",
                item.reporter_email ?? "",
                item.source_page ?? "",
                item.category,
                item.message,
                item.admin_notes ?? "",
            ].some((value) => value.toLowerCase().includes(query))
        );
    }, [items, search]);

    const selected = selectedId
        ? filteredItems.find((item) => item.id === selectedId) ?? items.find((item) => item.id === selectedId) ?? null
        : null;

    useEffect(() => {
        if (!selected) {
            setNotesValue("");
            return;
        }
        setNotesValue(selected.admin_notes ?? "");
        if (selected.status === "new") {
            void updateFeedback(selected.id, { status: "seen" }, true);
        }
    }, [selected?.id]);

    async function updateFeedback(id: string, updates: { status?: FeedbackItem["status"]; admin_notes?: string | null }, optimistic = true) {
        const previousItems = items;
        if (optimistic) {
            setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
        }

        try {
            const res = await fetch("/api/admin/feedback", {
                method: "PATCH",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...updates }),
            });
            const data = (await res.json()) as { error?: string };
            if (!res.ok) throw new Error(data.error ?? "Could not save feedback.");
        } catch (updateError) {
            setItems(previousItems);
            setError(updateError instanceof Error ? updateError.message : "Could not save feedback.");
        }
    }

    async function saveNotes() {
        if (!selected) return;
        setSaving(true);
        await updateFeedback(selected.id, { admin_notes: notesValue }, true);
        setSaving(false);
    }

    if (status === "checking") return <div className="min-h-screen bg-base" />;
    if (status !== "authenticated") return <AdminLoginCard onLogin={login} />;

    const unreadCount = items.filter((item) => item.status === "new").length;

    return (
        <AdminFrame
            section="feedback"
            role={role}
            title="Feedback Inbox"
            description="A shared inbox for bug reports, content fixes, and other site feedback."
            onLogout={logout}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "New", value: unreadCount, color: "text-primary" },
                        { label: "Open", value: items.filter((item) => item.status !== "closed").length, color: "text-green-700" },
                        { label: "Closed", value: items.filter((item) => item.status === "closed").length, color: "text-text-secondary" },
                    ].map((card) => (
                        <div key={card.label} className="rounded-[1.2rem] border border-primary/8 bg-[#fbf8f3] px-3 py-4 text-center">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-text-secondary">{card.label}</p>
                            <p className={`mt-2 font-heading text-2xl ${card.color}`}>{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.05fr_1.2fr]">
                    <div className="overflow-hidden rounded-[1.6rem] border border-primary/10 bg-white">
                        <div className="border-b border-primary/8 px-4 py-4">
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search feedback..."
                                className="w-full rounded-xl border border-primary/12 bg-surface/60 px-4 py-3 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                            />
                        </div>
                        <div className="max-h-[65vh] overflow-y-auto">
                            {loading ? (
                                <div className="px-5 py-10 text-center text-sm text-text-secondary">Loading feedback...</div>
                            ) : error ? (
                                <div className="px-5 py-10 text-center text-sm text-red-700">{error}</div>
                            ) : filteredItems.length === 0 ? (
                                <div className="px-5 py-10 text-center text-sm text-text-secondary">No feedback yet.</div>
                            ) : (
                                filteredItems.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedId(item.id)}
                                        className={`w-full border-b border-primary/8 px-4 py-4 text-left transition-colors hover:bg-surface/40 ${
                                            selected?.id === item.id ? "bg-surface/60" : ""
                                        } ${item.status === "new" ? "border-l-4 border-l-blue-400" : ""}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-primary">
                                                    {item.reporter_name || item.reporter_email || "Anonymous"}
                                                </p>
                                                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                                                    {item.category} {item.source_page ? `• ${item.source_page}` : ""}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-[11px] text-text-secondary">
                                                {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </span>
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">{item.message}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-primary/10 bg-white p-5 md:p-6">
                        {selected ? (
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.24em] text-text-secondary">{selected.category}</p>
                                        <h2 className="mt-2 font-heading text-3xl text-primary">
                                            {selected.reporter_name || selected.reporter_email || "Anonymous feedback"}
                                        </h2>
                                        <p className="mt-2 text-sm text-text-secondary">
                                            {selected.source_page || "No page listed"} • {new Date(selected.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void updateFeedback(selected.id, { status: selected.status === "closed" ? "seen" : "closed" })}
                                            className="rounded-full border border-primary/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/5"
                                        >
                                            {selected.status === "closed" ? "Reopen" : "Close"}
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-[1.2rem] bg-surface/60 px-4 py-4 text-sm leading-7 text-text-primary">
                                    {selected.message}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[1.2rem] border border-primary/8 bg-[#fbf8f3] px-4 py-4 text-sm text-text-secondary">
                                        <p><span className="font-medium text-primary">Email:</span> {selected.reporter_email || "Not provided"}</p>
                                        <p className="mt-2"><span className="font-medium text-primary">Status:</span> {selected.status}</p>
                                    </div>
                                    <div className="rounded-[1.2rem] border border-primary/8 bg-[#fbf8f3] px-4 py-4 text-sm text-text-secondary">
                                        <p><span className="font-medium text-primary">Browser:</span> {String(selected.metadata?.user_agent ?? "Unknown")}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-[0.22em] text-text-secondary">Admin notes</label>
                                    <textarea
                                        value={notesValue}
                                        onChange={(event) => setNotesValue(event.target.value)}
                                        rows={5}
                                        className="mt-2 w-full rounded-[1.2rem] border border-primary/12 bg-white px-4 py-4 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                                    />
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="button"
                                            disabled={saving}
                                            onClick={() => void saveNotes()}
                                            className="rounded-full bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.22em] text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Save Notes"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-16 text-center text-sm text-text-secondary">Select a feedback message to read it.</div>
                        )}
                    </div>
                </div>
            </div>
        </AdminFrame>
    );
}
