import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

export interface CardBackgroundPatternProps {
  variant?: 'bubbles' | 'neomorphic' | 'combined';
}

export function CardBackgroundPattern({
  variant = 'combined',
}: CardBackgroundPatternProps) {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      className="overflow-hidden"
    >
      {/* SVG Soft Glowing Radial Bubbles */}
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          {/* Top-Right Soft Glow Orb */}
          <RadialGradient
            id="bubbleTopRight"
            cx="85%"
            cy="15%"
            r="60%"
            fx="85%"
            fy="15%"
          >
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.10" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>

          {/* Bottom-Left Ambient Glow Orb */}
          <RadialGradient
            id="bubbleBottomLeft"
            cx="15%"
            cy="85%"
            r="55%"
            fx="15%"
            fy="85%"
          >
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.20" />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Glowing Orbs */}
        <Circle cx="85%" cy="15%" r="130" fill="url(#bubbleTopRight)" />
        <Circle cx="12%" cy="85%" r="110" fill="url(#bubbleBottomLeft)" />

        {/* Floating Glass Bubbles with Subtle Strokes */}
        <Circle
          cx="78%"
          cy="48%"
          r="26"
          fill="rgba(255, 255, 255, 0.08)"
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth="1.5"
        />
        <Circle
          cx="62%"
          cy="18%"
          r="14"
          fill="rgba(255, 255, 255, 0.12)"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1"
        />
        <Circle
          cx="28%"
          cy="32%"
          r="8"
          fill="rgba(255, 255, 255, 0.25)"
        />
        <Circle
          cx="92%"
          cy="78%"
          r="18"
          fill="rgba(255, 255, 255, 0.06)"
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth="1"
        />
      </Svg>

      {/* Layered Concentric Ripple Rings (Neomorphic Depth) */}
      <View
        style={{
          position: 'absolute',
          top: -45,
          right: -45,
          width: 190,
          height: 190,
          borderRadius: 95,
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.18)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -15,
          right: -15,
          width: 130,
          height: 130,
          borderRadius: 65,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.22)',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
        }}
      />

      {/* Bottom-left Ambient Ring */}
      <View
        style={{
          position: 'absolute',
          bottom: -50,
          left: -40,
          width: 160,
          height: 160,
          borderRadius: 80,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.14)',
        }}
      />

      {/* Neomorphic Top Edge Glare (Simulating Top Light Source) */}
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
