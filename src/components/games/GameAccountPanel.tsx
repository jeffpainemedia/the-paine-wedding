"use client";

import { useState, useSyncExternalStore } from "react";
import {
    captureBrowserProfile,
    clearStoredGamePlayer,
    fetchPlayerProfileByEmail,
    getStoredGamePlayer,
    saveStoredGamePlayer,
    type StoredGamePlayer,
} from "@/lib/games/leaderboard";
import { useAdminSession } from "@/hooks/useAdminSession";

export default function GameAccountPanel() {
    type AccountMode = "create" | "signin";

    const isClient = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
    const [savedPlayer, setSavedPlayer] = useState<StoredGamePlayer | null>(() => {
        if (typeof window === "undefined") return null;
        return getStoredGamePlayer();
    });
    const [firstName, setFirstName] = useState(() => {
        if (typeof window === "undefined") return "";
        const p = getStoredGamePlayer();
        if (!p) return "";
        // Support old username field as fallback
        return p.firstName ?? (p.username?.split(" ")[0] ?? "");
    });
    const [lastName, setLastName] = useState(() => {
        if (typeof window === "undefined") return "";
        const p = getStoredGamePlayer();
        if (!p) return "";
        return p.lastName ?? (p.username?.includes(" ") ? p.username.split(" ").slice(1).join(" ") : "");
    });
    const [email, setEmail] = useState(() => {
        if (typeof window === "undefined") return "";
        return getStoredGamePlayer()?.email ?? "";
    });
    const [signInEmail, setSignInEmail] = useState("");
    const [isEditing, setIsEditing] = useState(() => {
        if (typeof window === "undefined") return false;
        return !getStoredGamePlayer();
    });
    const [mode, setMode] = useState<AccountMode>("create");
    const [statusMessage, setStatusMessage] = useState("");
    const [statusKind, setStatusKind] = useState<"idle" | "error">("idle");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function getDisplayName(player: StoredGamePlayer): string {
        if (player.firstName && player.lastName) return `${player.firstName} ${player.lastName}`;
        if (player.firstName) return player.firstName;
        return player.username ?? "";
    }

    function handleSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStatusMessage("");
        setStatusKind("idle");
        setIsSubmitting(true);
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const browserProfile = captureBrowserProfile();
        saveStoredGamePlayer({
            username: fullName,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            browserProfile: browserProfile ?? undefined,
        });
        const stored = getStoredGamePlayer();
        setSavedPlayer(stored);
        setIsEditing(false);
        setMode("create");
        setIsSubmitting(false);
    }

    async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStatusMessage("");
        setStatusKind("idle");
        setIsSubmitting(true);

        try {
            const profile = await fetchPlayerProfileByEmail(signInEmail);
            if (!profile) {
                setStatusKind("error");
                setStatusMessage("No player profile found for that email.");
                setIsSubmitting(false);
                return;
            }

            const browserProfile = captureBrowserProfile();
            saveStoredGamePlayer({
                username: profile.username,
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                browserProfile: browserProfile ?? undefined,
            });
            const stored = getStoredGamePlayer();
            setSavedPlayer(stored);
            setFirstName(profile.firstName ?? "");
            setLastName(profile.lastName ?? "");
            setEmail(profile.email);
            setSignInEmail(profile.email);
            setIsEditing(false);
            setMode("create");
        } catch (error) {
            setStatusKind("error");
            setStatusMessage(error instanceof Error ? error.message : "Could not sign in right now.");
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleCancel() {
        if (savedPlayer) {
            setFirstName(savedPlayer.firstName ?? savedPlayer.username?.split(" ")[0] ?? "");
            setLastName(savedPlayer.lastName ?? (savedPlayer.username?.includes(" ") ? savedPlayer.username.split(" ").slice(1).join(" ") : ""));
            setEmail(savedPlayer.email);
            setMode("create");
            setStatusMessage("");
            setStatusKind("idle");
        }
        setIsEditing(false);
    }

    function handleLogout() {
        clearStoredGamePlayer();
        setSavedPlayer(null);
        setFirstName("");
        setLastName("");
        setEmail("");
        setSignInEmail("");
        setMode("signin");
        setStatusMessage("");
        setStatusKind("idle");
        setIsEditing(true);
    }

    const { isAdmin } = useAdminSession();

    if (!isClient) return null;

    // Admin bypass — show a read-only "testing" bar instead of signup/profile
    if (isAdmin) {
        return (
            <div className="rounded-[1.2rem] border border-accent/20 bg-accent/8 px-4 py-2.5">
                <div className="flex items-center gap-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-text-secondary whitespace-nowrap">Admin</p>
                    <span className="text-text-secondary/30 text-xs">·</span>
                    <p className="text-sm text-text-secondary">Testing mode — scores not recorded</p>
                </div>
            </div>
        );
    }

    // Collapsed display
    if (savedPlayer && !isEditing) {
        return (
            <div className="rounded-[1.2rem] border border-primary/10 bg-[linear-gradient(160deg,#fffaf4_0%,#f3ebe0_100%)] px-4 py-2.5 shadow-[0_4px_16px_rgba(20,42,68,0.07)]">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-3">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-text-secondary whitespace-nowrap">Player</p>
                        <span className="text-text-secondary/30 text-xs">·</span>
                        <p className="text-sm font-semibold text-primary truncate">{getDisplayName(savedPlayer)}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="rounded-full border border-primary/12 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary transition-colors duration-200 hover:bg-primary hover:text-white whitespace-nowrap"
                        >
                            Settings
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-full border border-secondary/18 bg-secondary/6 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-secondary transition-colors duration-200 hover:bg-secondary hover:text-white whitespace-nowrap"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Editing / setup form
    return (
        <div className="rounded-[1.65rem] border border-primary/10 bg-[linear-gradient(160deg,#fffaf4_0%,#f3ebe0_100%)] p-5 shadow-[0_12px_34px_rgba(20,42,68,0.08)] md:p-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-text-secondary">Player</p>
            <h3 className="mt-2 font-heading text-2xl text-primary md:text-[2rem]">
                {savedPlayer ? "Profile" : mode === "signin" ? "Log in" : "Sign up"}
            </h3>

            {!savedPlayer && (
                <div className="mt-5 inline-flex rounded-full border border-primary/10 bg-white p-1">
                    <button
                        type="button"
                        onClick={() => {
                            setMode("create");
                            setStatusMessage("");
                            setStatusKind("idle");
                        }}
                        className={`rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.22em] transition-colors ${
                            mode === "create" ? "bg-primary text-white" : "text-primary hover:bg-primary/6"
                        }`}
                    >
                        Sign Up
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMode("signin");
                            setStatusMessage("");
                            setStatusKind("idle");
                        }}
                        className={`rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.22em] transition-colors ${
                            mode === "signin" ? "bg-primary text-white" : "text-primary hover:bg-primary/6"
                        }`}
                    >
                        Log In
                    </button>
                </div>
            )}

            {savedPlayer || mode === "create" ? (
                <form className="mt-5 space-y-4" onSubmit={handleSave}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-text-secondary/60">First Name</p>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="w-full rounded-[1rem] border border-primary/12 bg-white px-4 py-3 text-text-primary outline-none transition-colors focus:border-accent"
                            />
                        </div>
                        <div>
                            <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-text-secondary/60">Last Name</p>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="w-full rounded-[1rem] border border-primary/12 bg-white px-4 py-3 text-text-primary outline-none transition-colors focus:border-accent"
                            />
                        </div>
                    </div>
                    <div>
                        <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-text-secondary/60">Email Address</p>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-[1rem] border border-primary/12 bg-white px-4 py-3 text-text-primary outline-none transition-colors focus:border-accent"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                            Save
                        </button>
                        {savedPlayer && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="rounded-full border border-primary/12 bg-white px-4 py-2 text-xs uppercase tracking-[0.22em] text-primary transition-colors duration-200 hover:bg-primary hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="rounded-full border border-secondary/18 bg-secondary/6 px-4 py-2 text-xs uppercase tracking-[0.22em] text-secondary transition-colors duration-200 hover:bg-secondary hover:text-white"
                                >
                                    Log Out
                                </button>
                            </>
                        )}
                    </div>
                </form>
            ) : (
                <form className="mt-5 space-y-4" onSubmit={handleSignIn}>
                    <div>
                        <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-text-secondary/60">Email Address</p>
                        <input
                            type="email"
                            value={signInEmail}
                            onChange={(e) => setSignInEmail(e.target.value)}
                            required
                            className="w-full rounded-[1rem] border border-primary/12 bg-white px-4 py-3 text-text-primary outline-none transition-colors focus:border-accent"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                            Log In
                        </button>
                    </div>
                </form>
            )}

            {statusMessage && statusKind === "error" ? (
                <p className="mt-4 text-sm text-secondary">{statusMessage}</p>
            ) : null}
        </div>
    );
}
