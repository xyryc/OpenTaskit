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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
  },
  activeText: {
    color: '#0C1417',
    fontWeight: '700',
  },
  inactiveLightText: {
    color: '#5B6A72',
    fontWeight: '500',
  },
  inactiveDarkText: {
    color: 'rgba(255, 255, 255, 0.7)',
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
