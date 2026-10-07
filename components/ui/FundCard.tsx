'use client';

export interface FundCardProps {
  slug: string;
  title: string;
  description?: string | null;
  goalMinor?: number | null;
  currentMinor?: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function FundCard({
  slug,
  title,
  description,
  goalMinor,
  currentMinor = 0,
  isSelected,
  onSelect,
}: FundCardProps) {
  const percent =
    goalMinor && goalMinor > 0 ? Math.min(100, Math.round((currentMinor / goalMinor) * 100)) : null;

  return (
    <button
      type="button"
      id={`fund-${slug}`}
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
        isSelected
          ? 'bg-white border-magenta-600 shadow-md ring-2 ring-magenta-600/20'
          : 'bg-white/80 hover:bg-white border-gold-500/20 hover:border-gold-500/50 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                isSelected
                  ? 'border-magenta-700 bg-magenta-700'
                  : 'border-ink-300 group-hover:border-gold-500'
              }`}
            >
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <h3 className="font-serif font-bold text-lg text-magenta-950 tracking-tight">
              {title}
            </h3>
          </div>

          {description && (
            <p className="text-xs sm:text-sm text-ink-600 mt-2 leading-relaxed pl-6">
              {description}
            </p>
          )}

          {percent !== null && percent >= 1 && (
            <div className="mt-3 pl-6">
              <div className="w-full bg-ivory-300 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gold-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-[11px] text-gold-700 font-medium mt-1">{percent}% funded</p>
            </div>
          )}
        </div>

        <span
          className={`text-sm font-semibold transition-transform duration-200 ${
            isSelected
              ? 'text-magenta-700 translate-x-0'
              : 'text-ink-400 group-hover:text-gold-600 group-hover:translate-x-0.5'
          }`}
        >
          →
        </span>
      </div>
    </button>
  );
}
