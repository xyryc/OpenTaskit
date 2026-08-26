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
    <View>
      {label && (
        <View
          className="mb-2 flex-row items-baseline justify-between"
          style={{ marginBottom: 8 }}
        >
          <Text className="text-[13px] font-geist font-medium text-ink-700">{label}</Text>
          {optional && <Text className="font-geist text-[12px] text-ink-400">Optional</Text>}
        </View>
      )}
      {children}
      {error ? (
        <View className="mt-1.5 flex-row items-center" style={{ marginTop: 6 }}>
          <AlertCircle size={14} color="#C7382F" />
          <Text className="ml-1.5 text-[12px] font-geist font-medium text-danger">{error}</Text>
        </View>
      ) : hint ? (
        <View className="mt-1.5" style={{ marginTop: 6 }}>
          <Text className="font-geist text-[12px] leading-snug text-ink-400">{hint}</Text>
        </View>
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
            ? 'border-danger'
            : 'border-ink-200 focus:border-brand'
        } ${containerClassName}`}
      >
        {leading && <View className="font-geist mr-3 text-ink-400">{leading}</View>}

        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholderTextColor="#8A959B"
          style={[{ fontFamily: 'Geist-Regular' }, props.style]}
          className={`flex-1 text-[15px] text-ink font-geist ${className}`}
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
          error ? 'border-danger' : 'border-ink-200'
        }`}
      >
        <TextInput
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={value}
          onChangeText={handleChangeText}
          placeholderTextColor="#8A959B"
          style={[{ fontFamily: 'Geist-Regular' }, props.style]}
          className={`flex-1 text-[15px] text-ink font-geist ${className}`}
          {...props}
        />
      </View>
    </Field>
  );
}

export interface SearchInputProps extends TextInputProps {
  onClear?: () => void;
  className?: string;
  containerClassName?: string;
}

export function SearchInput({
  value,
  onChangeText,
  onClear,
  className = '',
  containerClassName = '',
  placeholder = 'Search tasks or categories…',
  ...props
}: SearchInputProps) {
  return (
    <View
      className={`relative flex-row items-center h-12 rounded-2xl border border-ink-200 bg-white px-4 ${className} ${containerClassName}`}
    >
      <Search size={18} color="#8A959B" className="mr-2" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A959B"
        style={[{ fontFamily: 'Geist-Regular' }, props.style]}
        className="flex-1 text-[15px] text-ink font-geist"
        {...props}
      />
      {value && value.length > 0 && onClear && (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          className="ml-2 h-6 w-6 items-center justify-center rounded-full bg-ink-100 active:bg-ink-200"
        >
          <X size={12} color="#5B6A72" />
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
  tone?: 'light' | 'dark';
}

export function Toggle({ checked, onChange, label, description, tone = 'light' }: ToggleProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      className="flex-row items-center justify-between gap-4 py-1"
    >
      <View className="flex-1">
        <Text
          className={`text-[15px] font-geist-semibold ${
            tone === 'dark' ? 'text-white' : 'text-ink'
          }`}
        >
          {label}
        </Text>
        {description && (
          <Text
            className={`mt-0.5 text-[12.5px] leading-snug font-geist ${
              tone === 'dark' ? 'text-white/70' : 'text-ink-500'
            }`}
          >
            {description}
          </Text>
        )}
      </View>

      <View
        className={`h-7 w-12 rounded-full p-0.5 justify-center ${
          checked ? 'bg-brand items-end' : tone === 'dark' ? 'bg-white/20 items-start' : 'bg-ink-200 items-start'
        }`}
      >
        <View className="h-6 w-6 rounded-full bg-white shadow-sm" />
      </View>
    </Pressable>
  );
}
