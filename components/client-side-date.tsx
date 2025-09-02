'use client';

interface ClientSideDateProps {
  date: string;
  locale?: string;
  className?: string;
}

export function ClientSideDate({ date, locale = 'ar-SA', className }: ClientSideDateProps) {
  return (
    <span className={className} suppressHydrationWarning>
      {new Date(date).toLocaleDateString(locale)}
    </span>
  );
}