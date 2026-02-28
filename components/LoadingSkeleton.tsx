export function LoadingSkeleton() {
  return (
    <section className="space-y-3 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="h-10 w-56 rounded-xl bg-[#d7e1f2]" />

      <aside className="rounded-[22px] border-2 border-[#9b6f7f33] bg-[#f3d9df] px-4 py-4 md:px-5 md:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-52 rounded bg-white/65" />
            <div className="h-8 w-72 rounded-lg bg-white/70" />
          </div>
          <div className="h-7 w-44 rounded-full bg-white/70" />
        </div>

        <div className="mt-3 h-4 w-3/4 rounded bg-white/65" />
        <div className="mt-2 h-4 w-2/3 rounded bg-white/60" />

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div className="rounded-xl border border-[#9b6f7f33] bg-white/60 px-3 py-2" key={index}>
              <div className="h-3 w-20 rounded bg-[#f1c7d2]" />
              <div className="mt-2 h-6 w-36 rounded bg-[#f4dbe2]" />
              <div className="mt-2 h-3 w-40 rounded bg-[#f1c7d2]" />
            </div>
          ))}
        </div>

        <div className="mt-3 h-3 w-56 rounded bg-white/65" />
      </aside>

      <div className="grid grid-cols-[36px_minmax(0,1fr)_36px] items-stretch gap-2 md:hidden">
        <div className="my-auto h-10 w-10 rounded-full border border-[#2f364333] bg-white/60" />
        <article className="min-w-0 overflow-hidden rounded-[22px] bg-[#b7dfca] p-3">
          <CardHeaderSkeleton />
          <CardBodySkeleton />
        </article>
        <div className="my-auto h-10 w-10 rounded-full border border-[#2f364333] bg-white/60" />
      </div>

      <div className="hidden grid-cols-[52px_minmax(0,1fr)_52px] items-stretch gap-4 md:grid">
        <div className="my-auto h-12 w-12 rounded-full border border-[#2f364333] bg-white/60" />
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <article className="min-w-0 overflow-hidden rounded-[26px] bg-[#b7dfca] p-4 md:p-5">
            <CardHeaderSkeleton />
            <CardBodySkeleton />
          </article>
          <article className="min-w-0 overflow-hidden rounded-[26px] bg-[#b5cce8] p-4 md:p-5">
            <CardHeaderSkeleton />
            <CardBodySkeleton />
          </article>
        </div>
        <div className="my-auto h-12 w-12 rounded-full border border-[#2f364333] bg-white/60" />
      </div>
    </section>
  );
}

function CardHeaderSkeleton() {
  return (
    <header className="mb-3">
      <div className="h-10 w-56 rounded-lg bg-white/65 md:h-12 md:w-72" />
      <div className="mt-2 flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-white/65 md:h-12 md:w-12" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-4/5 rounded bg-white/65 md:h-5" />
          <div className="h-3 w-2/3 rounded bg-white/55 md:h-4" />
          <div className="hidden h-3 w-1/2 rounded bg-white/50 md:block md:h-4" />
        </div>
      </div>
    </header>
  );
}

function CardBodySkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-56 rounded-2xl bg-white/55 md:h-64" />
      <div className="h-40 rounded-2xl bg-white/50 md:h-52" />
    </div>
  );
}
