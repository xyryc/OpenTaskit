export function money(amount: number, withDecimals = false): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0
  });
  return `Rs ${formatted}`;
}

export function signedMoney(amount: number): string {
  return `${amount < 0 ? '−' : '+'}${money(Math.abs(amount))}`;
}

export function distance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export const COMMISSION_RATE = 0.12;

export function commissionFor(amount: number): number {
  return Math.round(amount * COMMISSION_RATE);
}

export function earningsFor(amount: number): number {
  return amount - commissionFor(amount);
}

export function scheduleLabel(schedule: {
  type: string;
  date?: string;
  time?: string;
}): string {
  if (schedule.type === 'asap') return 'As soon as possible';
  if (schedule.type === 'flexible') return 'Flexible — anytime';
  return [schedule.date, schedule.time].filter(Boolean).join(' · ');
}

export function initialsOf(name: string): string {
  return name.
  split(' ').
  filter(Boolean).
  slice(0, 2).
  map((part) => part[0]?.toUpperCase() ?? '').
  join('');
}
/**
 * Deleting a posted task is free until someone has been assigned to do it.
 * Once a tasker is on the job, deleting it costs the poster 20% of the posted price.
 */
export const DELETION_PENALTY_RATE = 0.2;

/** Task states in which a tasker is already committed to the work. */
const ASSIGNED_STATES = ['assigned', 'in_progress', 'awaiting_completion'];

export function deletionIncursPenalty(status: string): boolean {
  return ASSIGNED_STATES.includes(status);
}

export function deletionPenaltyFor(amount: number, status: string): number {
  return deletionIncursPenalty(status) ? Math.round(amount * DELETION_PENALTY_RATE) : 0;
}

/** Formats a Date the same way the task schedule chips do, e.g. "Sat, 22 Aug". */
export function scheduleDateLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).replace(/^(\w{3}) /, '$1, ');
}

/** Midnight today, for comparing calendar days without time-of-day noise. */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate());

}
