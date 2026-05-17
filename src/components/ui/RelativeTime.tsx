import { useMemo } from 'react';

interface RelativeTimeProps {
  date: string | Date;
  className?: string;
}

export default function RelativeTime({ date, className = '' }: RelativeTimeProps) {
  const text = useMemo(() => {
    const now = Date.now();
    const d = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
    const diff = now - d;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    const dateObj = new Date(d);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  }, [date]);

  return (
    <time className={`text-sm text-muted-foreground ${className}`} dateTime={typeof date === 'string' ? date : date.toISOString()}>
      {text}
    </time>
  );
}
