type ModulesCompletedProps = {
  completed: number;
  total: number;
};

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ModulesCompleted({ completed, total }: ModulesCompletedProps) {
  const percent = Math.round((completed / total) * 100);
  const filled = (completed / total) * CIRCUMFERENCE;

  return (
    <div className="flex items-center gap-5 rounded-2xl bg-white p-4">
      <div
        role="img"
        aria-label={`${percent}% of modules completed`}
        className="relative h-[84px] w-[84px] shrink-0"
      >
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="9" className="stroke-slate-200" />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
            className="stroke-accent"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
          QBank
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold leading-none">
          {completed} <span className="text-slate-500">/ {total}</span>
        </p>
        <p className="mt-2 text-xs text-black/80">Modules completed</p>
      </div>
    </div>
  );
}
