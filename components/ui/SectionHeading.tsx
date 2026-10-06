import { GoldRule } from './GoldRule';

interface SectionHeadingProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: 'center' | 'left';
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  className = '',
  align = 'center',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`max-w-2xl mb-8 sm:mb-12 ${alignment} ${className}`}>
      {eyebrow && (
        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-gold-500 font-semibold mb-2">
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-ink-900 leading-tight [data-theme=night]_&:text-ivory"
      >
        {title}
      </h2>
      <GoldRule withDiamond className="max-w-xs mx-auto" />
      {description && (
        <p className="text-sm sm:text-base text-ink-600 font-normal mt-2 [data-theme=night]_&:text-ivory/80">
          {description}
        </p>
      )}
    </div>
  );
}
