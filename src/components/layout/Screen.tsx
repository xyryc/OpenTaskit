import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

export interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  tone?: 'canvas' | 'white' | 'ink';
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

export function Screen({
  children,
  className = '',
  tone = 'canvas',
  edges = ['top', 'bottom'],
}: ScreenProps) {
  const bg = tone === 'canvas' ? 'bg-canvas' : tone === 'white' ? 'bg-white' : 'bg-brand-deep';
  return (
    <SafeAreaView edges={edges} className={`flex-1 ${bg} ${className}`}>
      {children}
    </SafeAreaView>
  );
}

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  back?: boolean;
  actions?: React.ReactNode;
  border?: boolean;
  large?: boolean;
  className?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  back = true,
  actions,
  border = true,
  large,
  className = '',
}: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      className={`px-4 pt-3 pb-3 bg-white ${
        border ? 'border-b border-ink-200/60' : ''
      } ${className}`}
    >
      <View className="flex-row items-center gap-2">
        {back && (
          <Pressable
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="-ml-1 h-10 w-10 items-center justify-center rounded-full active:bg-ink-100"
          >
            <ChevronLeft size={24} color="#0C1417" />
          </Pressable>
        )}

        <View className="flex-1 min-w-0">
          {title && (
            <Text
              numberOfLines={1}
              className={`font-semibold tracking-tight text-ink ${
                large ? 'text-[22px]' : 'text-[17px]'
              }`}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text numberOfLines={1} className="mt-0.5 text-[12.5px] text-ink-500">
              {subtitle}
            </Text>
          )}
        </View>

        {actions && <View className="flex-row items-center gap-2">{actions}</View>}
      </View>
    </View>
  );
}

export function ScreenBody({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <View className={`flex-1 ${padded ? 'px-5 pb-8 pt-4' : ''} ${className}`}>
      {children}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
  className = '',
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <View className={`mb-3 flex-row items-baseline justify-between gap-3 ${className}`}>
      <Text className="text-[16px] font-semibold tracking-tight text-ink">
        {title}
      </Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-[13px] font-medium text-brand">{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
