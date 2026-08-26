import React from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';

export type ButtonVariant = 'brand' | 'ink' | 'outline' | 'subtle' | 'ghost' | 'danger';
export type ButtonSize = 'lg' | 'md' | 'sm';

const variantContainerClasses: Record<ButtonVariant, string> = {
  brand: 'bg-brand active:bg-brand-dark',
  ink: 'bg-ink active:bg-ink-800',
  outline: 'bg-white border border-ink-200 active:bg-ink-100',
  subtle: 'bg-ink-100 active:bg-ink-200',
  ghost: 'bg-transparent active:bg-ink-100',
  danger: 'bg-danger active:opacity-90',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  brand: 'text-white',
  ink: 'text-white',
  outline: 'text-ink',
  subtle: 'text-ink',
  ghost: 'text-ink-700',
  danger: 'text-white',
};

const sizeContainerClasses: Record<ButtonSize, string> = {
  lg: 'h-[52px] px-6 rounded-2xl',
  md: 'h-11 px-4 rounded-xl',
  sm: 'h-9 px-3.5 rounded-xl',
};

const sizeTextClasses: Record<ButtonSize, string> = {
  lg: 'text-[15px]',
  md: 'text-[14px]',
  sm: 'text-[13px]',
};

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  onClick?: () => void; // for web codebase compatibility
  style?: StyleProp<ViewStyle>;
}

export function Button({
  variant = 'brand',
  size = 'lg',
  full,
  loading,
  icon,
  iconRight,
  className = '',
  textClassName = '',
  children,
  disabled,
  onPress,
  onClick,
  style,
}: ButtonProps) {
  const handlePress = (e: GestureResponderEvent) => {
    if (disabled || loading) return;
    if (onPress) onPress(e);
    if (onClick) onClick();
  };

  const indicatorColor =
    variant === 'brand' || variant === 'ink' || variant === 'danger' ? '#FFFFFF' : '#0C1417';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={style}
      className={`flex-row items-center justify-center gap-2 font-medium ${
        variantContainerClasses[variant]
      } ${sizeContainerClasses[size]} ${full ? 'w-full' : ''} ${
        disabled || loading ? 'opacity-45' : ''
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        icon
      )}

      {typeof children === 'string' ? (
        <Text
          className={`font-semibold tracking-tight ${variantTextClasses[variant]} ${sizeTextClasses[size]} ${textClassName}`}
        >
          {children}
        </Text>
      ) : (
        children
      )}

      {!loading && iconRight}
    </Pressable>
  );
}

export interface IconButtonProps {
  label?: string;
  variant?: 'plain' | 'subtle' | 'brand';
  size?: 'sm' | 'md';
  className?: string;
  children?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onClick?: () => void;
  disabled?: boolean;
}

const iconVariantClasses = {
  plain: 'bg-white border border-ink-200 active:bg-ink-100',
  subtle: 'bg-ink-100 active:bg-ink-200',
  brand: 'bg-brand active:bg-brand-dark',
};

export function IconButton({
  variant = 'plain',
  size = 'md',
  className = '',
  children,
  onPress,
  onClick,
  disabled,
}: IconButtonProps) {
  const handlePress = (e: GestureResponderEvent) => {
    if (disabled) return;
    if (onPress) onPress(e);
    if (onClick) onClick();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={`items-center justify-center rounded-full ${iconVariantClasses[variant]} ${
        size === 'md' ? 'h-11 w-11' : 'h-9 w-9'
      } ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      {children}
    </Pressable>
  );
}
