import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { database } from '@/services/database';
import { haptics } from '@/services/haptics';
import { NativeCard } from '@/components/NativeCard';
import { NativeButton } from '@/components/NativeButton';
import { ActivityRings } from '@/components/ActivityRings';
import { UserProfile, WorkoutProgramDay, DailyHabitLog, WorkoutHistoryItem } from '@/types';

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [profile, setProfile] = useState<UserProfile>(database.getProfile());
  const [program, setProgram] = useState<WorkoutProgramDay[]>(database.getProgram());
  const [habits, setHabits] = useState<DailyHabitLog>(
    database.getDailyHabits(new Date().toISOString().split('T')[0])
  );
  const [history, setHistory] = useState<WorkoutHistoryItem[]>(database.getWorkoutHistory());
  const [walkMinutes, setWalkMinutes] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const dayNames: Array<'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'> = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const todayDayName = dayNames[new Date().getDay()];
  const todayProgramDay = program.find((p) => p.dayOfWeek === todayDayName) || program[0];

  const loadData = useCallback(() => {
    setProfile(database.getProfile());
    setProgram(database.getProgram());
    setHabits(database.getDailyHabits(todayStr));
    setHistory(database.getWorkoutHistory());

    const walks = database.getWalkLogs(todayStr);
    const totalWalk = walks.reduce((acc, w) => acc + w.durationMinutes, 0);
    setWalkMinutes(totalWalk);
  }, [todayStr]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const toggleHabitItem = (key: keyof Omit<DailyHabitLog, 'date'>) => {
    haptics.selection();
    const updated = database.toggleHabit(todayStr, key);
    setHabits(updated);
  };

  const quickAddWalk = (mins: number) => {
    haptics.success();
    const currentWalks = database.getWalkLogs(todayStr);
    const updatedMinutes = walkMinutes + mins;
    setWalkMinutes(updatedMinutes);

    database.saveWalkLog({
      id: `walk-${Date.now()}`,
      date: todayStr,
      durationMinutes: mins,
      distanceKm: Number(((mins / 30) * 2.4).toFixed(2)),
      completed: updatedMinutes >= profile.dailyWalkingTargetMinutes,
      notes: 'Quick logged walk',
    });

    if (updatedMinutes >= profile.dailyWalkingTargetMinutes && !habits.walkCompleted) {
      const updated = database.toggleHabit(todayStr, 'walkCompleted');
      setHabits(updated);
    }
  };

  const startTodayWorkout = () => {
    haptics.medium();
    router.push('/(tabs)/workout');
  };

  // Activity rings progress calculations
  const workoutProgress = habits.workoutCompleted ? 1 : 0.2;
  const walkProgress = Math.min(walkMinutes / profile.dailyWalkingTargetMinutes, 1);
  const nutritionProgress = habits.proteinMet ? 1 : habits.balancedMeals ? 0.6 : 0.2;

  // Format date display (e.g. "Monday, Nov 18")
  const dateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.base }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
    >
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.dateText, { color: theme.textMuted }]}>{dateFormatted.toUpperCase()}</Text>
          <Text style={[styles.mainHeading, { color: theme.text }]}>AestheticOS</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: theme.subtle }]}
            onPress={() => {
              haptics.light();
              router.push('/challenge');
            }}
          >
            <Ionicons name="flame" size={20} color="#F59E0B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: theme.subtle, marginLeft: 8 }]}
            onPress={() => {
              haptics.light();
              router.push('/history');
            }}
          >
            <Ionicons name="time-outline" size={20} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: theme.subtle, marginLeft: 8 }]}
            onPress={() => {
              haptics.light();
              router.push('/settings');
            }}
          >
            <Ionicons name="settings-outline" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 7-Day Weekly Strip */}
      <View style={[styles.weeklyStrip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {daysOfWeek.map((day, idx) => {
          const mapDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const isToday = fullDays[idx] === todayDayName;
          const progDay = program.find((p) => p.dayOfWeek === fullDays[idx]);
          const isRest = progDay?.isRestDay;

          return (
            <View key={day} style={[styles.dayItem, isToday && { backgroundColor: theme.subtle, borderRadius: 10 }]}>
              <Text style={[styles.dayLetter, { color: isToday ? theme.text : theme.textMuted }]}>{day}</Text>
              <View
                style={[
                  styles.dayDot,
                  {
                    backgroundColor: isToday
                      ? theme.accent
                      : isRest
                      ? theme.borderStrong
                      : theme.textMuted,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Hero Today's Workout Card */}
      <NativeCard style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: habits.workoutCompleted
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: habits.workoutCompleted ? theme.accent : theme.textMuted },
                ]}
              >
                {habits.workoutCompleted ? 'COMPLETED TODAY' : todayProgramDay.isRestDay ? 'ACTIVE RECOVERY' : 'TODAY’S SESSION'}
              </Text>
            </View>
            <Text style={[styles.dayTag, { color: theme.textMuted }]}>{todayDayName}</Text>
          </View>
          <Text style={[styles.workoutTitle, { color: theme.text }]}>{todayProgramDay.title}</Text>
          <Text style={[styles.workoutFocus, { color: theme.textSecondary }]}>{todayProgramDay.focus}</Text>
        </View>

        {/* Exercises Preview */}
        <View style={styles.exercisePreviewList}>
          {todayProgramDay.exercises.slice(0, 4).map((ex, i) => (
            <View key={ex.exerciseId || i} style={styles.exercisePreviewItem}>
              <View style={[styles.bullet, { backgroundColor: theme.accent }]} />
              <Text style={[styles.exercisePreviewName, { color: theme.text }]} numberOfLines={1}>
                {ex.name}
              </Text>
              <Text style={[styles.exercisePreviewSets, { color: theme.textMuted }]}>
                {ex.targetSets} sets × {ex.targetReps}
              </Text>
            </View>
          ))}
          {todayProgramDay.exercises.length > 4 && (
            <Text style={[styles.moreExercisesText, { color: theme.textMuted }]}>
              + {todayProgramDay.exercises.length - 4} more exercises in today’s routine
            </Text>
          )}
        </View>

        <NativeButton
          title={habits.workoutCompleted ? 'View / Edit Workout' : 'Start Workout'}
          onPress={startTodayWorkout}
          variant={habits.workoutCompleted ? 'secondary' : 'primary'}
          icon={<Ionicons name="barbell" size={18} color={habits.workoutCompleted ? theme.text : (colorScheme === 'dark' ? '#000' : '#FFF')} />}
          style={{ marginTop: 12 }}
        />
      </NativeCard>

      {/* Activity Rings & Daily Metrics Overview */}
      <NativeCard style={styles.ringsCard}>
        <View style={styles.ringsRow}>
          <ActivityRings
            size={120}
            workoutProgress={workoutProgress}
            walkProgress={walkProgress}
            nutritionProgress={nutritionProgress}
          />

          <View style={styles.ringsLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
              <View>
                <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Strength</Text>
                <Text style={[styles.legendValue, { color: theme.text }]}>
                  {habits.workoutCompleted ? '100% Done' : 'Scheduled'}
                </Text>
              </View>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#38BDF8' }]} />
              <View>
                <Text style={[styles.legendLabel, { color: theme.textMuted }]}>30m Walk</Text>
                <Text style={[styles.legendValue, { color: theme.text }]}>
                  {walkMinutes} / {profile.dailyWalkingTargetMinutes} min
                </Text>
              </View>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
              <View>
                <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Protein Goal</Text>
                <Text style={[styles.legendValue, { color: theme.text }]}>
                  {habits.proteinMet ? 'Target Met' : `${profile.dailyProteinTargetGrams}g Target`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </NativeCard>

      {/* Walking Tracker Quick Bar */}
      <NativeCard style={styles.quickCard}>
        <View style={styles.quickCardHeader}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="walk" size={22} color="#38BDF8" />
            <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Daily Walking</Text>
          </View>
          <Text style={[styles.walkPill, { color: theme.textSecondary }]}>
            {walkMinutes} of {profile.dailyWalkingTargetMinutes} min
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: theme.subtle }]}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min((walkMinutes / profile.dailyWalkingTargetMinutes) * 100, 100)}%`,
                backgroundColor: '#38BDF8',
              },
            ]}
          />
        </View>

        <View style={styles.quickWalkButtons}>
          <TouchableOpacity
            style={[styles.smallLogBtn, { backgroundColor: theme.subtle }]}
            onPress={() => quickAddWalk(10)}
          >
            <Text style={[styles.smallLogText, { color: theme.text }]}>+10 min</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallLogBtn, { backgroundColor: theme.subtle }]}
            onPress={() => quickAddWalk(15)}
          >
            <Text style={[styles.smallLogText, { color: theme.text }]}>+15 min</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallLogBtn, { backgroundColor: theme.subtle }]}
            onPress={() => quickAddWalk(30)}
          >
            <Text style={[styles.smallLogText, { color: theme.text }]}>+30 min (Done)</Text>
          </TouchableOpacity>
        </View>
      </NativeCard>

      {/* Weight Progression Card */}
      <NativeCard style={styles.quickCard}>
        <View style={styles.quickCardHeader}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="scale-outline" size={22} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Weight Target</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/progress')}>
            <Text style={[styles.linkText, { color: theme.accent }]}>View Trends</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weightNumbersRow}>
          <View>
            <Text style={[styles.weightLabel, { color: theme.textMuted }]}>Current</Text>
            <Text style={[styles.weightValue, { color: theme.text }]}>
              {profile.currentWeightKg.toFixed(1)} <Text style={styles.unitText}>kg</Text>
            </Text>
          </View>

          <View style={styles.targetDivider}>
            <Ionicons name="arrow-forward" size={18} color={theme.textMuted} />
          </View>

          <View>
            <Text style={[styles.weightLabel, { color: theme.textMuted }]}>Target</Text>
            <Text style={[styles.weightValue, { color: theme.accent }]}>
              {profile.targetWeightKg.toFixed(1)} <Text style={styles.unitText}>kg</Text>
            </Text>
          </View>

          <View style={styles.gainRemaining}>
            <Text style={[styles.gainBadge, { color: theme.textSecondary }]}>
              +{(profile.targetWeightKg - profile.currentWeightKg).toFixed(1)} kg lean mass
            </Text>
          </View>
        </View>
      </NativeCard>

      {/* Daily Habits Checklist */}
      <NativeCard style={styles.habitsCard}>
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Daily Habits</Text>

        {[
          { key: 'workoutCompleted', label: "Strength Workout Today", icon: 'barbell-outline' },
          { key: 'walkCompleted', label: '30-Minute Foundation Walk', icon: 'walk-outline' },
          { key: 'proteinMet', label: `Hit ${profile.dailyProteinTargetGrams}g Daily Protein`, icon: 'restaurant-outline' },
          { key: 'hydrated', label: `Drink ${profile.dailyWaterTargetLiters}L Water`, icon: 'water-outline' },
          { key: 'sleptWell', label: '7–8 Hours Restful Sleep', icon: 'moon-outline' },
          { key: 'supplementsTaken', label: 'Creatine & Daily Supplements', icon: 'medkit-outline' },
          { key: 'mobilityCompleted', label: 'Mobility & Posture Stretches', icon: 'body-outline' },
        ].map((item) => {
          const isDone = Boolean(habits[item.key as keyof DailyHabitLog]);
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.habitRow,
                { borderBottomColor: theme.cardBorder },
              ]}
              onPress={() => toggleHabitItem(item.key as keyof Omit<DailyHabitLog, 'date'>)}
            >
              <View style={styles.habitLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={19}
                  color={isDone ? theme.accent : theme.textMuted}
                />
                <Text
                  style={[
                    styles.habitLabel,
                    {
                      color: isDone ? theme.text : theme.textSecondary,
                      textDecorationLine: isDone ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </View>

              <Ionicons
                name={isDone ? 'checkbox' : 'square-outline'}
                size={22}
                color={isDone ? theme.accent : theme.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </NativeCard>

      {/* Educational Banner: Spot Reduction Myth */}
      <NativeCard variant="subtle" style={styles.mythCard}>
        <View style={styles.mythHeader}>
          <Ionicons name="information-circle" size={20} color="#F59E0B" />
          <Text style={[styles.mythTitle, { color: theme.text }]}>Physiology Principle</Text>
        </View>
        <Text style={[styles.mythBody, { color: theme.textSecondary }]}>
          Spot reduction (losing fat from a specific area like the face or lower belly) is biologically impossible. Fat loss occurs systemically when in a gentle deficit, while lean muscle definition is sculpted by progressive overload and structured hypertrophy. Focus on consistent strength progression and proper recovery.
        </Text>
      </NativeCard>

      {/* Quick Links to Library & 30-Day Foundation */}
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={[styles.featureButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => {
            haptics.light();
            router.push('/exercises');
          }}
        >
          <Ionicons name="book-outline" size={22} color={theme.text} />
          <Text style={[styles.featureBtnTitle, { color: theme.text }]}>Exercise Library</Text>
          <Text style={[styles.featureBtnSubtitle, { color: theme.textMuted }]}>40+ exercises & cues</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.featureButton, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => {
            haptics.light();
            router.push('/challenge');
          }}
        >
          <Ionicons name="trophy-outline" size={22} color="#F59E0B" />
          <Text style={[styles.featureBtnTitle, { color: theme.text }]}>30-Day Aesthetic</Text>
          <Text style={[styles.featureBtnSubtitle, { color: theme.textMuted }]}>Foundation challenge</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dayLetter: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroCard: {
    padding: 18,
    marginBottom: 12,
  },
  heroHeader: {
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dayTag: {
    fontSize: 13,
    fontWeight: '600',
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  workoutFocus: {
    fontSize: 14,
    lineHeight: 20,
  },
  exercisePreviewList: {
    marginVertical: 10,
  },
  exercisePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 8,
  },
  exercisePreviewName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  exercisePreviewSets: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  moreExercisesText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  ringsCard: {
    padding: 16,
    marginBottom: 12,
  },
  ringsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringsLegend: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  quickCard: {
    padding: 16,
    marginBottom: 12,
  },
  quickCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  walkPill: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  quickWalkButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallLogBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  smallLogText: {
    fontSize: 12,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weightNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  weightLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  weightValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  targetDivider: {
    paddingHorizontal: 8,
  },
  gainRemaining: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gainBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  habitsCard: {
    padding: 16,
    marginBottom: 12,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
  mythCard: {
    padding: 14,
    marginBottom: 12,
  },
  mythHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mythTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  mythBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureButton: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  featureBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  featureBtnSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
