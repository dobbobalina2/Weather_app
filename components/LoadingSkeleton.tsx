export function LoadingSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: 2 }).map((_, index) => (
        <section className="rounded-[42px] bg-[#cadfef] p-6 animate-pulse" key={index}>
          <div className="h-12 w-56 rounded-xl bg-white/55" />
          <div className="mt-4 h-8 w-72 rounded-xl bg-white/45" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="h-32 rounded-3xl bg-white/45" />
            <div className="h-32 rounded-3xl bg-white/45" />
            <div className="h-32 rounded-3xl bg-white/45" />
            <div className="h-32 rounded-3xl bg-white/45" />
          </div>
          <div className="mt-6 h-64 rounded-3xl bg-white/45" />
          <div className="mt-4 h-52 rounded-3xl bg-white/45" />
        </section>
      ))}
    </div>
  );
}
