export default function LoadingClub() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-40 animate-pulse rounded-[24px] bg-[#e7f5e1]" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="h-36 animate-pulse rounded-[22px] bg-white" />
          <div className="h-36 animate-pulse rounded-[22px] bg-white" />
          <div className="h-36 animate-pulse rounded-[22px] bg-white" />
        </div>
        <div className="h-64 animate-pulse rounded-[22px] bg-[#1b4332]" />
      </div>
      <p className="sr-only">Loading the club</p>
    </div>
  );
}
