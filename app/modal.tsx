import React from 'react';
import { StyleSheet, View, Text, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { NativeCard } from '@/components/NativeCard';

export default function ModalScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.base }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Ionicons name="barbell" size={32} color={theme.accent} />
        <Text style={[styles.title, { color: theme.text }]}>AestheticOS</Text>
        <Text style={[styles.tagline, { color: theme.textMuted }]}>
          Precision Personal Fitness Architecture
        </Text>
      </View>

      <NativeCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Core Principles</Text>
        <Text style={[styles.cardText, { color: theme.textSecondary }]}>
          1. Progressive Overload: Gradual muscle stimulation with 1-2 reps in reserve (RIR).
          {'\n\n'}
          2. No Crash Diets: Caloric surplus (2350 kcal) to gain 55kg → 65kg lean athletic mass without excessive fat.
          {'\n\n'}
          3. Daily Foundation: 30 minutes daily walking and 95g protein as non-negotiable health anchors.
          {'\n\n'}
          4. Myth-Free Fitness: Spot reduction does not exist; body composition changes through consistent adherence.
        </Text>
      </NativeCard>

      <NativeCard variant="subtle" style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Offline-First Native Architecture</Text>
        <Text style={[styles.cardText, { color: theme.textSecondary }]}>
          AestheticOS runs completely offline on your device using Expo SQLite. Your workout logs, body measurements, and nutrition data remain 100% private and persistent.
        </Text>
      </NativeCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  card: {
    width: '100%',
    padding: 16,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
