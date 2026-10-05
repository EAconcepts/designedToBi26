import type { ComponentProps, ReactNode } from 'react';

interface ContainerProps extends ComponentProps<'div'> {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Container({ children, className = '', size = 'md', ...props }: ContainerProps) {
  const maxWidths = {
    sm: 'max-w-xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 md:px-8 ${maxWidths[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
