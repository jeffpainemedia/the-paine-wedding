"use client";

import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image-placeholder";

export default function HeroImage({
    src,
    fallback,
    alt,
}: {
    src: string;
    fallback: string;
    alt: string;
}) {
    const safeSrc =
        src && (src.startsWith("/") || /^https?:\/\//.test(src)) ? src : fallback;

    return (
        <Image
            src={safeSrc}
            alt={alt}
            fill
            priority
            quality={72}
            sizes="100vw"
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
            className="object-cover"
            style={{ objectPosition: "center 25%" }}
            onError={(e) => {
                (e.target as HTMLImageElement).src = fallback;
            }}
        />
    );
}
