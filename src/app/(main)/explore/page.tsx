import React from "react";
import Section from "@/components/ui/Section";
import { ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/explore",
    title: "Explore Dallas-Fort Worth",
    description: "Browse favorite Dallas, Fort Worth, and McKinney recommendations for wedding weekend activities, food, and day trips.",
    keywords: ["Dallas things to do", "Fort Worth", "McKinney", "wedding weekend activities"],
});

export default function Explore() {
    return (
        <div>
            {/* Hero */}
            <Section background="surface" className="text-center pb-14 pt-12 md:pb-16 md:pt-16">
                <h1 className="font-heading text-5xl md:text-6xl mb-6">Explore</h1>
                <p className="max-w-xl mx-auto text-text-secondary tracking-wide leading-relaxed">
                    You&apos;re in for a treat — DFW has something for everyone. Here are our
                    favorite picks to help you make the most of your trip.
                </p>
            </Section>

            <Section background="base" className="pb-12 pt-10 md:pb-14 md:pt-12">
                <div className="max-w-5xl mx-auto">

                    {/* State Fair callout */}
                    <div className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8 flex flex-col md:flex-row gap-5 items-start">
                        <div className="shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
                            <Star size={22} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-1">Happening Wedding Weekend</p>
                            <h3 className="font-heading text-xl text-amber-900 mb-2">State Fair of Texas — at Fair Park</h3>
                            <p className="text-sm text-amber-800 leading-relaxed mb-3">
                                The 2026 State Fair runs <strong>September 25 – October 18</strong>, which means Big Tex is in town the same weekend as our wedding! If you&apos;re flying in early or staying a few extra days, this is a bucket-list Texas experience: fried food competitions, live music, carnival rides, and the iconic auto show.
                            </p>
                            <a
                                href="https://bigtex.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 underline underline-offset-4 hover:text-amber-900 transition-colors"
                            >
                                <ExternalLink size={13} />
                                bigtex.com — Plan Your Visit
                            </a>
                            <p className="text-xs text-amber-700 mt-2">Tip: Take the DART Green Line to Fair Park Station — parking gets wild on weekends.</p>
                        </div>
                    </div>

                    {/* Attraction clusters */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">

                        {/* Arts & Culture */}
                        <div className="surface-panel p-6">
                            <h3 className="font-heading text-lg text-primary mb-4">Arts &amp; Culture</h3>
                            <ul className="space-y-3">
                                {[
                                    { name: 'Dallas Arts District', note: 'Free museums, sculpture garden, world-class performances — all within a few walkable blocks.', href: 'https://www.dallasartsdistrict.org/' },
                                    { name: 'Dallas Museum of Art', note: 'Free general admission. One of the largest art museums in the US.', href: 'https://www.dallasmuseumofart.org/' },
                                    { name: 'Nasher Sculpture Center', note: 'Stunning indoor/outdoor sculpture garden. Closed Mon–Tue.', href: 'https://www.nashersculpturecenter.org/visit/plan-a-visit' },
                                    { name: 'Perot Museum of Nature and Science', note: 'Hands-on science museum — great for families and the curious alike.', href: 'https://www.perotmuseum.org/visit/' },
                                    { name: 'The Sixth Floor Museum', note: 'The JFK museum at Dealey Plaza. Timed entry — book ahead.', href: 'https://www.jfk.org/plan-your-visit/' },
                                ].map((item) => (
                                    <li key={item.name} className="flex flex-col gap-0.5">
                                        <a href={item.href} target="_blank" rel="noopener noreferrer"
                                            className="text-sm font-medium text-primary hover:underline underline-offset-2 inline-flex items-center gap-1">
                                            {item.name} <ExternalLink size={11} className="opacity-50" />
                                        </a>
                                        <p className="text-xs text-text-secondary leading-relaxed">{item.note}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Food & Neighborhoods */}
                        <div className="surface-panel p-6">
                            <h3 className="font-heading text-lg text-primary mb-4">Food &amp; Neighborhoods</h3>
                            <ul className="space-y-3">
                                {[
                                    { name: 'Deep Ellum', note: "Live music, murals, legendary BBQ. Hit Terry Black's or Pecan Lodge for brisket.", href: 'https://www.visitdallas.com/neighborhoods/deep-ellum/' },
                                    { name: 'Bishop Arts District', note: "Oak Cliff's walkable boutique-and-brunch neighborhood. Great for a relaxed afternoon.", href: 'https://www.google.com/maps/search/?api=1&query=Bishop%20Arts%20District%20Dallas%20TX' },
                                    { name: 'Klyde Warren Park', note: 'The beloved deck park connecting Uptown to downtown. Food trucks + open lawn daily 6 AM–11 PM.', href: 'https://www.klydewarrenpark.org/' },
                                    { name: 'Legacy Hall', note: 'Massive food hall in Plano — dozens of choices, bars, and live programming. Great for groups.', href: 'https://legacyfoodhall.com/contact-us' },
                                    { name: 'Katy Trail Ice House', note: 'Enormous patio beer garden right off the Katy Trail in Uptown. Pet-friendly.', href: 'https://katyicehouse.com/' },
                                ].map((item) => (
                                    <li key={item.name} className="flex flex-col gap-0.5">
                                        <a href={item.href} target="_blank" rel="noopener noreferrer"
                                            className="text-sm font-medium text-primary hover:underline underline-offset-2 inline-flex items-center gap-1">
                                            {item.name} <ExternalLink size={11} className="opacity-50" />
                                        </a>
                                        <p className="text-xs text-text-secondary leading-relaxed">{item.note}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Day Trips */}
                        <div className="surface-panel p-6">
                            <h3 className="font-heading text-lg text-primary mb-4">Day Trips Worth the Drive</h3>
                            <ul className="space-y-3">
                                {[
                                    { name: 'Fort Worth Stockyards', note: 'Free twice-daily longhorn cattle drive at 11:30 AM & 4:00 PM. Pure Texas. Pair with Sundance Square for dinner.', href: 'https://www.fortworthstockyards.org/' },
                                    { name: 'Fort Worth Museum Triangle', note: 'Kimbell (free permanent collection) + Modern Art Museum + Amon Carter Museum — all walkable in the Cultural District.', href: 'https://kimbellart.org/visit' },
                                    { name: 'Meow Wolf Grapevine', note: 'Immersive walk-through art world — adults and kids both love it. Book tickets ahead for weekends.', href: 'https://tickets.meowwolf.com/grapevine/' },
                                    { name: 'Dallas Arboretum', note: 'Gorgeous botanical gardens on White Rock Lake. Pairs perfectly with a walk on the lake trail next door.', href: 'https://www.dallasarboretum.org/visitor-information/hours-and-admission/' },
                                ].map((item) => (
                                    <li key={item.name} className="flex flex-col gap-0.5">
                                        <a href={item.href} target="_blank" rel="noopener noreferrer"
                                            className="text-sm font-medium text-primary hover:underline underline-offset-2 inline-flex items-center gap-1">
                                            {item.name} <ExternalLink size={11} className="opacity-50" />
                                        </a>
                                        <p className="text-xs text-text-secondary leading-relaxed">{item.note}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* McKinney Local Guide */}
                        <div className="surface-panel p-6">
                            <h3 className="font-heading text-lg text-primary mb-1">McKinney Local Guide</h3>
                            <p className="text-xs text-text-secondary mb-4 uppercase tracking-widest font-medium">~38 miles from the venue · Recommended hotel hub</p>
                            <ul className="space-y-3">
                                {[
                                    { name: 'Historic Downtown McKinney', note: 'Charming walkable square with 120+ shops, restaurants, and a free trolley Thu–Sat.', href: 'https://www.visitmckinney.com/region-historic-downtown/' },
                                    { name: 'Adriatica Village', note: 'Croatian-inspired waterfront village with dining and scenic architecture. Great for dinner photos.', href: 'https://www.adriaticavillage.com/' },
                                    { name: 'Heard Natural Science Museum', note: '289-acre wildlife sanctuary and nature trails. Tue–Sat hours; free parking.', href: 'https://www.heardmuseum.org/' },
                                    { name: 'Chestnut Square Farmers Market', note: 'Saturday mornings (8–12 Apr–Dec). Regional producers and a lovely square setting.', href: 'https://www.chestnutsquare.org/farmers-market' },
                                ].map((item) => (
                                    <li key={item.name} className="flex flex-col gap-0.5">
                                        <a href={item.href} target="_blank" rel="noopener noreferrer"
                                            className="text-sm font-medium text-primary hover:underline underline-offset-2 inline-flex items-center gap-1">
                                            {item.name} <ExternalLink size={11} className="opacity-50" />
                                        </a>
                                        <p className="text-xs text-text-secondary leading-relaxed">{item.note}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>

                    <p className="text-center text-xs text-text-secondary">
                        Visiting from out of town? The{" "}
                        <a href="https://www.visitdallas.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary transition-colors">Visit Dallas</a>
                        {" "}and{" "}
                        <a href="https://www.visitmckinney.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary transition-colors">Visit McKinney</a>
                        {" "}tourism sites have full event calendars and more local tips.
                    </p>
                </div>
            </Section>
        </div>
    );
}
