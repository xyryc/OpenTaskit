import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { BottomSheet } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';

export interface TimePickerSheetProps {
  open: boolean;
  onClose: () => void;
  startTime: string;
  endTime: string;
  onConfirm: (startTime: string, endTime: string) => void;
  initialTab?: 'start' | 'end';
}

export const TIME_SLOTS = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM',
  '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
];

export function parseTimeToMinutes(timeStr: string): number {
  const match = /(\d+):(\d+)\s*(AM|PM)/i.exec(timeStr.trim());
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
}

export function formatMinutesToDuration(mins: number): string {
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m duration`;
  if (h > 0) return `${h} ${h === 1 ? 'hr' : 'hrs'} duration`;
  return `${m} mins duration`;
}

export function TimePickerSheet({
  open,
  onClose,
  startTime,
  endTime,
  onConfirm,
  initialTab = 'start',
}: TimePickerSheetProps) {
  const [activeTab, setActiveTab] = useState<'start' | 'end'>(initialTab);
  const [selectedStart, setSelectedStart] = useState(startTime || '09:00 AM');
  const [selectedEnd, setSelectedEnd] = useState(endTime || '01:00 PM');

  useEffect(() => {
    if (open) {
      setSelectedStart(startTime || '09:00 AM');
      setSelectedEnd(endTime || '01:00 PM');
      setActiveTab(initialTab);
    }
  }, [open, startTime, endTime, initialTab]);

  const handlePickSlot = (slot: string) => {
    if (activeTab === 'start') {
      setSelectedStart(slot);
      const startMins = parseTimeToMinutes(slot);
      const endMins = parseTimeToMinutes(selectedEnd);
      if (endMins <= startMins) {
        const nextSlot =
          TIME_SLOTS.find((s) => parseTimeToMinutes(s) >= startMins + 120) ||
          TIME_SLOTS.find((s) => parseTimeToMinutes(s) > startMins) ||
          slot;
        setSelectedEnd(nextSlot);
      }
      setActiveTab('end');
    } else {
      setSelectedEnd(slot);
    }
  };

  const startMins = parseTimeToMinutes(selectedStart);
  const endMins = parseTimeToMinutes(selectedEnd);
  const diffMins = endMins > startMins ? endMins - startMins : 0;
  const durationLabel = diffMins > 0 ? formatMinutesToDuration(diffMins) : '';

  const confirm = () => {
    onConfirm(selectedStart, selectedEnd);
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Specific time window"
      description="Choose the start and end hours for your task."
      footer={
        <Button full size="lg" variant="brand" onPress={confirm}>
          {`Confirm (${selectedStart} – ${selectedEnd})`}
        </Button>
      }
    >
      <View className="pb-2">
        {/* Tab Selector Boxes */}
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => setActiveTab('start')}
            className={`flex-1 rounded-2xl border p-3 items-center active:bg-ink-100/50 ${
              activeTab === 'start'
                ? 'border-brand bg-brand-tint/60'
                : 'border-ink-200 bg-white'
            }`}
          >
            <Text className="text-[11.5px] font-geist-medium text-ink-500">
              Start time
            </Text>
            <Text
              className={`text-[16px] font-geist-semibold mt-0.5 ${
                activeTab === 'start' ? 'text-brand-dark' : 'text-ink'
              }`}
            >
              {selectedStart}
            </Text>
          </Pressable>

          <ArrowRight size={18} color="#8A959B" />

          <Pressable
            onPress={() => setActiveTab('end')}
            className={`flex-1 rounded-2xl border p-3 items-center active:bg-ink-100/50 ${
              activeTab === 'end'
                ? 'border-brand bg-brand-tint/60'
                : 'border-ink-200 bg-white'
            }`}
          >
            <Text className="text-[11.5px] font-geist-medium text-ink-500">
              End time
            </Text>
            <Text
              className={`text-[16px] font-geist-semibold mt-0.5 ${
                activeTab === 'end' ? 'text-brand-dark' : 'text-ink'
              }`}
            >
              {selectedEnd}
            </Text>
          </Pressable>
        </View>

        {/* Helper instructions & duration banner */}
        <View className="mt-3 flex-row items-center justify-between px-1">
          <Text className="text-[12.5px] font-geist-medium text-ink-600">
            {activeTab === 'start'
              ? 'Select arrival / start time:'
              : 'Select completion / end time:'}
          </Text>
          {durationLabel ? (
            <Text className="text-[12px] font-geist-medium text-brand">
              {durationLabel}
            </Text>
          ) : null}
        </View>

        {/* Scrollable Slots Grid */}
        <ScrollView
          className="max-h-60 mt-2.5"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap gap-2 pb-4" style={{ gap: 8 }}>
            {TIME_SLOTS.map((slot) => {
              const isSelected =
                activeTab === 'start'
                  ? selectedStart === slot
                  : selectedEnd === slot;
              const slotMins = parseTimeToMinutes(slot);
              const isPastStart = activeTab === 'end' && slotMins <= startMins;

              return (
                <Pressable
                  key={slot}
                  onPress={() => handlePickSlot(slot)}
                  className={`py-2.5 px-3.5 rounded-xl border ${
                    isSelected
                      ? 'border-brand bg-brand'
                      : isPastStart
                      ? 'border-ink-100 bg-ink-50/50 opacity-40'
                      : 'border-ink-200 bg-white active:bg-ink-100'
                  }`}
                >
                  <Text
                    className={`text-[13px] ${
                      isSelected
                        ? 'font-geist-semibold text-white'
                        : isPastStart
                        ? 'font-geist text-ink-400'
                        : 'font-geist-medium text-ink-700'
                    }`}
                  >
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
}
