"use client";

import { useEffect, useState } from "react";
import AdminFrame from "@/components/admin/AdminFrame";
import AdminLoginCard from "@/components/admin/AdminLoginCard";
import { useAdminSession } from "@/components/admin/useAdminSession";

type AdminLog = {
    id: string;
    password_used: string;
    created_at: string;
};

export default function AdminSecurityPage() {
    const { status, role, login, logout } = useAdminSession();
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchLogs() {
        setLoading(true);
        const response = await fetch("/api/admin/security-logs", { credentials: "same-origin" });
        const payload = await response.json() as { logs?: AdminLog[]; error?: string };

        if (!response.ok) {
            setError(payload.error ?? "Failed to load security logs.");
            setLogs([]);
        } else {
            setError(null);
            setLogs(payload.logs ?? []);
        }

        setLoading(false);
    }

    useEffect(() => {
        if (status !== "authenticated") return;

        const timer = window.setTimeout(() => {
            void fetchLogs();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [status]);

    if (status === "checking") {
        return <div className="min-h-screen bg-base" />;
    }

    if (status !== "authenticated") {
        return <AdminLoginCard onLogin={login} />;
    }

    return (
        <AdminFrame
            section="security"
            role={role}
            title="Security Admin"
            description="Admin login tracking and account-access history live here instead of inside the RSVP dashboard."
            onLogout={logout}
        >
            {role !== "Master" ? (
                <div className="rounded-[1.5rem] border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                    Security logs are limited to the Master account.
                </div>
            ) : loading ? (
                <div className="py-16 text-center text-text-secondary">Loading security logs...</div>
            ) : error ? (
                <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
            ) : (
                <div className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-[1.5rem] border border-primary/8 bg-[#fbf8f3] p-6">
                            <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Total Logins</p>
                            <p className="mt-3 font-heading text-4xl text-primary">{logs.length}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-primary/8 bg-[#fbf8f3] p-6">
                            <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Latest Account</p>
                            <p className="mt-3 font-heading text-4xl text-primary">{logs[0]?.password_used ?? "-"}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-primary/8 bg-[#fbf8f3] p-6">
                            <p className="text-xs uppercase tracking-[0.26em] text-text-secondary">Latest Login</p>
                            <p className="mt-3 text-lg text-primary">{logs[0] ? new Date(logs[0].created_at).toLocaleString() : "-"}</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.8rem] border border-primary/10 bg-white shadow-[0_12px_34px_rgba(20,42,68,0.05)]">
                        <div className="grid grid-cols-[0.8fr_1.2fr] gap-4 border-b border-primary/8 bg-[#fbf8f3] px-6 py-4 text-xs uppercase tracking-[0.26em] text-text-secondary">
                            <div>Account Used</div>
                            <div>Time</div>
                        </div>
                        <div className="divide-y divide-primary/6">
                            {logs.map((log) => (
                                <div key={log.id} className="grid grid-cols-[0.8fr_1.2fr] gap-4 px-6 py-4 text-sm text-text-secondary">
                                    <div className="font-medium text-primary">{log.password_used}</div>
                                    <div>{new Date(log.created_at).toLocaleString()}</div>
                                </div>
                            ))}
                            {logs.length === 0 ? (
                                <div className="px-6 py-10 text-center text-text-secondary">No login history available.</div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </AdminFrame>
    );
}
