"use client";

import { useEffect, useState } from "react";

type Tier = { id: string; slug: string; label: string };
type User = {
    id: string;
    username: string;
    display_name: string;
    email: string | null;
    role_label: string;
    tier_id: string;
    game_player_id: string | null;
    last_login_at: string | null;
    login_count: number;
    schedule_tiers: { slug: string; label: string };
};

export default function UsersPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [flashPassword, setFlashPassword] = useState<{ userId: string; pw: string } | null>(null);
    const [search, setSearch] = useState("");

    // Add form state
    const [addForm, setAddForm] = useState({ username: "", display_name: "", email: "", role_label: "", tier_id: "", password: "" });

    // Edit form state
    const [editForm, setEditForm] = useState({ display_name: "", email: "", role_label: "", tier_id: "", password: "" });

    async function load() {
        setLoading(true);
        const [usersRes, tiersRes] = await Promise.all([
            fetch("/api/admin/schedule/users", { credentials: "include" }),
            fetch("/api/admin/schedule/tiers", { credentials: "include" }),
        ]);
        const ud = await usersRes.json() as { users?: User[] };
        const td = await tiersRes.json() as { tiers?: Tier[] };
        setUsers(ud.users ?? []);
        setTiers(td.tiers ?? []);
        if (!addForm.tier_id && td.tiers?.[0]) {
            setAddForm((f) => ({ ...f, tier_id: td.tiers![0].id }));
        }
        setLoading(false);
    }

    useEffect(() => { void load(); }, []);

    async function addUser() {
        const res = await fetch("/api/admin/schedule/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addForm),
            credentials: "include",
        });
        const data = await res.json() as { user?: User; plainPassword?: string; error?: string };
        if (!res.ok) { alert(data.error ?? "Failed to add user."); return; }
        if (data.plainPassword && data.user) {
            setFlashPassword({ userId: data.user.id, pw: data.plainPassword });
        }
        setShowAdd(false);
        setAddForm({ username: "", display_name: "", email: "", role_label: "", tier_id: tiers[0]?.id ?? "", password: "" });
        void load();
    }

    async function saveEdit(id: string) {
        const res = await fetch(`/api/admin/schedule/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm),
            credentials: "include",
        });
        const data = await res.json() as { plainPassword?: string; error?: string };
        if (!res.ok) { alert(data.error ?? "Failed to update."); return; }
        if (data.plainPassword) setFlashPassword({ userId: id, pw: data.plainPassword });
        setEditId(null);
        void load();
    }

    async function resetPassword(id: string) {
        const res = await fetch(`/api/admin/schedule/users/${id}/reset-password`, { method: "POST", credentials: "include" });
        const data = await res.json() as { plainPassword?: string };
        if (data.plainPassword) setFlashPassword({ userId: id, pw: data.plainPassword });
    }

    async function deleteUser(id: string, name: string) {
        if (!confirm(`Delete user "${name}"?`)) return;
        await fetch(`/api/admin/schedule/users/${id}`, { method: "DELETE", credentials: "include" });
        void load();
    }

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        return !q || u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.role_label.toLowerCase().includes(q);
    });

    if (loading) return <div className="py-10 text-center text-text-secondary text-sm">Loading users…</div>;

    return (
        <div className="space-y-5">
            {/* Flash password */}
            {flashPassword && (
                <div className="rounded-[1.2rem] border border-accent/30 bg-accent/10 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-accent mb-1">Password set — copy it now</p>
                    <div className="flex items-center gap-3">
                        <code className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-mono text-primary border border-primary/10">
                            {flashPassword.pw}
                        </code>
                        <button
                            onClick={() => { void navigator.clipboard.writeText(flashPassword.pw); }}
                            className="rounded-full border border-primary/15 px-3 py-1.5 text-xs text-text-secondary hover:text-primary"
                        >
                            Copy
                        </button>
                        <button onClick={() => setFlashPassword(null)} className="text-text-secondary hover:text-primary text-lg leading-none">×</button>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <input
                    placeholder="Search by name or role…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-48 rounded-xl border border-primary/15 px-4 py-2 text-sm text-primary focus:outline-none focus:border-primary/40"
                />
                <button
                    onClick={() => setShowAdd((v) => !v)}
                    className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                >
                    + Add User
                </button>
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="rounded-[1.5rem] border border-primary/10 bg-[#fbf8f3] p-5 space-y-3">
                    <h3 className="text-xs uppercase tracking-[0.25em] text-text-secondary">New User</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {([
                            ["username", "Username (e.g. paige)"],
                            ["display_name", "Display Name (e.g. Paige Bimmerle)"],
                            ["email", "Email (optional — links game account)"],
                            ["role_label", "Role (e.g. Bridesmaid)"],
                        ] as [keyof typeof addForm, string][]).map(([field, placeholder]) => (
                            <input
                                key={field}
                                placeholder={placeholder}
                                value={addForm[field]}
                                onChange={(e) => setAddForm((f) => ({ ...f, [field]: e.target.value }))}
                                className="rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                            />
                        ))}
                        <select
                            value={addForm.tier_id}
                            onChange={(e) => setAddForm((f) => ({ ...f, tier_id: e.target.value }))}
                            className="rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                        >
                            {tiers.filter(t => !t.slug.startsWith("public") || tiers.length === 1).map((t) => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                        </select>
                        <input
                            placeholder="Password (leave blank to auto-generate)"
                            value={addForm.password}
                            onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                            className="rounded-xl border border-primary/15 px-4 py-2.5 text-sm text-primary focus:outline-none focus:border-primary/40"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => void addUser()} className="rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">Create</button>
                        <button onClick={() => setShowAdd(false)} className="rounded-full border border-primary/15 px-5 py-2 text-xs text-text-secondary uppercase tracking-[0.2em]">Cancel</button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-[1.5rem] border border-primary/10 bg-white shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-primary/8 bg-[#fbf8f3] text-left text-[10px] uppercase tracking-[0.22em] text-text-secondary">
                            <th className="px-5 py-3">Name / Username</th>
                            <th className="px-3 py-3">Role</th>
                            <th className="px-3 py-3">Tier</th>
                            <th className="px-3 py-3">Last Login</th>
                            <th className="px-3 py-3">Logins</th>
                            <th className="px-3 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/6">
                        {filtered.map((user) => (
                            editId === user.id ? (
                                <tr key={user.id} className="bg-[#fbf8f3]">
                                    <td className="px-5 py-3" colSpan={5}>
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                            {([
                                                ["display_name", "Display Name"],
                                                ["email", "Email"],
                                                ["role_label", "Role"],
                                            ] as [keyof typeof editForm, string][]).map(([field, ph]) => (
                                                <input
                                                    key={field}
                                                    placeholder={ph}
                                                    value={editForm[field]}
                                                    onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                                                    className="rounded-lg border border-primary/15 px-3 py-1.5 text-sm focus:outline-none focus:border-primary/40"
                                                />
                                            ))}
                                            <select
                                                value={editForm.tier_id}
                                                onChange={(e) => setEditForm((f) => ({ ...f, tier_id: e.target.value }))}
                                                className="rounded-lg border border-primary/15 px-3 py-1.5 text-sm focus:outline-none focus:border-primary/40"
                                            >
                                                {tiers.filter(t => !t.slug.startsWith("public")).map((t) => (
                                                    <option key={t.id} value={t.id}>{t.label}</option>
                                                ))}
                                            </select>
                                            <input
                                                placeholder="New password (leave blank to keep)"
                                                value={editForm.password}
                                                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                                                className="rounded-lg border border-primary/15 px-3 py-1.5 text-sm focus:outline-none focus:border-primary/40"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => void saveEdit(user.id)} className="rounded-full bg-primary px-3 py-1 text-[10px] text-white uppercase tracking-widest">Save</button>
                                            <button onClick={() => setEditId(null)} className="text-xs text-text-secondary underline">Cancel</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={user.id} className="hover:bg-[#fdfaf6]">
                                    <td className="px-5 py-3">
                                        <p className="font-medium text-primary">{user.display_name}</p>
                                        <p className="text-[11px] text-text-secondary">@{user.username}{user.email ? ` · ${user.email}` : ""}</p>
                                    </td>
                                    <td className="px-3 py-3 text-text-secondary">{user.role_label || "—"}</td>
                                    <td className="px-3 py-3">
                                        <span className="rounded-full border border-primary/15 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-primary">
                                            {user.schedule_tiers?.label ?? "—"}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-text-secondary text-xs">
                                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never"}
                                    </td>
                                    <td className="px-3 py-3 text-text-secondary">{user.login_count}</td>
                                    <td className="px-3 py-3">
                                        <div className="flex gap-2 whitespace-nowrap">
                                            <button
                                                onClick={() => { setEditId(user.id); setEditForm({ display_name: user.display_name, email: user.email ?? "", role_label: user.role_label, tier_id: user.tier_id, password: "" }); }}
                                                className="text-xs text-text-secondary underline underline-offset-2 hover:text-primary"
                                            >Edit</button>
                                            <button onClick={() => void resetPassword(user.id)} className="text-xs text-accent underline underline-offset-2">Reset PW</button>
                                            <button onClick={() => void deleteUser(user.id, user.display_name)} className="text-xs text-secondary underline underline-offset-2">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-10 text-center text-text-secondary">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
