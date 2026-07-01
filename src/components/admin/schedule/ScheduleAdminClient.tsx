"use client";

import AdminFrame from "@/components/admin/AdminFrame";
import AdminLoginCard from "@/components/admin/AdminLoginCard";
import { useAdminSession } from "@/components/admin/useAdminSession";
import { useState } from "react";
import EventsPanel from "./EventsPanel";
import TiersPanel from "./TiersPanel";
import UsersPanel from "./UsersPanel";
import ActivityLogPanel from "./ActivityLogPanel";

type Tab = "events" | "users" | "tiers" | "activity";

const TABS: { id: Tab; label: string }[] = [
    { id: "events",   label: "Events" },
    { id: "users",    label: "Users" },
    { id: "tiers",    label: "Tiers" },
    { id: "activity", label: "Activity Log" },
];

export default function ScheduleAdminClient() {
    const { status, role, login, logout } = useAdminSession();
    const [tab, setTab] = useState<Tab>("events");

    if (status === "checking") return <div className="min-h-screen bg-base" />;
    if (status !== "authenticated") return <AdminLoginCard onLogin={login} />;

    return (
        <AdminFrame
            section="schedule"
            role={role}
            title="Schedule Admin"
            description="Manage the day-of schedule, user access, tiers, and view login activity."
            onLogout={logout}
        >
            {/* Sub-tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                            tab === t.id
                                ? "bg-accent text-white"
                                : "border border-primary/12 bg-[#fbf8f3] text-primary hover:bg-primary/5"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "events"   && <EventsPanel />}
            {tab === "users"    && <UsersPanel />}
            {tab === "tiers"    && <TiersPanel />}
            {tab === "activity" && <ActivityLogPanel />}
        </AdminFrame>
    );
}
