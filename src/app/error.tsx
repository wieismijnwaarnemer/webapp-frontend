"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7fbff] px-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[#101114]">Er ging iets mis</h2>
        <button
          onClick={() => reset()}
          className="mt-4 rounded-xl bg-[#3585ff] px-6 py-3 text-white font-medium"
        >
          Probeer opnieuw
        </button>
      </div>
    </div>
  );
}
