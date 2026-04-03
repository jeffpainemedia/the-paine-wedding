"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { WEDDING } from "@/lib/wedding-data";

type NavLink = {
    name: string;
    href: string;
};

export default function Navbar({ links }: { links: readonly NavLink[] }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);
    const pathname = usePathname();

    // Close on outside click — exclude the hamburger button itself so its
    // own onClick handler isn't fighting with this mousedown handler
    useEffect(() => {
        if (!menuOpen) return;
        function handleClick(e: MouseEvent) {
            if (hamburgerRef.current?.contains(e.target as Node)) return;
            if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    // Close on Escape key
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setMenuOpen(false);
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, []);

    // Prevent body scroll when menu is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    return (
        <>
            <header className="sticky top-0 z-[60] w-full bg-base/90 backdrop-blur-md border-b border-surface">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center"
                        onClick={() => setMenuOpen(false)}
                    >
                        <span className="font-heading text-xl tracking-wide uppercase hidden md:inline">
                            {WEDDING.couple.names.split(" & ")[0]}{" "}
                            <span className="font-amp normal-case">&amp;</span>{" "}
                            {WEDDING.couple.names.split(" & ")[1]}
                        </span>
                        <span className="md:hidden flex items-center">
                            <Image
                                src="/A&J.svg"
                                alt={WEDDING.couple.names}
                                width={110}
                                height={36}
                                priority
                                className="h-8 w-auto"
                            />
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {links.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`border-b-2 pb-1 text-sm uppercase tracking-widest transition-all duration-200 ${
                                    pathname === link.href || pathname.startsWith(`${link.href}/`)
                                        ? "border-primary/45 text-primary font-semibold"
                                        : "border-transparent text-text-secondary hover:border-primary/30 hover:text-primary hover:font-semibold"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile hamburger */}
                    <button
                        ref={hamburgerRef}
                        className="relative z-[61] md:hidden text-text-primary p-1 -mr-1"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? (
                            /* X icon */
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            /* Hamburger icon */
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-16 6h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Mobile drawer overlay */}
            <div
                className={`fixed top-[80px] inset-x-0 bottom-0 bg-text-primary/40 z-[54] md:hidden transition-opacity duration-300 ${
                    menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                aria-hidden="true"
            />

            {/* Mobile drawer panel */}
            <div
                ref={drawerRef}
                className={`fixed top-20 left-0 right-0 z-[55] md:hidden bg-base border-b border-surface shadow-lg transition-all duration-300 ease-in-out ${
                    menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                }`}
            >
                <nav className="flex flex-col px-6 py-6 space-y-1">
                    {links.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            className={`border-b border-surface/60 py-3 text-sm uppercase tracking-widest transition-colors duration-200 last:border-0 ${
                                pathname === link.href || pathname.startsWith(`${link.href}/`)
                                    ? "text-primary font-semibold"
                                    : "text-text-secondary hover:text-primary"
                            }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>
            </div>
        </>
    );
}
