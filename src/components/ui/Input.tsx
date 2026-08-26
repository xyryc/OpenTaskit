import React from 'react';
import { View, Text, TextInput, TextInputProps, Pressable } from 'react-native';
import { AlertCircle, Search, X } from 'lucide-react-native';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  optional?: boolean;
}

export function Field({ label, hint, error, children, optional }: FieldProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <View className="flex-row items-baseline justify-between">
          <Text className="text-[13px] font-medium text-ink-700">{label}</Text>
          {optional && <Text className="text-[12px] text-ink-400">Optional</Text>}
        </View>
      )}
      {children}
      {error ? (
        <View className="flex-row items-center gap-1.5 mt-0.5">
          <AlertCircle size={14} color="#C7382F" />
          <Text className="text-[12px] font-medium text-danger">{error}</Text>
        </View>
      ) : hint ? (
        <Text className="text-[12px] leading-snug text-ink-400 mt-0.5">{hint}</Text>
      ) : null}
    </View>
  );
}

export interface TextFieldProps extends Omit<TextInputProps, 'onChange'> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  optional?: boolean;
  className?: string;
  containerClassName?: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: any) => void;
}

export function TextField({
  label,
  hint,
  error,
  leading,
  trailing,
  optional,
  className = '',
  containerClassName = '',
  onChangeText,
  onChange,
  value,
  ...props
}: TextFieldProps) {
  const handleChangeText = (text: string) => {
    if (onChangeText) onChangeText(text);
    if (onChange) onChange({ target: { value: text } });
  };

  return (
    <Field label={label} hint={hint} error={error} optional={optional}>
      <View
        className={`relative flex-row items-center h-[52px] rounded-2xl border bg-white px-4 ${
          error
            ? 'border-danger/60'
            : 'border-ink-200 focus:border-brand'
        } ${containerClassName}`}
      >
        {leading && <View className="mr-3 text-ink-400">{leading}</View>}

        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholderTextColor="#8A959B"
          className={`flex-1 text-[15px] text-ink font-normal ${className}`}
          {...props}
        />

        {trailing && <View className="ml-2">{trailing}</View>}
      </View>
    </Field>
  );
}

export interface TextAreaProps extends Omit<TextInputProps, 'onChange'> {
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: any) => void;
}

export function TextArea({
  label,
  hint,
  error,
  optional,
  className = '',
  onChangeText,
  onChange,
  value,
  ...props
}: TextAreaProps) {
  const handleChangeText = (text: string) => {
    if (onChangeText) onChangeText(text);
    if (onChange) onChange({ target: { value: text } });
  };

  return (
    <Field label={label} hint={hint} error={error} optional={optional}>
      <View
        className={`min-h-[120px] rounded-2xl border bg-white p-3.5 ${
          error ? 'border-danger/60' : 'border-ink-200'
        }`}
      >
        <TextInput
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={value}
          onChangeText={handleChangeText}
          placeholderTextColor="#8A959B"
          className={`flex-1 text-[15px] text-ink font-normal ${className}`}
          {...props}
        />
      </View>
    </Field>
  );
}

export interface SearchInputProps extends TextInputProps {
  onClear?: () => void;
  className?: string;
}

export function SearchInput({
  onClear,
  className = '',
  value,
  onChangeText,
  ...props
}: SearchInputProps) {
  return (
    <View className={`relative flex-row items-center h-12 rounded-2xl border border-ink-200 bg-white px-4 ${className}`}>
      <Search size={18} color="#8A959B" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#8A959B"
        className="flex-1 ml-3 text-[15px] text-ink"
        {...props}
      />
      {!!value && onClear && (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          className="h-6 w-6 rounded-full bg-ink-100 items-center justify-center"
        >
          <X size={14} color="#5B6A72" />
        </Pressable>
      )}
    </View>
  );
}

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      className="flex-row items-center justify-between gap-4 py-1"
    >
      <View className="flex-1">
        <Text className="text-[15px] font-medium text-ink">{label}</Text>
        {description && (
          <Text className="mt-0.5 text-[12.5px] leading-snug text-ink-500">
            {description}
          </Text>
        )}
      </View>

      <View
        className={`h-7 w-12 rounded-full p-0.5 justify-center ${
          checked ? 'bg-brand items-end' : 'bg-ink-200 items-start'
        }`}
      >
        <View className="h-6 w-6 rounded-full bg-white shadow-sm" />
      </View>
    </Pressable>
  );
}
