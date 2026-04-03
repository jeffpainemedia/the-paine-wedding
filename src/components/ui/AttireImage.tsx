"use client";
import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image-placeholder";

/** Simple client wrapper so the onError handler works in a server-rendered page */
export function AttireImage({
    src,
    fallback,
    alt,
    adminKey,
    overlayColor,
    overlayOpacity,
    className = "",
    imageClassName = "",
}: {
    src: string;
    fallback: string;
    alt: string;
    adminKey: string;
    overlayColor?: string;
    overlayOpacity?: number;
    className?: string;
    imageClassName?: string;
}) {
    // Allow local paths (starting with /) as well as absolute https URLs.
    // Fall back to Unsplash only if src is empty or an unrecognised format.
    const safeSrc =
        src && (src.startsWith("/") || /^https?:\/\//.test(src)) ? src : fallback;

    return (
        <div
            className={`break-inside-avoid relative mb-4 overflow-hidden rounded-[1.7rem] border border-primary/10 bg-white/70 shadow-[0_20px_44px_rgba(20,42,68,0.09)] transition-transform duration-300 hover:-translate-y-0.5 ${className}`}
            data-admin-key={adminKey}
            data-admin-type="image-indexed"
            data-admin-current-url={safeSrc}
            data-admin-label={alt}
        >
            <Image
                src={safeSrc}
                alt={alt}
                width={600}
                height={800}
                sizes="(min-width: 768px) 33vw, 50vw"
                quality={60}
                placeholder="blur"
                blurDataURL={IMAGE_BLUR_DATA_URL}
                className={`h-auto w-full object-contain ${imageClassName}`}
                onError={(e) => {
                    (e.target as HTMLImageElement).src = fallback;
                }}
            />
            {overlayColor && overlayOpacity && overlayOpacity > 0 && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
                />
            )}
        </div>
    );
}
