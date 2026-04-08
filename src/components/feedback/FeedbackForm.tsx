"use client";

import { useEffect, useMemo, useState } from "react";

type FeedbackCategory = "bug" | "content" | "suggestion" | "other";

const CATEGORY_OPTIONS: Array<{ value: FeedbackCategory; label: string }> = [
    { value: "bug", label: "Bug" },
    { value: "content", label: "Content" },
    { value: "suggestion", label: "Suggestion" },
    { value: "other", label: "Other" },
];

export default function FeedbackForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [category, setCategory] = useState<FeedbackCategory>("bug");
    const [page, setPage] = useState("");
    const [message, setMessage] = useState("");
    const [company, setCompany] = useState("");
    const [startedAt, setStartedAt] = useState(() => Date.now());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const currentPath = `${window.location.pathname}${window.location.search}`;
        const pageParam = new URLSearchParams(window.location.search).get("page");
        setPage(pageParam || currentPath);
        setStartedAt(Date.now());
    }, []);

    const context = useMemo(() => {
        if (typeof window === "undefined") return "feedback-page";
        return `${window.innerWidth}x${window.innerHeight}`;
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({
                    name,
                    email,
                    category,
                    page,
                    message,
                    company,
                    startedAt,
                    context,
                    browserLanguage: typeof navigator !== "undefined" ? navigator.language : null,
                }),
            });

            const data = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok || !data.ok) {
                throw new Error(data.error ?? "Could not send feedback right now.");
            }

            setSubmitted(true);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Could not send feedback right now.");
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="surface-panel mx-auto max-w-3xl p-8 text-left md:p-10">
                <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Thank you</p>
                <h2 className="mt-3 font-heading text-4xl text-primary">Feedback sent</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary md:text-base">
                    We got it. Jeff built this site, so bugs are very possible, and we really appreciate the patience and the heads-up.
                    If something feels urgent, you can still reach out to Jeff or Ash directly too.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="surface-panel mx-auto max-w-3xl p-6 text-left shadow-[0_24px_70px_rgba(8,16,28,0.12)] md:p-10">
            <div className="grid gap-5 md:grid-cols-2">
                <div>
                    <label className="block text-xs uppercase tracking-[0.22em] text-text-secondary">Your name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-primary/12 bg-white px-4 py-3 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-[0.22em] text-text-secondary">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-primary/12 bg-white px-4 py-3 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                    />
                </div>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                <div>
                    <label className="block text-xs uppercase tracking-[0.22em] text-text-secondary">Type</label>
                    <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
                        className="mt-2 w-full rounded-xl border border-primary/12 bg-white px-4 py-3 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                    >
                        {CATEGORY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-[0.22em] text-text-secondary">Page</label>
                    <input
                        type="text"
                        value={page}
                        onChange={(event) => setPage(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-primary/12 bg-white px-4 py-3 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                    />
                </div>
            </div>

            <div className="mt-5">
                <label className="block text-xs uppercase tracking-[0.22em] text-text-secondary">What happened?</label>
                <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={7}
                    className="mt-2 w-full rounded-[1.2rem] border border-primary/12 bg-white px-4 py-4 text-sm text-text-primary focus:border-primary/40 focus:outline-none"
                />
            </div>

            <div className="hidden" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input
                    id="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                />
            </div>

            {error ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="max-w-xl text-sm leading-6 text-text-secondary">
                    If something on the site feels off, broken, or confusing, send it here and we’ll use it to fix the next round quickly.
                </p>
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-[0.22em] text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                    {submitting ? "Sending..." : "Send Feedback"}
                </button>
            </div>
        </form>
    );
}
