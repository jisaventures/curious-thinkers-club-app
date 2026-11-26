export function PageLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="font-display text-sm font-bold text-[#306A51]">Loading…</p>
      <div className="h-36 animate-pulse rounded-[28px] bg-white/80" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-[28px] bg-white/70" />
        <div className="h-28 animate-pulse rounded-[28px] bg-white/70" />
      </div>
      <div className="h-48 animate-pulse rounded-[28px] bg-white/70" />
    </div>
  );
}
