import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';

export interface DobPickerSheetProps {
  open: boolean;
  onClose: () => void;
  /** Currently chosen date of birth, if any. */
  value?: Date | null;
  onSelect: (label: string, date: Date) => void;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
// Identity verification requires a plausible adult birth date.
const MIN_AGE = 16;
const MAX_AGE = 100;

function leadingBlanks(year: number, month: number): number {
  const firstDay = new Date(year, month, 1).getDay();
  return (firstDay + 6) % 7;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function chunkIntoWeeks<T>(arr: T[]): T[][] {
  const weeks: T[][] = [];
  for (let i = 0; i < arr.length; i += 7) {
    weeks.push(arr.slice(i, i + 7));
  }
  return weeks;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDob(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DobPickerSheet({ open, onClose, value, onSelect }: DobPickerSheetProps) {
  const today = useMemo(() => new Date(), []);
  const maxDate = useMemo(
    () => new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate()),
    [today]
  );
  const minDate = useMemo(
    () => new Date(today.getFullYear() - MAX_AGE, today.getMonth(), today.getDate()),
    [today]
  );

  const initial = value ?? maxDate;
  const [cursor, setCursor] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [picked, setPicked] = useState<Date | null>(value ?? null);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const blanks = leadingBlanks(year, month);
  const total = daysInMonth(year, month);

  const atMaxMonth = year === maxDate.getFullYear() && month === maxDate.getMonth();
  const atMinMonth = year === minDate.getFullYear() && month === minDate.getMonth();

  const step = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    if (next > maxDate && delta > 0) return;
    if (next < new Date(minDate.getFullYear(), minDate.getMonth(), 1) && delta < 0) return;
    setCursor(next);
  };

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxDate.getFullYear(); y >= minDate.getFullYear(); y--) arr.push(y);
    return arr;
  }, [maxDate, minDate]);

  const confirm = () => {
    if (!picked) return;
    onSelect(formatDob(picked), picked);
    onClose();
  };

  const calendarCells = useMemo(() => {
    const cells: (
      | { type: 'blank'; id: string }
      | { type: 'day'; date: Date; dayNum: number; disabled: boolean }
    )[] = [];

    for (let i = 0; i < blanks; i++) {
      cells.push({ type: 'blank', id: `blank-${i}` });
    }

    for (let i = 1; i <= total; i++) {
      const date = new Date(year, month, i);
      const disabled = date > maxDate || date < minDate;
      cells.push({ type: 'day', date, dayNum: i, disabled });
    }

    const remainder = cells.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push({ type: 'blank', id: `end-blank-${i}` });
      }
    }

    return chunkIntoWeeks(cells);
  }, [blanks, total, year, month, maxDate, minDate]);

  if (yearPickerOpen) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Select birth year"
        description="Jump straight to the year, then pick the exact day."
      >
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          <View className="gap-1 pb-2" style={{ gap: 4 }}>
            {years.map((y) => (
              <Pressable
                key={y}
                onPress={() => {
                  setCursor(new Date(y, month, 1));
                  setYearPickerOpen(false);
                }}
                className={`rounded-2xl px-4 py-3 active:bg-ink-100 ${
                  y === year ? 'bg-brand-tint/60' : ''
                }`}
              >
                <Text
                  className={`text-[15px] ${
                    y === year ? 'font-geist-semibold text-brand-dark' : 'font-geist-medium text-ink'
                  }`}
                >
                  {y}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Date of birth"
      description="Must match the date printed on your document."
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
              {picked ? `Use ${formatDob(picked)}` : 'Select a date'}
            </Button>
          </View>
        </View>
      }
    >
      <View className="pb-2">
        {/* Month / Year Header Navigation */}
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => step(-1)}
            disabled={atMinMonth}
            className={`h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white active:bg-ink-100 ${
              atMinMonth ? 'opacity-35' : ''
            }`}
          >
            <ChevronLeft size={18} color="#0C1417" />
          </Pressable>

          <Pressable
            onPress={() => setYearPickerOpen(true)}
            className="rounded-xl px-3 py-1.5 active:bg-ink-100"
          >
            <Text className="text-[15px] font-geist-semibold tracking-[-0.02em] text-ink">
              {cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => step(1)}
            disabled={atMaxMonth}
            className={`h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white active:bg-ink-100 ${
              atMaxMonth ? 'opacity-35' : ''
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

                const { date, dayNum, disabled } = cell;
                const selected = picked ? isSameDay(date, picked) : false;

                return (
                  <Pressable
                    key={dayNum}
                    disabled={disabled}
                    onPress={() => setPicked(date)}
                    className={`flex-1 h-11 mx-0.5 items-center justify-center rounded-xl ${
                      selected ? 'bg-brand' : disabled ? '' : 'bg-white active:bg-ink-100'
                    }`}
                  >
                    <Text
                      className={`text-[14px] ${
                        selected
                          ? 'font-geist-semibold text-white'
                          : disabled
                          ? 'font-geist text-ink-300'
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
