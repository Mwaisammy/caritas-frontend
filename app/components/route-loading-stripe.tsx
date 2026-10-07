// RouteLoadingStripe shows honest indeterminate progress without blocking the page.
export function RouteLoadingStripe() {
  return (
    <div
      aria-label="Loading page"
      className="pointer-events-none fixed inset-x-0 top-0 z-100 h-1 overflow-hidden bg-rose-950/10"
      role="progressbar"
    >
      <div className="route-loading-stripe h-full w-[55%] bg-linear-to-r from-rose-800 via-orange-400 to-amber-300 shadow-[0_0_12px_rgba(225,29,72,0.65)]" />
    </div>
  );
}
