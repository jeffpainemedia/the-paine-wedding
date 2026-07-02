import React from "react";

interface SectionProps {
    children: React.ReactNode;
    className?: string;
    background?: "base" | "surface" | "white" | "primary" | "accent";
    spacing?: "tight" | "default" | "loose";
    id?: string;
}

export default function Section({
    children,
    className = "",
    background = "base",
    spacing = "default",
    id,
}: SectionProps) {
    const bgs = {
        base: "bg-base text-text-primary",
        surface: "bg-surface text-text-primary",
        white: "bg-white text-text-primary",
        primary: "bg-primary text-text-light",
        accent: "bg-accent text-white",
    };

    const spacings = {
        tight: { top: "pt-16 md:pt-20", bottom: "pb-16 md:pb-20" },
        default: { top: "pt-24 md:pt-32", bottom: "pb-24 md:pb-32" },
        loose: { top: "pt-28 md:pt-40", bottom: "pb-28 md:pb-40" },
    };

    // Custom padding in className must actually win: Tailwind resolves
    // conflicting utilities by stylesheet order, not class order, so drop
    // the default for any side the caller overrides.
    // Only unprefixed utilities count; variants like print:py-4 or md:pt-16
    // refine an existing base override rather than replace the default.
    const custom = className.split(/\s+/);
    const overridesTop = custom.some((c) => /^(?:py|pt)-/.test(c));
    const overridesBottom = custom.some((c) => /^(?:py|pb)-/.test(c));
    const spacingClasses = [
        overridesTop ? "" : spacings[spacing].top,
        overridesBottom ? "" : spacings[spacing].bottom,
    ].join(" ");

    return (
        <section
            id={id}
            className={`w-full ${spacingClasses} px-6 ${bgs[background]} ${className}`}
        >
            <div className="max-w-5xl mx-auto">{children}</div>
        </section>
    );
}
