import Link from "next/link";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteNavbar />
      <main className="flex min-h-[calc(100vh-160px)] items-center justify-center bg-[#f7f6fb] px-6">
        <div className="text-center">
          <h1 className="text-8xl font-extrabold text-[#2f2389]">404</h1>
          <p className="mt-4 text-lg text-[#4e4890]">
            Page not found.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-[#73efc1] px-7 py-3 text-base font-semibold text-[#2f2389] shadow-[0_10px_24px_rgba(115,239,193,0.35)] transition-shadow hover:shadow-[0_14px_32px_rgba(115,239,193,0.5)]"
          >
            Home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
