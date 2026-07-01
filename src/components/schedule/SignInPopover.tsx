"use client";

import { useRef, useState } from "react";

type Props = {
    onSignedIn: (displayName: string, tierLabel: string) => void;
};

export default function SignInPopover({ onSignedIn }: Props) {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/schedule/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password: password.trim() }),
            });
            const data = await res.json() as { ok?: boolean; displayName?: string; tierLabel?: string; error?: string };

            if (!res.ok || !data.ok) {
                setError(data.error ?? "Invalid username or password.");
                setLoading(false);
                return;
            }

            // Store game profile from schedule account
            if (data.displayName) {
                try {
                    const stored = window.localStorage.getItem("wedding-game-player");
                    const current = stored ? JSON.parse(stored) as Record<string, unknown> : {};
                    window.localStorage.setItem("wedding-game-player", JSON.stringify({
                        ...current,
                        username: data.displayName,
                        firstName: data.displayName.split(" ")[0],
                        lastName: data.displayName.split(" ").slice(1).join(" "),
                    }));
                } catch { /* non-fatal */ }
            }

            onSignedIn(data.displayName ?? "", data.tierLabel ?? "");
            setOpen(false);
            setUsername("");
            setPassword("");
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary backdrop-blur-sm transition-colors hover:bg-white print:hidden"
            >
                Sign In
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />
                    {/* Popover */}
                    <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-[1.5rem] border border-primary/10 bg-white p-6 shadow-[0_16px_48px_rgba(20,42,68,0.14)]">
                        <p className="text-xs uppercase tracking-[0.3em] text-accent">Bridal Party</p>
                        <h3 className="mt-1 font-heading text-xl text-primary">Sign in</h3>
                        <p className="mt-1.5 text-xs text-text-secondary">Access your expanded schedule.</p>

                        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-3">
                            <input
                                type="text"
                                autoCapitalize="off"
                                autoCorrect="off"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-xl border border-primary/15 bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-text-secondary focus:border-primary/40 focus:outline-none"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-primary/15 bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-text-secondary focus:border-primary/40 focus:outline-none"
                            />
                            {error && <p className="text-xs text-secondary">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading || !username || !password}
                                className="w-full rounded-full bg-primary py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-opacity disabled:opacity-50"
                            >
                                {loading ? "Signing in…" : "Sign In"}
                            </button>
                        </form>
                        <p className="mt-4 text-center text-[10px] text-text-secondary">
                            Forgot your login? Ask Ashlyn or Jeff.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
