import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  tone?: 'light' | 'dark';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  tone = 'light',
}: SegmentedControlProps<T>) {
  return (
    <View
      className={`flex-row p-1 ${className}`}
      style={[
        styles.container,
        tone === 'light' ? styles.containerLight : styles.containerDark,
      ]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.tab,
              active && styles.activeTab,
            ]}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5"
          >
            {option.icon}
            <Text
              style={[
                styles.tabText,
                active
                  ? styles.activeText
                  : tone === 'light'
                  ? styles.inactiveLightText
                  : styles.inactiveDarkText,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 4,
  },
  containerLight: {
    backgroundColor: '#F0F3F4',
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tab: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E7E9',
    shadowColor: '#0C1417',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
  },
  activeText: {
    color: '#0C1417',
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
  inactiveLightText: {
    color: '#5B6A72',
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
  },
  inactiveDarkText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
  },
});

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'warning' }) {
  return (
    <View className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
      <View
        className={`h-full rounded-full ${tone === 'brand' ? 'bg-brand' : 'bg-warning'}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </View>
  );
}

export interface TabBarProps<T extends string> {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}

export function TabBar<T extends string>({ tabs, value, onChange }: TabBarProps<T>) {
  return (
    <View className="flex-row border-b border-ink-200 px-1">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            className="relative flex-1 items-center pb-3 pt-2"
          >
            <View className="flex-row items-center gap-1.5">
              <Text
                className={`text-[14px] ${
                  active ? 'font-geist-bold font-bold text-ink' : 'font-geist-medium font-medium text-ink-400'
                }`}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 && (
                <View
                  className={`rounded-full px-1.5 py-0.5 ${
                    active ? 'bg-brand-tint' : 'bg-ink-100'
                  }`}
                >
                  <Text
                    className={`text-[11px] ${
                      active ? 'font-geist-bold font-bold text-brand-dark' : 'font-geist-medium font-medium text-ink-400'
                    }`}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </View>
            {active && (
              <View className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function StepProgress({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label?: string;
}) {
  return (
    <View>
      <View className="flex-row items-baseline justify-between">
        <Text className="font-geist-medium text-[12px] uppercase tracking-[0.08em] text-ink-400">
          Step {current} of {total}
        </Text>
        {label && (
          <Text className="font-geist-medium text-[12.5px] text-ink-700">
            {label}
          </Text>
        )}
      </View>
      <View className="mt-2 flex-row gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < current ? 'bg-brand' : 'bg-ink-200'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
