import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-full transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-gold-500 focus-visible:outline-offset-2';

  const variants = {
    primary: 'bg-magenta-600 hover:bg-magenta-800 text-white shadow-sm',
    secondary: 'border border-gold-500 text-gold-500 hover:bg-gold-500/10 bg-transparent',
    ghost:
      'text-ink-900 hover:bg-black/5 bg-transparent [data-theme=night]_&:text-ivory [data-theme=night]_&:hover:bg-white/10',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm min-h-[36px]',
    md: 'px-6 py-2.5 text-base min-h-[44px]',
    lg: 'px-8 py-3.5 text-lg min-h-[50px]',
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
