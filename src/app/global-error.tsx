"use client";

import Link from "next/link";

export default function GlobalError() {
    return (
        <html>
            <body className="bg-surface">
                <div className="flex min-h-screen items-center justify-center px-6 py-16 text-center">
                    <div className="surface-panel max-w-xl p-8 md:p-10">
                        <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Site error</p>
                        <h1 className="mt-4 font-heading text-4xl text-primary">Something went wrong.</h1>
                        <div className="mt-8">
                            <Link
                                href="/feedback"
                                className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.22em] text-white transition-colors hover:bg-primary/90"
                            >
                                Feedback
                            </Link>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
