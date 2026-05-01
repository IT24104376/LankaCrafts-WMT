import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Polygon, Circle, Rect } from 'react-native-svg';

export function BatikBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="batik-bg" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <Polygon
              points="30,4 56,30 30,56 4,30"
              fill="none"
              stroke="#2F5D50"
              strokeWidth={1.5}
            />
            <Circle cx="30" cy="30" r="3" fill="#2F5D50" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#batik-bg)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
});
