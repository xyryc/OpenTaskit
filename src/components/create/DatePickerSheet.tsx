import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { isSameDay, scheduleDateLabel, startOfToday } from '@/utils/format';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';

export interface DatePickerSheetProps {
  open: boolean;
  onClose: () => void;
  /** Currently chosen date, as the "Sat, 22 Aug" label used across the app. */
  value?: string;
  onSelect: (label: string, date: Date) => void;
  /** How far ahead a task may be scheduled. */
  monthsAhead?: number;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** Monday-first offset for the 1st of the given month. */
function leadingBlanks(year: number, month: number): number {
  const firstDay = new Date(year, month, 1).getDay();
  return (firstDay + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Chunks an array into rows of size 7 for standard calendar grid */
function chunkIntoWeeks<T>(arr: T[]): T[][] {
  const weeks: T[][] = [];
  for (let i = 0; i < arr.length; i += 7) {
    weeks.push(arr.slice(i, i + 7));
  }
  return weeks;
}

export function DatePickerSheet({
  open,
  onClose,
  value,
  onSelect,
  monthsAhead = 12,
}: DatePickerSheetProps) {
  const today = useMemo(() => startOfToday(), []);
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [picked, setPicked] = useState<Date | null>(null);

  const lastMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1),
    [today, monthsAhead]
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const blanks = leadingBlanks(year, month);
  const total = daysInMonth(year, month);

  const atFirstMonth = year === today.getFullYear() && month === today.getMonth();
  const atLastMonth =
    year === lastMonth.getFullYear() && month === lastMonth.getMonth();

  const step = (delta: number) => setCursor(new Date(year, month + delta, 1));

  const confirm = () => {
    if (!picked) return;
    onSelect(scheduleDateLabel(picked), picked);
    onClose();
  };

  // Build grid items (blanks + month days)
  const calendarCells = useMemo(() => {
    const cells: (
      | { type: 'blank'; id: string }
      | {
          type: 'day';
          date: Date;
          dayNum: number;
          label: string;
          past: boolean;
          isToday: boolean;
        }
    )[] = [];

    for (let i = 0; i < blanks; i++) {
      cells.push({ type: 'blank', id: `blank-${i}` });
    }

    for (let i = 1; i <= total; i++) {
      const date = new Date(year, month, i);
      const past = date < today;
      const isTodayDate = isSameDay(date, today);
      const label = scheduleDateLabel(date);
      cells.push({
        type: 'day',
        date,
        dayNum: i,
        label,
        past,
        isToday: isTodayDate,
      });
    }

    // Pad end of last week to 7 cells
    const remainder = cells.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push({ type: 'blank', id: `end-blank-${i}` });
      }
    }

    return chunkIntoWeeks(cells);
  }, [blanks, total, year, month, today]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Choose a date"
      description="Pick any day that works for you — today or up to a year ahead."
      footer={
        <View className="flex-row gap-2.5" style={{ gap: 10 }}>
          <View className="flex-1">
            <Button variant="ghost" size="lg" className="w-full" onPress={onClose}>
              Cancel
            </Button>
          </View>
          <View className="flex-[1.5]">
            <Button
              variant="brand"
              size="lg"
              className="w-full"
              disabled={!picked}
              onPress={confirm}
            >
              {picked ? `Use ${scheduleDateLabel(picked)}` : 'Select a date'}
            </Button>
          </View>
        </View>
      }
    >
      <View className="pb-2">
        {/* Month Header Navigation */}
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => step(-1)}
            disabled={atFirstMonth}
            className={`h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white active:bg-ink-100 ${
              atFirstMonth ? 'opacity-35' : ''
            }`}
          >
            <ChevronLeft size={18} color="#0C1417" />
          </Pressable>

          <Text className="text-[15px] font-geist-semibold tracking-[-0.02em] text-ink">
            {cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </Text>

          <Pressable
            onPress={() => step(1)}
            disabled={atLastMonth}
            className={`h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white active:bg-ink-100 ${
              atLastMonth ? 'opacity-35' : ''
            }`}
          >
            <ChevronRight size={18} color="#0C1417" />
          </Pressable>
        </View>

        {/* Weekday Headers */}
        <View className="mt-4 flex-row justify-between">
          {WEEKDAYS.map((day) => (
            <View key={day} className="flex-1 items-center py-1">
              <Text className="text-[11px] font-geist-medium uppercase tracking-[0.06em] text-ink-400">
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Days Matrix */}
        <View className="mt-1">
          {calendarCells.map((week, weekIdx) => (
            <View key={weekIdx} className="flex-row mb-1">
              {week.map((cell) => {
                if (cell.type === 'blank') {
                  return <View key={cell.id} className="flex-1 h-11" />;
                }

                const { date, dayNum, label, past, isToday: cellIsToday } = cell;
                const selected = picked
                  ? isSameDay(date, picked)
                  : value === label;

                return (
                  <Pressable
                    key={label}
                    disabled={past}
                    onPress={() => setPicked(date)}
                    className={`flex-1 h-11 mx-0.5 items-center justify-center rounded-xl ${
                      selected
                        ? 'bg-brand'
                        : past
                        ? ''
                        : cellIsToday
                        ? 'border border-brand/50 bg-brand-tint/50'
                        : 'bg-white active:bg-ink-100'
                    }`}
                  >
                    <Text
                      className={`text-[14px] ${
                        selected
                          ? 'font-geist-semibold text-white'
                          : past
                          ? 'font-geist text-ink-300'
                          : cellIsToday
                          ? 'font-geist-semibold text-brand-dark'
                          : 'font-geist-medium text-ink'
                      }`}
                    >
                      {dayNum}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}
