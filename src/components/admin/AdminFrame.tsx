"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AdminSection = "rsvp" | "games" | "security" | "content" | "feedback";

type AdminFrameProps = {
    section: AdminSection;
    role: string;
    title: string;
    description?: string;
    onLogout: () => Promise<void>;
    children: ReactNode;
};

const ADMIN_LINKS: Array<{ label: string; href: string; section: AdminSection }> = [
    { label: "RSVP", href: "/admin", section: "rsvp" },
    { label: "Games", href: "/admin/games", section: "games" },
    { label: "Feedback", href: "/admin/feedback", section: "feedback" },
    { label: "Content", href: "/admin/content", section: "content" },
    { label: "Security", href: "/admin/security", section: "security" },
];

export default function AdminFrame({
    section,
    role,
    title,
    description,
    onLogout,
    children,
}: AdminFrameProps) {
    return (
        <div className="min-h-screen bg-surface">
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
                <div className="rounded-[2rem] border border-primary/10 bg-white p-5 shadow-[0_18px_52px_rgba(20,42,68,0.06)] md:p-8">
                    <div className="flex flex-col gap-5 border-b border-primary/10 pb-5 md:pb-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Admin</p>
                            <h1 className="mt-3 font-heading text-3xl text-primary md:text-4xl">{title}</h1>
                            {description && (
                                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">{description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Role indicator — plain label, not a button */}
                            <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-text-secondary">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                {role}
                            </span>
                            <button
                                type="button"
                                onClick={() => { void onLogout(); }}
                                className="rounded-full border border-secondary/30 bg-secondary/8 px-4 py-2 text-xs uppercase tracking-[0.22em] text-secondary transition-colors duration-200 hover:bg-secondary hover:text-white"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-b border-primary/10 pb-5 md:mt-6 md:gap-3 md:pb-6">
                        {ADMIN_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors duration-200 md:px-4 md:py-2 md:text-xs md:tracking-[0.24em] ${
                                    section === link.section
                                        ? "bg-primary text-white"
                                        : "border border-primary/12 bg-[#fbf8f3] text-primary hover:bg-primary/5"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="mt-6 md:mt-8">{children}</div>
                </div>
            </div>
        </div>
    );
}
