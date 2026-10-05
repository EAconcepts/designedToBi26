interface GoldRuleProps {
  className?: string;
  withDiamond?: boolean;
}

export function GoldRule({ className = '', withDiamond = false }: GoldRuleProps) {
  if (withDiamond) {
    return (
      <div
        className={`flex items-center justify-center gap-3 my-6 w-full ${className}`}
        aria-hidden="true"
      >
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
        <div className="w-2 h-2 rotate-45 border border-gold-500 bg-gold-500/20" />
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`h-[1px] w-full my-6 bg-gradient-to-r from-transparent via-gold-500 to-transparent ${className}`}
      aria-hidden="true"
    />
  );
}
