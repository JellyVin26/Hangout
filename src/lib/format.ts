/** Time and number formatting helpers. */

export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function fmtTime(ms: number): string {
  const d = new Date(ms);
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function fmtDay(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay - startOfToday) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function fmtFull(ms: number): string {
  return `${fmtDay(ms)} at ${fmtTime(ms)}`;
}

/** "in 25 min", "in 3 days", "2h 5m left" */
export function countdown(ms: number, now = Date.now()): string {
  const diff = ms - now;
  if (diff <= 0) return 'now';
  const min = Math.round(diff / 60000);
  if (min < 60) return `in ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m === 0 ? `in ${h} hr` : `in ${h}h ${m}m`;
  const days = Math.round(min / 1440);
  return `in ${days} day${days > 1 ? 's' : ''}`;
}

export function timeAgo(ms: number, now = Date.now()): string {
  const s = Math.max(1, Math.floor((now - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h}h ${m}m`;
}

export function etaLabel(min: number): string {
  const rounded = Math.max(1, Math.round(min));
  return `${rounded} min`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function atDayOffset(days: number, hour: number, minute = 0): number {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export function nextWeekday(weekday: number, hour: number, minute = 0): number {
  // weekday: 0 = Sunday ... 6 = Saturday
  const d = new Date();
  const current = d.getDay();
  let diff = (weekday - current + 7) % 7;
  if (diff === 0) diff = 7;
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}
