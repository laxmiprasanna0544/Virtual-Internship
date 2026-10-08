export default function Loading() {
  return (
    <div
      className="container flex min-h-[60vh] flex-col justify-center gap-4 py-16"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <div className="skeleton h-8 w-40" />
      <div className="skeleton h-14 w-full max-w-2xl" />
      <div className="skeleton h-5 w-full max-w-xl" />
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    </div>
  );
}
