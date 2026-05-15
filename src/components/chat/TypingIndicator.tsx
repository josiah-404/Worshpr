import { type FC } from 'react';

interface TypingIndicatorProps {
  names: string[];
}

export const TypingIndicator: FC<TypingIndicatorProps> = ({ names }) => {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className='flex items-center gap-1.5 px-4 py-1 text-xs text-muted-foreground'>
      <span className='flex gap-0.5'>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className='h-1 w-1 rounded-full bg-muted-foreground animate-bounce'
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      <span>{label}…</span>
    </div>
  );
};
