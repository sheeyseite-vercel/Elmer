export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <div className="h-8 w-1/2 rounded-xl bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-24 rounded-2xl bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-40 rounded-2xl bg-surface-2 motion-safe:animate-pulse" />
    </div>
  );
}
