import React from "react";
import Section from "@/components/ui/Section";
import { MapPin, Shirt, CalendarHeart, Info, UtensilsCrossed } from "lucide-react";
import { getWeddingData } from "@/lib/site-settings";
import Link from "next/link";
import { requirePageVisible } from "@/lib/page-visibility";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/wedding-details",
    title: "Wedding Details",
    description: "Get the key wedding details for Ashlyn and Jeffrey's celebration, including venue information, timing, and guest guidance.",
    keywords: ["wedding details", "venue details", "guest information"],
});

export default async function WeddingDetails() {
    await requirePageVisible("wedding-details");
    const { wedding } = await getWeddingData();

    const details = [
        {
            title: "The Venue",
            icon: CalendarHeart,
            content: (
                <>
                    <p
                        className="font-medium text-lg mb-2"
                        data-admin-key="venue.name"
                        data-admin-type="text"
                        data-admin-current-text={wedding.venue.name}
                        data-admin-label="Venue Name"
                    >
                        {wedding.venue.name}
                    </p>
                    <p
                        data-admin-key="venue.address"
                        data-admin-type="text"
                        data-admin-current-text={wedding.venue.address}
                        data-admin-label="Venue Address"
                    >
                        {wedding.venue.address}
                    </p>
                    <p>{wedding.venue.city}</p>
                    {wedding.venue.ceremonyTime !== "TBD" && (
                        <p
                            className="mt-2 text-sm font-medium tracking-widest uppercase text-accent"
                            data-admin-key="venue.ceremonyTime"
                            data-admin-type="text"
                            data-admin-current-text={wedding.venue.ceremonyTime}
                            data-admin-label="Ceremony Time"
                        >
                            Ceremony at {wedding.venue.ceremonyTime}
                        </p>
                    )}
                    <Link
                        href={wedding.venue.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block text-sm underline decoration-accent/60 underline-offset-4 text-primary/70 hover:text-primary transition-colors"
                    >
                        View on Google Maps
                    </Link>
                </>
            ),
        },
        {
            title: "Attire",
            icon: Shirt,
            content: (
                <>
                    <p
                        className="font-medium text-lg mb-2"
                        data-admin-key="dresscode.short"
                        data-admin-type="text"
                        data-admin-current-text={wedding.dresscode.short}
                        data-admin-label="Dress Code (Short)"
                    >
                        {wedding.dresscode.short === "TBD" ? "Details Coming Soon" : wedding.dresscode.short}
                    </p>
                    {wedding.dresscode.short !== "TBD" ? (
                        <>
                            <p
                                className="text-sm"
                                data-admin-key="dresscode.summary"
                                data-admin-type="rich-text"
                                data-admin-current-text={wedding.dresscode.summary}
                                data-admin-label="Dress Code Summary"
                            >
                                {wedding.dresscode.summary}
                            </p>
                            <Link
                                href="/attire"
                                className="mt-4 inline-block text-sm underline decoration-accent/60 underline-offset-4 text-primary/70 hover:text-primary transition-colors"
                            >
                                View Attire Details
                            </Link>
                        </>
                    ) : (
                        <p className="text-sm">Full attire details will be posted soon.</p>
                    )}
                </>
            ),
        },
        {
            title: "Getting There",
            icon: MapPin,
            content: (
                <>
                    <p className="font-medium text-lg mb-2">Parking &amp; Transport</p>
                    <p
                        data-admin-key="venue.parking"
                        data-admin-type="rich-text"
                        data-admin-current-text={wedding.venue.parking}
                        data-admin-label="Parking Info"
                    >
                        {wedding.venue.parking === "TBD"
                            ? "Parking details coming soon."
                            : wedding.venue.parking}
                    </p>
                    {wedding.venue.shuttle !== "TBD" && wedding.venue.shuttle !== "none" && (
                        <p
                            className="mt-2"
                            data-admin-key="venue.shuttle"
                            data-admin-type="rich-text"
                            data-admin-current-text={wedding.venue.shuttle}
                            data-admin-label="Shuttle Info"
                        >
                            {wedding.venue.shuttle}
                        </p>
                    )}
                    {wedding.venue.shuttle === "none" && (
                        <p className="mt-2 text-sm">
                            No shuttle service is provided. Please arrange your own transportation.
                        </p>
                    )}
                </>
            ),
        },
        {
            title: "Food & Drinks",
            icon: UtensilsCrossed,
            content: (
                <>
                    <p className="font-medium text-lg mb-2">Catered by Urban Crust</p>
                    <p className="text-sm mb-3">
                        Dinner will be wood-fired pizza from{" "}
                        <a
                            href="https://www.urbancrust.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4 text-primary/70 hover:text-primary transition-colors"
                        >
                            Urban Crust
                        </a>
                        , one of DFW&apos;s favorite artisan pizzerias.
                    </p>
                    {/* Pizza options will be listed here — coming soon */}
                    <div className="mt-3 space-y-1.5 text-sm text-left">
                        <p className="text-xs uppercase tracking-widest text-text-secondary mb-2">Pizza Selection</p>
                        <p className="text-text-secondary italic text-xs">Details coming soon — stay tuned!</p>
                    </div>
                    <p className="mt-4 text-sm">
                        We&apos;ll also have a beer &amp; wine open bar. Please do not bring outside alcohol per our venue&apos;s policy.
                    </p>
                </>
            ),
        },
        {
            title: "Day Of",
            icon: Info,
            content: (
                <>
                    <p className="font-medium text-lg mb-2">{wedding.date.dayOfWeek}</p>
                    <p
                        data-admin-key="date.display"
                        data-admin-type="text"
                        data-admin-current-text={wedding.date.display}
                        data-admin-label="Wedding Date Display"
                    >
                        {wedding.date.display}
                    </p>
                    <p className="mt-2 text-sm">
                        RSVP by{" "}
                        <span
                            className="font-medium"
                            data-admin-key="date.rsvpDeadline"
                            data-admin-type="text"
                            data-admin-current-text={wedding.date.rsvpDeadline}
                            data-admin-label="RSVP Deadline"
                        >
                            {wedding.date.rsvpDeadline}
                        </span>
                    </p>
                </>
            ),
        },
    ];

    return (
        <div>
            <Section background="surface" className="pb-14 pt-12 md:pb-16 md:pt-16">
                <div className="max-w-2xl">
                    <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-accent md:text-xs">
                        The Details
                    </p>
                    <h1 className="font-heading text-5xl md:text-7xl mb-6 text-primary">
                        Wedding <span className="italic">Details</span>
                    </h1>
                    <p className="max-w-2xl text-text-secondary tracking-wide leading-relaxed">
                        Everything you need to know about our special day to celebrate with us.
                    </p>
                </div>
            </Section>

            <Section background="base" className="pt-12 md:pt-16">
                <div className="max-w-4xl mx-auto">
                    {details.map((detail, idx) => {
                        const Icon = detail.icon;
                        return (
                            <div
                                key={idx}
                                className="grid md:grid-cols-[1fr_2fr] gap-3 md:gap-10 py-10 border-t border-primary/10 first:border-t-0 md:first:border-t md:first:pt-0"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={20} strokeWidth={1.5} className="text-accent shrink-0" />
                                    <h2 className="font-heading text-2xl md:text-3xl text-primary">{detail.title}</h2>
                                </div>
                                <div className="text-text-secondary leading-relaxed space-y-1">
                                    {detail.content}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Section>
        </div>
    );
}
