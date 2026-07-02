import React from "react";
import type { Metadata } from "next";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { getWeddingData } from "@/lib/site-settings";
import HeroImage from "@/components/ui/HeroImage";
import { buildPageMetadata } from "@/lib/seo";

// Always fetch fresh from Supabase — prevents stale hero image flash after admin changes
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { wedding } = await getWeddingData();
  return buildPageMetadata({
    path: "/",
    absoluteTitle: wedding.meta.title,
    description: wedding.meta.description,
    keywords: ["wedding website", "wedding RSVP", "wedding registry", "wedding travel"],
  });
}

export default async function Home() {
  const { wedding, images, overlays, content } = await getWeddingData();

  return (
    <>
      {/* Hero Section — data-admin-key lets the AdminEditBar intercept clicks in edit mode */}
        <section
            className="relative w-full h-dvh min-h-[600px] flex items-center justify-center overflow-hidden"
            data-admin-key="images.hero"
        data-admin-type="image"
        data-admin-current-url={images.hero.main}
        data-admin-label="Hero Photo"
        >
        <div className="absolute inset-0 pointer-events-none">
          <HeroImage
            src={images.hero.main}
            fallback={images.hero.fallback}
            alt={`${wedding.couple.names} hero`}
          />
        </div>
        <div className="absolute inset-0 bg-text-primary/30 pointer-events-none" />
        {overlays.hero && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: overlays.hero.color,
              opacity: overlays.hero.opacity,
            }}
          />
        )}

        <div className="relative z-10 text-center text-white space-y-8 animate-fade-in-up px-6 pt-20">
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight drop-shadow-lg">
            {wedding.couple.names.split(" & ")[0]}{" "}
            <span className="font-amp normal-case">&amp;</span>{" "}
            {wedding.couple.names.split(" & ")[1]}
          </h1>
          <div className="space-y-2 uppercase tracking-[0.3em] text-sm md:text-base font-light text-white/90 drop-shadow-md">
            <p>{wedding.date.dayOfWeek}, {wedding.date.display}</p>
            <p>{wedding.venue.cityDisplay}</p>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/rsvp" variant="primary" className="min-w-[11rem] px-10 py-4 text-base">
              RSVP
            </Button>
            <Button
              href="/our-story"
              variant="outline"
              className="min-w-[9.5rem] border-white px-7 py-3 text-sm text-white hover:bg-white hover:text-primary"
            >
              Our Story
            </Button>
          </div>
        </div>
      </section>

      {/* Registry Section */}
      <Section background="surface" className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary/55 mb-3 font-medium">Wishlist</p>
        <h2 className="font-heading text-4xl mb-6">Registry</h2>
        <p
          className="max-w-2xl mx-auto text-text-secondary leading-relaxed"
          data-admin-key="home.intro"
          data-admin-type="rich-text"
          data-admin-current-text={content.homeIntro}
          data-admin-label="Home Intro Text"
        >
          Your presence at our wedding is the greatest gift of all. If you&apos;d like to celebrate us with something for the home, we&apos;ve registered at Amazon and Target.
        </p>
        <div className="mt-10">
          <Button href="/registry" variant="secondary">
            View Registry
          </Button>
        </div>
      </Section>

      {/* Quick Details Grid */}
      <Section background="base">
        <div className="grid md:grid-cols-3 gap-12 text-center md:items-stretch">

          {/* When → Games */}
          <div className="flex flex-col items-center gap-4">
            <h3 className="uppercase tracking-widest text-sm text-text-secondary">When</h3>
            <p
              className="font-heading text-2xl"
              data-admin-key="date.display"
              data-admin-type="text"
              data-admin-label="Wedding Date Display"
              data-admin-current-text={wedding.date.display}
            >
              {wedding.date.dayOfWeek}, {wedding.date.display}
            </p>
            <p className="text-sm text-text-secondary/70 leading-relaxed max-w-[16rem] flex-grow">
              Can&apos;t wait for the big day? Us either — so we made some games to pass the time.
            </p>
            <Button href="/games" variant="outline" className="mt-2">
              Play the Games
            </Button>
          </div>

          {/* Where → Travel */}
          <div className="flex flex-col items-center gap-4 md:border-l md:border-r border-surface px-4">
            <h3 className="uppercase tracking-widest text-sm text-text-secondary">Where</h3>
            <p
              className="font-heading text-2xl"
              data-admin-key="venue.name"
              data-admin-type="text"
              data-admin-label="Venue Name"
            >
              {wedding.venue.name}
            </p>
            <p className="text-sm text-text-secondary">{wedding.venue.cityDisplay}</p>
            <p className="text-sm text-text-secondary/70 leading-relaxed max-w-[16rem] flex-grow">
              Live outside DFW? We&apos;ve rounded up hotels, tips, and things to do while you&apos;re in town.
            </p>
            <Button href="/travel" variant="outline" className="mt-2">
              Plan Your Trip
            </Button>
          </div>

          {/* Dress Code → Attire */}
          <div className="flex flex-col items-center gap-4">
            <h3 className="uppercase tracking-widest text-sm text-text-secondary">Dress Code</h3>
            <p
              className="font-heading text-2xl"
              data-admin-key="dresscode.short"
              data-admin-type="text"
              data-admin-label="Dress Code (Short)"
            >
              {wedding.dresscode.short === "TBD" ? "Details Coming Soon" : wedding.dresscode.short}
            </p>
            <p className="text-sm text-text-secondary/70 leading-relaxed max-w-[16rem] flex-grow">
              Not sure what to wear? Check out our attire guide so you fit right in.
            </p>
            <Button href="/attire" variant="outline" className="mt-2">
              View Dress Code
            </Button>
          </div>

        </div>
      </Section>
    </>
  );
}
