"use client";

type Props = {
    displayName: string;
    tierLabel: string;
    roleLabel?: string;
    onLogout: () => void;
};

export default function TierBadge({ displayName, tierLabel, roleLabel, onLogout }: Props) {
    return (
        <div className="flex items-center gap-2.5 print:hidden">
            <div className="rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-accent">{tierLabel}</span>
                <span className="mx-1.5 text-accent/30">·</span>
                <span className="text-[10px] text-primary">{roleLabel ? `${roleLabel} · ` : ""}{displayName}</span>
            </div>
            <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-primary/15 bg-white/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-text-secondary transition-colors hover:border-secondary/30 hover:text-secondary"
            >
                Log out
            </button>
        </div>
    );
}
