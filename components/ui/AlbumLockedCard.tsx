export interface AlbumLockedCardProps {
  title: string;
  condition: string;
}

export function AlbumLockedCard({ title, condition }: AlbumLockedCardProps) {
  return (
    <div className="relative rounded-2xl border border-gold-500/30 bg-gradient-to-b from-ivory-100 to-ivory-200/50 p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xs overflow-hidden min-h-[320px] group">
      {/* Decorative Gold Corner Borders */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-gold-400/40" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-gold-400/40" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-gold-400/40" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-gold-400/40" />

      {/* Lock Icon */}
      <div className="w-14 h-14 rounded-full bg-white border border-gold-300 shadow-sm flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform duration-300">
        🔒
      </div>

      <span className="text-xs uppercase tracking-widest text-gold-600 font-semibold font-sans mb-1">
        Coming Soon
      </span>

      <h3 className="text-2xl font-serif font-bold text-ink-900 mb-2">{title}</h3>

      <p className="text-xs sm:text-sm text-ink-600 max-w-xs leading-relaxed">{condition}</p>

      <div className="mt-6 px-4 py-1.5 rounded-full bg-gold-100/60 border border-gold-300/60 text-[11px] font-medium text-gold-900 tracking-wide">
        Locked in current phase
      </div>
    </div>
  );
}
