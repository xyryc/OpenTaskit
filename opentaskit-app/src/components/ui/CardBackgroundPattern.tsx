import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
  Circle,
} from 'react-native-svg';

export interface CardBackgroundPatternProps {
  variant?: 'halo' | 'aurora' | 'default';
}

export function CardBackgroundPattern({
  variant = 'halo',
}: CardBackgroundPatternProps) {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      className="overflow-hidden"
    >
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          {/* Top-Right Luminous Shimmer Bloom */}
          <RadialGradient
            id="auroraTopRight"
            cx="88%"
            cy="12%"
            r="65%"
            fx="88%"
            fy="12%"
          >
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
            <Stop offset="35%" stopColor="#CCE8FD" stopOpacity="0.14" />
            <Stop offset="70%" stopColor="#0094F7" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#0094F7" stopOpacity="0" />
          </RadialGradient>

          {/* Bottom-Left Ambient Glow Bloom */}
          <RadialGradient
            id="auroraBottomLeft"
            cx="12%"
            cy="88%"
            r="60%"
            fx="12%"
            fy="88%"
          >
            <Stop offset="0%" stopColor="#00E5FF" stopOpacity="0.22" />
            <Stop offset="40%" stopColor="#0094F7" stopOpacity="0.10" />
            <Stop offset="80%" stopColor="#0072C4" stopOpacity="0.02" />
            <Stop offset="100%" stopColor="#0072C4" stopOpacity="0" />
          </RadialGradient>

          {/* Center-Right Subtle Depth Bloom */}
          <RadialGradient
            id="auroraCenterAccent"
            cx="75%"
            cy="60%"
            r="45%"
            fx="75%"
            fy="60%"
          >
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <Stop offset="50%" stopColor="#CCE8FD" stopOpacity="0.05" />
            <Stop offset="100%" stopColor="#0094F7" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Seamless Soft Light Blooms */}
        <Rect width="100%" height="100%" fill="url(#auroraTopRight)" />
        <Rect width="100%" height="100%" fill="url(#auroraBottomLeft)" />
        <Rect width="100%" height="100%" fill="url(#auroraCenterAccent)" />

        {/* Option E: Faint Corner Halo Rings (Nested in top-right aurora) */}
        <Circle
          cx="88%"
          cy="12%"
          r="64"
          fill="none"
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth="1.2"
        />
        <Circle
          cx="88%"
          cy="12%"
          r="108"
          fill="none"
          stroke="rgba(255, 255, 255, 0.09)"
          strokeWidth="1"
          strokeDasharray="4,6"
        />
      </Svg>

      {/* Tactile Top Edge Glare Line */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 20,
          right: 20,
          height: 1.5,
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          borderRadius: 1,
        }}
      />
    </View>
  );
}
