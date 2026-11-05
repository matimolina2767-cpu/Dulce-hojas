import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import type { LogoVisual } from '../utils/logoState';

type Props = { visual: LogoVisual; size?: number; showLabel?: boolean };

const HEART: Record<LogoVisual['heart'], string> = {
  lleno: '❤️',
  medio: '🩷',
  roto: '💔',
  ninguno: '',
};

/**
 * Logo de Dulce Hogar dibujado con Views (placeholder).
 * Cuando tengas el arte final, reemplazá el cuerpo por imágenes/SVG
 * por estado manteniendo la misma prop `visual`.
 */
export function DulceHogarLogo({ visual, size = 160, showLabel = true }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.stopAnimation();
    anim.setValue(0);
    if (visual.animation === 'ninguna') return;
    const duration = visual.animation === 'latido' ? 600 : visual.animation === 'temblor' ? 90 : 1800;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visual.animation, anim]);

  const transform =
    visual.animation === 'temblor'
      ? [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] }) }]
      : visual.animation === 'latido'
        ? [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }]
        : visual.animation === 'respirar'
          ? [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) }]
          : [];

  const { colors } = visual;
  const w = size;
  const roofH = w * 0.42;
  const bodyW = w * 0.72;
  const bodyH = w * 0.5;
  const win = w * 0.16;

  return (
    <View style={styles.wrapper} accessibilityRole="image" accessibilityLabel={`Logo: ${visual.label}`}>
      <View style={[styles.badge, { width: w * 1.3, height: w * 1.3, borderRadius: w, backgroundColor: colors.background }]}>
        <Animated.View style={{ alignItems: 'center', transform }}>
          <Text style={{ fontSize: w * 0.16, height: w * 0.2 }}>{HEART[visual.heart]}</Text>
          {/* Techo */}
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: w / 2,
              borderRightWidth: w / 2,
              borderBottomWidth: roofH,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: colors.roof,
            }}
          />
          {/* Paredes */}
          <View style={[styles.body, { width: bodyW, height: bodyH, backgroundColor: colors.walls }]}>
            <View style={styles.windows}>
              {[0, 1].map((i) => (
                <View
                  key={i}
                  style={{
                    width: win,
                    height: win,
                    borderRadius: 3,
                    backgroundColor: i < visual.litWindows ? colors.windowLit : colors.windowOff,
                  }}
                />
              ))}
            </View>
            <View
              style={{
                width: w * 0.16,
                height: bodyH * 0.45,
                backgroundColor: colors.door,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
              }}
            />
          </View>
        </Animated.View>
      </View>
      {showLabel && (
        <View style={styles.labels}>
          <Text style={styles.label}>{visual.label}</Text>
          <Text style={styles.description}>{visual.description}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  badge: { alignItems: 'center', justifyContent: 'center' },
  body: { alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  windows: { flexDirection: 'row', width: '70%', justifyContent: 'space-between' },
  labels: { marginTop: 12, alignItems: 'center', paddingHorizontal: 16 },
  label: { fontSize: 18, fontWeight: '700', color: '#3A2E39' },
  description: { fontSize: 14, color: '#6B5E69', textAlign: 'center', marginTop: 4 },
});
