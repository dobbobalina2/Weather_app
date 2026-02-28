interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <section className="card space-y-4 p-6 md:p-8" role="alert">
      <h2 className="text-3xl font-extrabold text-[#2a364d] md:text-4xl">Unable to refresh weather data</h2>
      <p className="text-[22px] font-semibold text-[#556079] md:text-[28px]">{message}</p>
      <button
        className="rounded-2xl bg-[#9a8bde] px-5 py-3 text-base font-bold text-white shadow-[0_8px_16px_rgba(117,104,189,0.32)] hover:bg-[#8d7eda]"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </section>
  );
}
