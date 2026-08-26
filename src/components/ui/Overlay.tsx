import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { Button } from './Button';

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
                <Text className="text-[20px] font-geist-bold font-bold tracking-tight text-ink">
                  {title}
                </Text>
              )}
              {description && (
                <Text className="font-geist mt-1 text-[13.5px] leading-relaxed text-ink-500">
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

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'brand' | 'danger';
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'brand',
  icon,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(12, 20, 23, 0.45)' }}
      >
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View
          className="relative w-full max-w-[320px] rounded-3xl bg-white p-6 items-center"
          style={{
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}
        >
          {icon && (
            <View
              className="mb-4 h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor:
                  tone === 'danger'
                    ? 'rgba(199, 56, 47, 0.1)'
                    : '#E6F4FE',
              }}
            >
              {icon}
            </View>
          )}

          <Text className="text-[17px] font-geist-bold font-bold tracking-tight text-ink text-center">
            {title}
          </Text>

          <Text className="font-geist mt-2 text-[13.5px] leading-relaxed text-ink-500 text-center">
            {message}
          </Text>

          <View className="mt-6 w-full gap-2.5">
            <Button
              variant={tone === 'danger' ? 'danger' : 'brand'}
              full
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmLabel}
            </Button>
            <Button variant="ghost" full onPress={onClose}>
              {cancelLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
