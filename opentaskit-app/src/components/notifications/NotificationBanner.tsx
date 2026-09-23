import React, { useEffect } from 'react';
import { View, Text, Pressable, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { NOTIFICATION_KIND_META } from './notificationMeta';
import { notificationKind } from '@/utils/notifications';
import type { NotificationRecord } from '@/types';

const AUTO_DISMISS_MS = 4500;
const SWIPE_DISMISS_THRESHOLD = -30;

export function NotificationBanner({
  notification,
  onPress,
  onDismiss,
}: {
  notification: NotificationRecord;
  onPress: () => void;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-160);
  const opacity = useSharedValue(0);

  const meta = NOTIFICATION_KIND_META[notificationKind(notification)] ?? NOTIFICATION_KIND_META.system;

  const dismiss = () => {
    translateY.value = withTiming(-160, { duration: 220, easing: Easing.in(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
  };

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 260 });

    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification.id]);

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy < 0) {
          translateY.value = gesture.dy;
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < SWIPE_DISMISS_THRESHOLD) {
          dismiss();
        } else {
          translateY.value = withTiming(0, { duration: 180 });
        }
      },
    })
  ).current;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[{ paddingTop: Math.max(insets.top, 12) + 4 }, animatedStyle]}
      className="px-4"
    >
      <Pressable
        onPress={() => {
          onPress();
          dismiss();
        }}
        className="flex-row items-start gap-3 rounded-3xl border border-ink-200 bg-white p-4 shadow-lg active:bg-ink-100/60"
        style={{ gap: 12, elevation: 8 }}
      >
        <View
          className={`h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${meta.iconBg}`}
        >
          {meta.icon}
        </View>

        <View className="flex-1 min-w-0">
          <Text numberOfLines={1} className="text-[14px] font-geist-semibold text-ink">
            {notification.title}
          </Text>
          <Text numberOfLines={2} className="mt-0.5 text-[12.5px] font-geist leading-snug text-ink-600">
            {notification.body}
          </Text>
        </View>

        <Pressable
          onPress={dismiss}
          hitSlop={10}
          className="h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-100 active:bg-ink-200"
        >
          <X size={13} color="#5B6A72" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
