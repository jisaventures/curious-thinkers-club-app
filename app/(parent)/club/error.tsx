"use client";

export default function ClubError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-[22px] bg-white p-6">
      <h2 className="font-display text-2xl text-[#1e4d3a]">We couldn&apos;t open the club</h2>
      <p className="mt-2 text-sm text-[#5e7266]">Please try again in a moment.</p>
      <button onClick={reset} className="mt-4 rounded-full bg-[#f0b429] px-4 py-2 text-sm font-extrabold">
        Try again
      </button>
    </div>
  );
}
