"use client";

import Link from "next/link";

export default function Error({
    error: _error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[70vh] items-center justify-center bg-surface px-6 py-16 text-center">
            <div className="surface-panel max-w-xl p-8 md:p-10">
                <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Something went wrong</p>
                <h1 className="mt-4 font-heading text-4xl text-primary">Please try that again.</h1>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.22em] text-white transition-colors hover:bg-primary/90"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/feedback"
                        className="rounded-full border border-primary/20 px-6 py-3 text-sm uppercase tracking-[0.22em] text-primary transition-colors hover:bg-primary/5"
                    >
                        Feedback
                    </Link>
                </div>
            </div>
        </div>
    );
}
