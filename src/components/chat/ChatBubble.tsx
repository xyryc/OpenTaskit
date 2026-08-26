import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Check, CheckCheck, Clock } from 'lucide-react-native';
import type { Message } from '@/types';
import { clockTime } from '@/utils/format';

export function ChatBubble({
  message,
  mine,
}: {
  message: Message;
  mine: boolean;
}) {
  return (
    <View className={`flex-row ${mine ? 'justify-end' : 'justify-start'} my-1`}>
      <View
        className={`max-w-[80%] ${mine ? 'items-end' : 'items-start'} flex-col gap-1`}
      >
        {/* Attachment if present */}
        {message.attachment && (
          <Image
            source={{ uri: message.attachment }}
            style={[
              styles.attachment,
              mine ? styles.attachmentMine : styles.attachmentOther,
            ]}
            contentFit="cover"
          />
        )}

        {/* Text bubble */}
        {message.text ? (
          <View
            className={`px-4 py-2.5 ${
              mine
                ? 'rounded-3xl rounded-br-md bg-brand'
                : 'rounded-3xl rounded-bl-md border border-ink-200 bg-white'
            }`}
          >
            <Text
              className={`font-geist text-[14.5px] leading-relaxed ${
                mine ? 'text-white' : 'text-ink'
              }`}
            >
              {message.text}
            </Text>
          </View>
        ) : null}

        {/* Timestamp & Status checks */}
        <View className="flex-row items-center gap-1 px-1">
          <Text className="font-geist text-[10.5px] text-ink-400">
            {clockTime(message.at)}
          </Text>
          {mine && (
            message.status === 'sent' ? (
              <Clock size={11} color="#8A959B" />
            ) : message.status === 'delivered' ? (
              <Check size={12} color="#8A959B" />
            ) : (
              <CheckCheck size={13} color="#0094F7" />
            )
          )}
        </View>
      </View>
    </View>
  );
}

export function TypingBubble({ name }: { name: string }) {
  return (
    <View className="flex-row justify-start my-1">
      <View className="flex-row items-center gap-1.5 rounded-2xl rounded-bl-md border border-ink-200 bg-white px-3.5 py-3">
        <View className="h-2 w-2 rounded-full bg-ink-400" />
        <View className="h-2 w-2 rounded-full bg-ink-300" />
        <View className="h-2 w-2 rounded-full bg-ink-200" />
        <Text className="font-geist ml-1 text-[11px] text-ink-400">{name} is typing…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  attachment: {
    height: 160,
    width: 200,
    borderRadius: 16,
  },
  attachmentMine: {
    borderBottomRightRadius: 6,
  },
  attachmentOther: {
    borderBottomLeftRadius: 6,
  },
});
