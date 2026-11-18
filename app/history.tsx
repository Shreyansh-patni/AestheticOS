import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { database } from '@/services/database';
import { haptics } from '@/services/haptics';
import { NativeCard } from '@/components/NativeCard';
import { HeaderBar } from '@/components/HeaderBar';
import { WorkoutHistoryItem } from '@/types';

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [history, setHistory] = useState<WorkoutHistoryItem[]>(database.getWorkoutHistory());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    haptics.selection();
    setExpandedId(expandedId === id ? null : id);
  };

  const confirmDelete = (item: WorkoutHistoryItem) => {
    Alert.alert('Delete Session?', `Remove ${item.dayTitle} from ${item.date}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptics.warning();
          database.deleteWorkoutHistory(item.id);
          setHistory(database.getWorkoutHistory());
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.base }]}>
      <HeaderBar title="Workout History" subtitle="PERFORMANCE LOGS" showBack />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {history.length === 0 ? (
          <NativeCard style={styles.emptyCard}>
            <Ionicons name="barbell-outline" size={32} color={theme.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Sessions Logged</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>
              Completed workout sessions will appear here with volume, duration, and exercise details.
            </Text>
          </NativeCard>
        ) : (
          history.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <NativeCard key={item.id} style={styles.historyCard}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(item.id)}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dateText, { color: theme.accent }]}>{item.date}</Text>
                      <Text style={[styles.workoutTitle, { color: theme.text }]}>{item.dayTitle}</Text>
                    </View>
                    <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Duration</Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>{item.durationMinutes} min</Text>
                    </View>

                    <View style={styles.statCol}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Volume</Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {item.totalVolumeKg.toLocaleString()} kg
                      </Text>
                    </View>

                    <View style={styles.statCol}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Sets</Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>{item.setsCompleted} done</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Exercise Breakdown */}
                {isExpanded && (
                  <View style={[styles.breakdownBox, { borderTopColor: theme.cardBorder }]}>
                    <Text style={[styles.breakdownHeading, { color: theme.textMuted }]}>EXERCISE BREAKDOWN</Text>
                    {item.exercises.map((ex, i) => (
                      <View key={i} style={styles.exBreakdownRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.exBreakdownName, { color: theme.text }]}>{ex.name}</Text>
                          <Text style={[styles.exBreakdownSets, { color: theme.textSecondary }]}>
                            {ex.sets.map((s, sIdx) => `${s.weightKg}kg×${s.reps}`).join(' • ')}
                          </Text>
                        </View>
                        <Text style={[styles.exVolNumber, { color: theme.textMuted }]}>
                          {ex.totalVolumeKg} kg
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </NativeCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 44,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  historyCard: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  breakdownBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  breakdownHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  exBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  exBreakdownName: {
    fontSize: 13,
    fontWeight: '600',
  },
  exBreakdownSets: {
    fontSize: 11,
    marginTop: 2,
  },
  exVolNumber: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
