"use client";

import { useEffect, useState } from "react";
import { CROSSWORD_UNLOCK_LABEL, getCrosswordUnlockDate, getTimeRemaining } from "@/lib/games/schedule";
import { useAdminSession } from "@/hooks/useAdminSession";

type CrosswordGateProps = {
    children: React.ReactNode;
};

export default function CrosswordGate({ children }: CrosswordGateProps) {
    const [remaining, setRemaining] = useState(() => getTimeRemaining(getCrosswordUnlockDate()));
    const { isAdmin } = useAdminSession();

    useEffect(() => {
        const interval = window.setInterval(() => {
            setRemaining(getTimeRemaining(getCrosswordUnlockDate()));
        }, 1000);

        return () => window.clearInterval(interval);
    }, []);

    if (remaining.isUnlocked || isAdmin) {
        return <>{children}</>;
    }

    return (
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-[linear-gradient(150deg,#fffaf4_0%,#f2ece3_52%,#e6eef2_100%)] p-8 shadow-[0_20px_60px_rgba(20,42,68,0.10)] md:p-10">
            <div className="pointer-events-none absolute -right-10 top-0 h-44 w-44 rounded-full bg-accent/16 blur-3xl" />
            <p className="relative text-sm uppercase tracking-[0.3em] text-text-secondary">Locked</p>
            <h2 className="relative mt-4 font-heading text-4xl text-primary">Crossword Opens One Week Out</h2>
            <p className="relative mt-4 max-w-2xl leading-relaxed text-text-secondary">
                This puzzle goes live on {CROSSWORD_UNLOCK_LABEL} so guests can start warming up before the wedding week.
            </p>

            <div className="relative mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                    { label: "Days", value: remaining.days },
                    { label: "Hours", value: remaining.hours },
                    { label: "Minutes", value: remaining.minutes },
                    { label: "Seconds", value: remaining.seconds },
                ].map((item) => (
                    <div key={item.label} className="rounded-[1.5rem] border border-primary/8 bg-white/82 p-5 text-center">
                        <p className="font-heading text-4xl text-primary">{item.value}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.24em] text-text-secondary">{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
