import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { database } from '@/services/database';
import { haptics } from '@/services/haptics';
import { NativeCard } from '@/components/NativeCard';
import { HeaderBar } from '@/components/HeaderBar';

export default function ChallengeScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [completedDays, setCompletedDays] = useState<number[]>(database.getChallengeDays());

  const toggleDay = (dayNum: number) => {
    haptics.medium();
    const isNowDone = database.toggleChallengeDay(dayNum);
    setCompletedDays(database.getChallengeDays());
  };

  const streak = completedDays.length;
  const progressPercent = Math.round((streak / 30) * 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.base }]}>
      <HeaderBar title="30-Day Foundation" subtitle="DISCIPLINE & HABITS" showBack />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <NativeCard style={styles.bannerCard}>
          <View style={styles.bannerHeader}>
            <View>
              <Text style={[styles.bannerLabel, { color: theme.textMuted }]}>CURRENT STREAK</Text>
              <Text style={[styles.bannerScore, { color: theme.text }]}>
                {streak} <Text style={{ fontSize: 16, color: theme.textMuted }}>/ 30 Days</Text>
              </Text>
            </View>
            <View style={[styles.trophyBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="trophy" size={24} color="#F59E0B" />
              <Text style={[styles.trophyPercent, { color: '#F59E0B' }]}>{progressPercent}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: theme.subtle }]}>
            <View style={[styles.progressBar, { width: `${progressPercent}%`, backgroundColor: '#F59E0B' }]} />
          </View>

          <Text style={[styles.bannerDescription, { color: theme.textSecondary }]}>
            The foundation phase sets your metabolic momentum and neural pathways. Complete your scheduled session (or active recovery), walk 30 minutes, hit your 95g protein target, and drink 3L water.
          </Text>
        </NativeCard>

        {/* 30-Day Grid */}
        <NativeCard style={styles.gridCard}>
          <Text style={[styles.gridTitle, { color: theme.text, marginBottom: 12 }]}>Foundation Calendar</Text>
          <View style={styles.daysGrid}>
            {Array.from({ length: 30 }).map((_, idx) => {
              const dayNum = idx + 1;
              const isCompleted = completedDays.includes(dayNum);

              return (
                <TouchableOpacity
                  key={dayNum}
                  style={[
                    styles.dayTile,
                    {
                      backgroundColor: isCompleted ? theme.accent : theme.subtle,
                      borderColor: isCompleted ? theme.accent : theme.border,
                    },
                  ]}
                  onPress={() => toggleDay(dayNum)}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: isCompleted ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    {dayNum}
                  </Text>
                  {isCompleted && (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </NativeCard>

        {/* Milestone Milestones */}
        <NativeCard style={styles.milestoneCard}>
          <Text style={[styles.gridTitle, { color: theme.text, marginBottom: 10 }]}>Milestones</Text>

          {[
            { day: 7, label: 'Neural Adaptation & Habit Lock', reward: 'Week 1 Complete' },
            { day: 14, label: 'Metabolic & Muscular Glycogen Uptake', reward: 'Week 2 Complete' },
            { day: 21, label: 'V-Taper Foundation & Posture Alignment', reward: 'Week 3 Complete' },
            { day: 30, label: 'Aesthetic Foundation Ascendancy', reward: 'Graduate to Intermediate' },
          ].map((m) => {
            const unlocked = streak >= m.day;
            return (
              <View key={m.day} style={[styles.milestoneRow, { borderBottomColor: theme.cardBorder }]}>
                <Ionicons
                  name={unlocked ? 'ribbon' : 'ribbon-outline'}
                  size={24}
                  color={unlocked ? '#F59E0B' : theme.textMuted}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.milestoneLabel, { color: theme.text }]}>
                    Day {m.day}: {m.label}
                  </Text>
                  <Text style={[styles.milestoneSub, { color: theme.textMuted }]}>{m.reward}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: unlocked ? 'rgba(16, 185, 129, 0.15)' : theme.subtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: unlocked ? theme.accent : theme.textMuted },
                    ]}
                  >
                    {unlocked ? 'UNLOCKED' : 'LOCKED'}
                  </Text>
                </View>
              </View>
            );
          })}
        </NativeCard>
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
  bannerCard: {
    padding: 18,
    marginBottom: 12,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  bannerScore: {
    fontSize: 28,
    fontWeight: '800',
  },
  trophyBadge: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trophyPercent: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  bannerDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  gridCard: {
    padding: 16,
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayTile: {
    width: '15%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  checkIcon: {
    position: 'absolute',
    bottom: 2,
  },
  milestoneCard: {
    padding: 16,
    marginBottom: 20,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  milestoneLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  milestoneSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
