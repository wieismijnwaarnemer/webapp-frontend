import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f7f6fb] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-[#2f2389]">404</h1>
        <p className="mt-4 text-lg text-[#4e4890]">
          Deze pagina bestaat niet.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-[#73efc1] px-7 py-3 text-base font-semibold text-[#2f2389] shadow-[0_10px_24px_rgba(115,239,193,0.35)]"
        >
          Terug naar home
        </Link>
      </div>
    </div>
  );
}
