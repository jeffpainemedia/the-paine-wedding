import React from "react";
import Link from "next/link";
import Section from "@/components/ui/Section";
import { getWeddingData } from "@/lib/site-settings";
import { MapPin, Plane, ExternalLink, Phone } from "lucide-react";
import { requirePageVisible } from "@/lib/page-visibility";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
    path: "/travel",
    title: "Travel & Stay",
    description: "Find hotels, airports, directions, and venue travel details for Ashlyn and Jeffrey's wedding weekend.",
    keywords: ["travel", "hotels", "wedding venue directions", "Celeste Texas hotels"],
});

export default async function Travel() {
    await requirePageVisible("travel");
    const { wedding } = await getWeddingData();

    const greenvilleHotels = wedding.hotels.filter((h) => h.hub === 'Greenville');
    const mckinneyHotels = wedding.hotels.filter((h) => h.hub === 'McKinney');
    const nearbyRentals = wedding.hotels.filter((h) => h.hub === 'Farmersville' || h.hub === 'Princeton');

    return (
        <div>
            {/* Hero */}
            <Section background="surface" className="text-center pb-14 pt-12 md:pb-16 md:pt-16">
                <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-accent md:text-xs">
                    Getting There
                </p>
                <h1 className="font-heading text-4xl md:text-6xl mb-6">Travel &amp; Stay</h1>
                <p className="max-w-xl mx-auto text-text-secondary tracking-wide leading-relaxed">
                    Everything you need to get here and settle in. The venue is located in the
                    northeast Texas countryside — about an hour from Dallas.
                </p>
            </Section>

            {/* Map + Venue Info */}
            <Section background="base" className="py-16">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="w-full aspect-square rounded-[1.7rem] bg-primary/5 shadow-[0_20px_44px_rgba(20,42,68,0.09)] relative overflow-hidden group border border-primary/10">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3303.3!2d-96.1374!3d33.3287!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864c6d2b4d0a7b5d%3A0x0!2sDavis+%26+Grey+Farms!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                                className="absolute inset-0 w-full h-full"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                title="Davis &amp; Grey Farms location"
                            />
                        </div>
                        <p className="text-center text-xs text-text-secondary mt-3 tracking-wider uppercase">
                            Davis &amp; Grey Farms — {wedding.venue.fullAddress}
                        </p>
                        <div className="text-center mt-2">
                            <a
                                href="https://www.google.com/maps?q=2975+County+Road+1110+Celeste+TX+75423"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm underline underline-offset-4 text-primary/70 hover:text-primary transition-colors inline-flex items-center gap-1"
                            >
                                <MapPin size={14} />
                                Open in Google Maps
                            </a>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="font-heading text-3xl text-primary">Getting to the Venue</h2>
                        <div className="space-y-4 text-text-secondary leading-relaxed">
                            <p>
                                <span className="font-medium text-primary">Davis &amp; Grey Farms</span> is located at{" "}
                                <a
                                    href="https://www.google.com/maps?q=2975+County+Road+1110+Celeste+TX+75423"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2 hover:text-primary transition-colors"
                                >
                                    2975 CR 1110, Celeste, TX 75423
                                </a>.
                            </p>
                            <div className="border border-accent/30 bg-accent/10 rounded-[4px] p-4 text-sm text-text-primary">
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Note</p>
                                <strong className="font-medium">Bus &amp; large vehicle note:</strong> Use FM 2194 for easier access to the venue.
                            </div>
                            <p className="text-sm">
                                The venue is a rural property — please follow GPS directions carefully.
                                There is on-site parking; please park in the designated lot and do not park on the grass.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">Drive Times from Major Airports</h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'Dallas Love Field (DAL)', time: '~1 hr 4 min · ~70 miles', href: 'https://www.google.com/maps/dir/Dallas+Love+Field/2975+CR+1110+Celeste+TX+75423' },
                                    { label: 'DFW International (DFW)', time: '~1 hr 20 min · ~72 miles', href: 'https://www.google.com/maps/dir/Dallas+Fort+Worth+International+Airport/2975+CR+1110+Celeste+TX+75423' },
                                ].map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 rounded-[4px] border border-primary/10 hover:border-primary/20 hover:bg-surface/40 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Plane size={15} className="text-primary/60 shrink-0" />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </div>
                                        <span className="text-xs text-text-secondary group-hover:text-primary transition-colors">{item.time}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Airports */}
            <Section background="surface" className="py-16">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-heading text-3xl text-center text-primary mb-4">Nearest Airports</h2>
                    <p className="text-center text-text-secondary mb-10 max-w-lg mx-auto">
                        We recommend renting a car at the airport — the venue is rural and ride-share availability can be limited late at night.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                        {wedding.travel.airports.map((airport) => (
                            <div key={airport.code} className="surface-panel p-8">
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="font-heading text-xl text-primary pr-4">{airport.name}</h3>
                                    <span className="text-sm font-bold tracking-widest text-accent uppercase shrink-0 bg-surface px-2 py-1 rounded">
                                        {airport.code}
                                    </span>
                                </div>
                                <p className="text-text-secondary leading-relaxed mb-4 text-sm">{airport.description}</p>
                                <a
                                    href={airport.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm underline underline-offset-4 text-primary/70 hover:text-primary transition-colors inline-flex items-center gap-1"
                                >
                                    <ExternalLink size={13} />
                                    Airport Website
                                </a>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 surface-panel p-6 text-center">
                        <p className="text-sm text-text-secondary">
                            <span className="font-medium text-primary">McKinney National Airport (TKI)</span> is also nearby and is undergoing a commercial expansion —
                            Avelo Airlines is the first committed carrier, with service expected in late 2026.
                        </p>
                    </div>
                </div>
            </Section>

            {/* Accommodations */}
            <Section background="base" className="py-20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="font-heading text-3xl text-primary mb-3">Where to Stay</h2>
                        <p className="text-text-secondary max-w-xl mx-auto">
                            Lodging near the venue is limited — we recommend booking early!
                            The two closest hotel clusters are Greenville (~13 mi) and McKinney (~38 mi).
                        </p>
                    </div>

                    {/* Greenville Hotels */}
                    <div className="mb-14">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-px flex-1 bg-primary/10" />
                            <div className="text-center">
                                <h3 className="font-heading text-xl text-primary">Greenville Area</h3>
                                <p className="text-xs text-text-secondary uppercase tracking-widest mt-0.5">~13 miles · ~19 min from venue</p>
                            </div>
                            <div className="h-px flex-1 bg-primary/10" />
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {greenvilleHotels.map((hotel) => (
                                <HotelCard key={hotel.name} hotel={hotel} />
                            ))}
                        </div>
                    </div>

                    {/* McKinney Hotels */}
                    <div className="mb-14">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-px flex-1 bg-primary/10" />
                            <div className="text-center">
                                <h3 className="font-heading text-xl text-primary">McKinney Area</h3>
                                <p className="text-xs text-text-secondary uppercase tracking-widest mt-0.5">~38 miles · ~51 min from venue</p>
                            </div>
                            <div className="h-px flex-1 bg-primary/10" />
                        </div>
                        <p className="text-sm text-text-secondary mb-6 text-center max-w-lg mx-auto">
                            A lovely destination stay with McKinney&apos;s walkable historic downtown, 120+ shops, and great dining. A longer drive from the venue but a memorable experience.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            {mckinneyHotels.map((hotel) => (
                                <HotelCard key={hotel.name} hotel={hotel} />
                            ))}
                        </div>
                    </div>

                    {/* Nearby Rentals */}
                    {nearbyRentals.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px flex-1 bg-primary/10" />
                                <div className="text-center">
                                    <h3 className="font-heading text-xl text-primary">Short-Term Rentals</h3>
                                    <p className="text-xs text-text-secondary uppercase tracking-widest mt-0.5">Closest private options</p>
                                </div>
                                <div className="h-px flex-1 bg-primary/10" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                {nearbyRentals.map((hotel) => (
                                    <HotelCard key={hotel.name} hotel={hotel} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Section>

            {/* Transportation Tips */}
            <Section background="surface" className="py-16">
                <div className="max-w-3xl mx-auto">
                    <h2 className="font-heading text-3xl text-center text-primary mb-10">Getting Around</h2>
                    <div className="divide-y divide-primary/10 border-t border-primary/10">
                        {[
                            {
                                number: '01',
                                title: 'Rental Car',
                                description: 'Best option for flexibility. All major rental companies are available at both DFW and Love Field airports.',
                            },
                            {
                                number: '02',
                                title: 'Shuttle / Charter',
                                description: 'Great for groups! If your hotel plans a shuttle, coordinate with your group. Minimizes impaired-driving risk after the reception.',
                            },
                            {
                                number: '03',
                                title: 'Ride-Share',
                                description: 'Works in the Dallas metro but can be unreliable for late-night rural pickups. Have a backup plan if you rely on Uber/Lyft.',
                            },
                        ].map(({ number, title, description }) => (
                            <div key={title} className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 py-6">
                                <span className="font-heading text-3xl text-accent shrink-0 md:w-14">{number}</span>
                                <div>
                                    <h3 className="font-medium text-base mb-1.5 text-text-primary">{title}</h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section background="surface" className="py-8 text-center">
                <p className="text-sm text-text-secondary">
                    Have questions about parking, shuttles, or the area?{" "}
                    <Link href="/faq" className="text-primary underline underline-offset-2">Check our FAQ</Link>
                </p>
            </Section>
        </div>
    );
}

function HotelCard({ hotel }: { hotel: { name: string; distance: string; description: string; address: string; phone: string; bookingUrl: string; hub: string; badge: string } }) {
    return (
        <div className="bg-white rounded-[1.5rem] border border-primary/10 p-6 shadow-[0_8px_24px_rgba(20,42,68,0.06)] flex flex-col hover:shadow-[0_12px_32px_rgba(20,42,68,0.1)] hover:-translate-y-0.5 transition-all duration-200">
            {hotel.badge ? (
                <span className="inline-block mb-3 text-[11px] font-semibold uppercase tracking-widest text-accent bg-accent/10 px-2.5 py-1 rounded-full self-start">
                    {hotel.badge}
                </span>
            ) : null}
            <h3 className="font-heading text-base text-primary mb-1 leading-snug">{hotel.name}</h3>
            <p className="text-xs font-medium text-accent uppercase tracking-wider mb-3">{hotel.distance}</p>
            <p className="text-sm text-text-secondary leading-relaxed flex-1 mb-4">{hotel.description}</p>
            <div className="space-y-2 mb-4">
                <div className="flex items-start gap-1.5 text-xs text-text-secondary">
                    <MapPin size={12} className="shrink-0 mt-0.5 text-primary/50" />
                    <span>{hotel.address}</span>
                </div>
                {hotel.phone ? (
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Phone size={12} className="shrink-0 text-primary/50" />
                        <a href={`tel:${hotel.phone.replace(/[^0-9+]/g, '')}`} className="py-1 -my-1 hover:text-primary transition-colors">{hotel.phone}</a>
                    </div>
                ) : null}
            </div>
            <a
                href={hotel.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-widest border border-primary/25 text-primary px-4 py-2.5 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
            >
                <ExternalLink size={12} />
                Book Now
            </a>
        </div>
    );
}
