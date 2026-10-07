import type { ComponentProps } from 'react';

export interface MonogramProps extends ComponentProps<'div'> {
  compact?: boolean;
}

export function Monogram({ compact = false, className = '', ...props }: MonogramProps) {
  return (
    <div
      className={`${compact ? 'monogram monogram--compact' : 'monogram'} ${className}`}
      aria-label="A and E Monogram"
      {...props}
    >
      <span>AE</span>
    </div>
  );
}
