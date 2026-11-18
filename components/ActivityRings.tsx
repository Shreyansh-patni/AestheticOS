import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface ActivityRingsProps {
  size?: number;
  workoutProgress: number; // 0 to 1
  walkProgress: number;    // 0 to 1
  nutritionProgress: number; // 0 to 1
}

export function ActivityRings({
  size = 140,
  workoutProgress = 0,
  walkProgress = 0,
  nutritionProgress = 0,
}: ActivityRingsProps) {
  const strokeWidth = 10;
  const center = size / 2;

  // Ring 1 (Outer - Workout)
  const r1 = center - strokeWidth;
  const circ1 = 2 * Math.PI * r1;
  const p1 = Math.min(Math.max(workoutProgress, 0), 1);
  const strokeDashoffset1 = circ1 - p1 * circ1;

  // Ring 2 (Middle - Walk)
  const r2 = r1 - strokeWidth - 4;
  const circ2 = 2 * Math.PI * r2;
  const p2 = Math.min(Math.max(walkProgress, 0), 1);
  const strokeDashoffset2 = circ2 - p2 * circ2;

  // Ring 3 (Inner - Nutrition)
  const r3 = r2 - strokeWidth - 4;
  const circ3 = 2 * Math.PI * r3;
  const p3 = Math.min(Math.max(nutritionProgress, 0), 1);
  const strokeDashoffset3 = circ3 - p3 * circ3;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Ring 1 Track & Progress */}
          <Circle
            cx={center}
            cy={center}
            r={r1}
            stroke="rgba(16, 185, 129, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={r1}
            stroke="#10B981"
            strokeWidth={strokeWidth}
            strokeDasharray={circ1}
            strokeDashoffset={strokeDashoffset1}
            strokeLinecap="round"
            fill="none"
          />

          {/* Ring 2 Track & Progress */}
          <Circle
            cx={center}
            cy={center}
            r={r2}
            stroke="rgba(56, 189, 248, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={r2}
            stroke="#38BDF8"
            strokeWidth={strokeWidth}
            strokeDasharray={circ2}
            strokeDashoffset={strokeDashoffset2}
            strokeLinecap="round"
            fill="none"
          />

          {/* Ring 3 Track & Progress */}
          <Circle
            cx={center}
            cy={center}
            r={r3}
            stroke="rgba(245, 158, 11, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={r3}
            stroke="#F59E0B"
            strokeWidth={strokeWidth}
            strokeDasharray={circ3}
            strokeDashoffset={strokeDashoffset3}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
    </View>
  );
}
