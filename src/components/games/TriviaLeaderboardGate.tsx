"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining, getTriviaUnlockDate } from "@/lib/games/schedule";
import { useAdminSession } from "@/hooks/useAdminSession";

// Hides the trivia leaderboard until trivia goes live on the wedding day.
// Admins always see it (so they can monitor scores once gameplay starts).
// Renders nothing pre-unlock so the page doesn't show empty leaderboard
// scaffolding alongside the locked-game countdown.
export default function TriviaLeaderboardGate({ children }: { children: React.ReactNode }) {
    const [unlocked, setUnlocked] = useState(() => getTimeRemaining(getTriviaUnlockDate()).isUnlocked);
    const { isAdmin } = useAdminSession();

    useEffect(() => {
        if (unlocked) return;
        const interval = window.setInterval(() => {
            const remaining = getTimeRemaining(getTriviaUnlockDate());
            if (remaining.isUnlocked) {
                setUnlocked(true);
                window.clearInterval(interval);
            }
        }, 1000);
        return () => window.clearInterval(interval);
    }, [unlocked]);

    if (unlocked || isAdmin) return <>{children}</>;
    return null;
}
