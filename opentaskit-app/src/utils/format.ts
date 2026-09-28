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

export const COMMISSION_RATE = 0.10;

export function commissionFor(amount: number, rate = COMMISSION_RATE): number {
  return Math.round(amount * rate);
}

export function earningsFor(amount: number, rate = COMMISSION_RATE): number {
  return amount - commissionFor(amount, rate);
}

export function scheduleLabel(schedule?: {
  type?: string;
  date?: string | null;
  time?: string | null;
}): string {
  if (!schedule) return 'ASAP';
  const type = schedule.type?.toLowerCase();
  if (type === 'asap') return 'ASAP';
  if (type === 'flexible') return 'Flexible';

  if (!schedule.date) return 'ASAP';

  // Avoid UTC midnight timezone rollbacks on "YYYY-MM-DD"
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(schedule.date)) {
    const [y, m, day] = schedule.date.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(schedule.date);
  }

  const formattedDate = isNaN(d.getTime())
    ? schedule.date
    : d
        .toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
        .replace(/^(\w{3}) /, '$1, ');

  if (schedule.time) {
    let timeStr = schedule.time;
    // Only convert if it's raw 24-hr time like "14:00" or "14:30" (not already containing AM/PM or range)
    const match = schedule.time.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const mins = match[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      timeStr = mins === '00' ? `${hours}${ampm}` : `${hours}:${mins}${ampm}`;
    }
    return `${formattedDate} · ${timeStr}`;
  }

  return formattedDate;
}


export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Time on the platform since account creation.
 * Formats as days (under 1 month, e.g. "1 day", "14 days"),
 * months (under 1 year, e.g. "3 mos"), or years and months (e.g. "1 yr 2 mos", "2 yrs").
 */
export function experienceLabel(createdAtIso: string): string {
  if (!createdAtIso) return '1 day';
  const created = new Date(createdAtIso);
  if (isNaN(created.getTime())) return '1 day';

  const now = new Date();
  if (created > now) return '1 day';

  const diffMs = now.getTime() - created.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let years = now.getFullYear() - created.getFullYear();
  let months = now.getMonth() - created.getMonth();

  if (now.getDate() < created.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Under 1 month: show in days
  if (years === 0 && months === 0) {
    const d = Math.max(1, totalDays);
    return `${d} day${d === 1 ? '' : 's'}`;
  }

  // Under 1 year: show in months
  if (years === 0) {
    return `${months} mo${months === 1 ? '' : 's'}`;
  }

  // 1 year or more: show year and months (or just years if months === 0)
  const yrStr = `${years} yr${years === 1 ? '' : 's'}`;
  if (months > 0) {
    return `${yrStr} ${months} mo${months === 1 ? '' : 's'}`;
  }
  return yrStr;
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
