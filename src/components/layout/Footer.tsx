import React from "react";
import Link from "next/link";
import { WEDDING } from "@/lib/wedding-data";

type FooterLink = {
    label: string;
    href: string;
};

export default function Footer({ links }: { links: readonly FooterLink[] }) {
    return (
        <footer className="w-full border-t border-gray-200 bg-surface py-8 text-center md:py-12">
            <div className="mx-auto max-w-4xl px-5 md:px-6">
                <h2 className="mb-3 font-heading text-2xl text-primary md:mb-4 md:text-3xl">{WEDDING.couple.names}</h2>
                <p className="mb-6 text-xs uppercase tracking-[0.22em] text-text-secondary md:mb-8 md:text-sm md:tracking-widest">
                    {WEDDING.date.display} &bull; {WEDDING.venue.cityDisplay}
                </p>
                <nav className="mb-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-text-secondary/60 md:mb-8 md:gap-x-6 md:text-xs md:tracking-[0.2em]">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href} className="hover:text-primary transition-colors">{link.label}</Link>
                    ))}
                </nav>
                <p className="text-[11px] text-text-secondary opacity-70 md:text-xs">
                    &copy; {new Date().getFullYear()} The {WEDDING.couple.lastName} Wedding. All Rights Reserved.
                </p>
            </div>
        </footer>
    );
}
