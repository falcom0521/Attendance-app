import {
  format,
  parseISO,
  isValid,
  differenceInMinutes,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  addDays,
} from 'date-fns';

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, fmt);
}

export function formatTime(date: string | Date, fmt = 'hh:mm a'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, fmt);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'dd MMM yyyy, hh:mm a');
}

export function minutesToHHMM(minutes: number): string {
  if (minutes <= 0) return '00:00';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function minutesToDisplay(minutes: number): string {
  if (minutes <= 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function timeDiffMinutes(start: string, end: string): number {
  return differenceInMinutes(parseISO(end), parseISO(start));
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachDayOfInterval({ start, end });
}

export function getWorkingDaysInMonth(year: number, month: number, holidays: string[]): number {
  const days = getMonthDays(year, month);
  return days.filter(
    (d) => !isWeekend(d) && !holidays.includes(format(d, 'yyyy-MM-dd'))
  ).length;
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function currentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function buildDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function addDaysToDate(date: string, days: number): string {
  return format(addDays(parseISO(date), days), 'yyyy-MM-dd');
}

export function formatMonthYear(month: number, year: number): string {
  return format(new Date(year, month - 1), 'MMMM yyyy');
}

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: format(new Date(2024, i), 'MMMM'),
}));

export const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { value: String(y), label: String(y) };
});
