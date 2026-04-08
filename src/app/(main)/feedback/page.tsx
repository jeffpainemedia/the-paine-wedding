import type { Metadata } from "next";
import Section from "@/components/ui/Section";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
    path: "/feedback",
    title: "Feedback",
    description: "Report bugs, confusing moments, or content issues on The Paine Wedding site.",
    keywords: ["wedding website feedback", "bug report", "site feedback"],
});

export default function FeedbackPage() {
    return (
        <Section background="surface" className="py-14 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs uppercase tracking-[0.28em] text-text-secondary">Feedback</p>
                <h1 className="mt-4 font-heading text-5xl text-primary md:text-6xl">Found something off?</h1>
                <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-text-secondary md:text-base">
                    If the site feels broken, confusing, or just a little weird, send us a note here. Jeff built the site,
                    so bugs are very possible, and we genuinely appreciate the patience and help.
                </p>
            </div>
            <div className="mt-10 md:mt-12">
                <FeedbackForm />
            </div>
        </Section>
    );
}
