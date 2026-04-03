import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminEditBar from "@/components/admin/AdminEditBar";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { getVisiblePublicLinks, PUBLIC_FOOTER_LINKS, PUBLIC_NAV_LINKS } from "@/lib/page-visibility";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [navLinks, footerLinks] = await Promise.all([
    getVisiblePublicLinks(PUBLIC_NAV_LINKS),
    getVisiblePublicLinks(PUBLIC_FOOTER_LINKS),
  ]);

  return (
    <>
      <ScrollToTop />
      <Navbar links={navLinks} />
      <main className="flex-grow flex flex-col bg-base text-text-primary">
        {children}
      </main>
      <Footer links={footerLinks} />
      <AdminEditBar />
    </>
  );
}
