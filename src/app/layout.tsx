import type { Metadata } from "next";
import { Bodoni_Moda, Montserrat } from "next/font/google";
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: "%s | The Paine Wedding",
  },
  description:
    "Join us as Ashlyn Bimmerle and Jeff Paine celebrate their wedding on September 26, 2026 at Davis & Grey Farms in Celeste, Texas. RSVP, explore venue details, and find travel info here.",
  keywords: [
    "Ashlyn Bimmerle",
    "Jeff Paine",
    "Paine Wedding",
    "wedding September 2026",
    "Davis Grey Farms wedding",
    "Celeste Texas wedding",
    "thepainewedding",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      "Celebrate with Ashlyn & Jeff at Davis & Grey Farms in Celeste, Texas on September 26, 2026.",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Ashlyn and Jeffrey wedding website preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "Celebrate with Ashlyn & Jeff at Davis & Grey Farms in Celeste, Texas.",
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${bodoni.variable} ${montserrat.variable} antialiased min-h-screen flex flex-col`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: SITE_NAME,
                  url: SITE_URL,
                },
                {
                  "@type": "Event",
                  name: "Ashlyn & Jeff Paine Wedding",
                  description: "Join Ashlyn and Jeffrey Paine as they celebrate their wedding at Davis & Grey Farms in Celeste, Texas on September 26, 2026.",
                  startDate: "2026-09-26T17:00:00-05:00",
                  endDate: "2026-09-26T22:00:00-05:00",
                  eventStatus: "https://schema.org/EventScheduled",
                  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
                  location: {
                    "@type": "Place",
                    name: "Davis & Grey Farms",
                    address: {
                      "@type": "PostalAddress",
                      streetAddress: "2975 CR 1110",
                      addressLocality: "Celeste",
                      addressRegion: "TX",
                      postalCode: "75423",
                      addressCountry: "US",
                    },
                  },
                  image: [`${SITE_URL}/images/hero/JeffAshlyn-7977_2.jpg`],
                  performer: {
                    "@type": "Person",
                    name: "Ashlyn & Jeffrey Paine",
                  },
                  organizer: {
                    "@type": "Person",
                    name: "Jeff Paine",
                    url: SITE_URL,
                  },
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                    availability: "https://schema.org/InviteOnly",
                    url: `${SITE_URL}/rsvp`,
                  },
                  url: SITE_URL,
                },
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
