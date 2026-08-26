import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: BottomSheetProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-ink/40">
        {/* Backdrop dismiss */}
        <Pressable className="flex-1" onPress={onClose} />

        {/* Sheet Content */}
        <View className="w-full max-h-[85%] rounded-t-4xl bg-white pb-6 pt-3 px-6 shadow-2xl">
          {/* Top Grab Handle */}
          <View className="h-1.5 w-12 rounded-full bg-ink-200 self-center mb-4" />

          {/* Header */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              {title && (
                <Text className="text-[20px] font-bold tracking-tight text-ink">
                  {title}
                </Text>
              )}
              {description && (
                <Text className="mt-1 text-[13.5px] leading-relaxed text-ink-500">
                  {description}
                </Text>
              )}
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-ink-100"
            >
              <X size={16} color="#5B6A72" />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          {footer && <View className="mt-4 pt-3 border-t border-ink-100">{footer}</View>}
        </View>
      </View>
    </Modal>
  );
}
