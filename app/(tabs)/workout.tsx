import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { database } from '@/services/database';
import { haptics } from '@/services/haptics';
import { NativeCard } from '@/components/NativeCard';
import { NativeButton } from '@/components/NativeButton';
import { RestTimerModal } from '@/components/RestTimerModal';
import {
  ActiveWorkoutSession,
  ActiveExercise,
  ActiveSet,
  WorkoutProgramDay,
  WorkoutHistoryItem,
} from '@/types';

export default function WorkoutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [activeSession, setActiveSession] = useState<ActiveWorkoutSession | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [program, setProgram] = useState<WorkoutProgramDay[]>(database.getProgram());
  const [showRestTimer, setShowRestTimer] = useState<boolean>(false);
  const [restSeconds, setRestSeconds] = useState<number>(90);
  const [notesModalExerciseId, setNotesModalExerciseId] = useState<string | null>(null);

  // Timer interval reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initOrLoadSession = useCallback(() => {
    const existing = database.getActiveSession();
    if (existing) {
      setActiveSession(existing);
    } else {
      const p = database.getProgram();
      setProgram(p);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDayName = dayNames[new Date().getDay()];
      const dayIdx = p.findIndex((d) => d.dayOfWeek === todayDayName);
      setSelectedDayIndex(dayIdx >= 0 ? dayIdx : 0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      initOrLoadSession();
    }, [initOrLoadSession])
  );

  // Tick timer every second when session is active and not paused
  useEffect(() => {
    if (activeSession && !activeSession.isPaused && activeSession.status === 'active') {
      timerRef.current = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev) return null;
          const updated = { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
          return updated;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession?.isPaused, activeSession?.status]);

  // Persist session state periodically
  useEffect(() => {
    if (activeSession) {
      database.saveActiveSession(activeSession);
    }
  }, [activeSession]);

  const startSession = (day: WorkoutProgramDay) => {
    haptics.medium();

    const allExercises = database.getExercises();
    const history = database.getWorkoutHistory();

    const activeExercises: ActiveExercise[] = day.exercises.map((progEx) => {
      // Find previous weight used from history for this exercise if available
      let prevWeight = 10;
      let prevReps = 10;
      for (const h of history) {
        const found = h.exercises.find((e) => e.exerciseId === progEx.exerciseId);
        if (found && found.sets.length > 0) {
          prevWeight = found.sets[0].weightKg;
          prevReps = found.sets[0].reps;
          break;
        }
      }

      const sets: ActiveSet[] = Array.from({ length: progEx.targetSets }).map((_, idx) => ({
        setNumber: idx + 1,
        weightKg: prevWeight,
        reps: prevReps,
        rir: 2,
        completed: false,
      }));

      return {
        exerciseId: progEx.exerciseId,
        name: progEx.name,
        targetSets: progEx.targetSets,
        targetReps: progEx.targetReps,
        sets,
        notes: progEx.notes || '',
        skipped: false,
      };
    });

    const newSession: ActiveWorkoutSession = {
      id: `session-${Date.now()}`,
      dayId: day.id,
      title: day.title,
      startTime: Date.now(),
      elapsedSeconds: 0,
      isPaused: false,
      status: 'active',
      exercises: activeExercises,
    };

    setActiveSession(newSession);
    database.saveActiveSession(newSession);
  };

  const togglePause = () => {
    if (!activeSession) return;
    haptics.light();
    setActiveSession({
      ...activeSession,
      isPaused: !activeSession.isPaused,
    });
  };

  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    if (!activeSession) return;
    haptics.medium();

    const updatedExercises = [...activeSession.exercises];
    const targetSet = updatedExercises[exIdx].sets[setIdx];
    const willComplete = !targetSet.completed;

    targetSet.completed = willComplete;

    setActiveSession({
      ...activeSession,
      exercises: updatedExercises,
    });

    if (willComplete) {
      setShowRestTimer(true);
    }
  };

  const updateSetWeight = (exIdx: number, setIdx: number, delta: number) => {
    if (!activeSession) return;
    haptics.selection();
    const updatedExercises = [...activeSession.exercises];
    const current = updatedExercises[exIdx].sets[setIdx].weightKg;
    updatedExercises[exIdx].sets[setIdx].weightKg = Math.max(0, current + delta);
    setActiveSession({ ...activeSession, exercises: updatedExercises });
  };

  const updateSetReps = (exIdx: number, setIdx: number, delta: number) => {
    if (!activeSession) return;
    haptics.selection();
    const updatedExercises = [...activeSession.exercises];
    const current = updatedExercises[exIdx].sets[setIdx].reps;
    updatedExercises[exIdx].sets[setIdx].reps = Math.max(1, current + delta);
    setActiveSession({ ...activeSession, exercises: updatedExercises });
  };

  const cycleRIR = (exIdx: number, setIdx: number) => {
    if (!activeSession) return;
    haptics.selection();
    const updatedExercises = [...activeSession.exercises];
    const current = updatedExercises[exIdx].sets[setIdx].rir;
    // Cycle between 0, 1, 2, 3
    updatedExercises[exIdx].sets[setIdx].rir = (current + 1) % 4;
    setActiveSession({ ...activeSession, exercises: updatedExercises });
  };

  const addSet = (exIdx: number) => {
    if (!activeSession) return;
    haptics.light();
    const updatedExercises = [...activeSession.exercises];
    const sets = updatedExercises[exIdx].sets;
    const lastSet = sets[sets.length - 1] || { weightKg: 10, reps: 10, rir: 2 };
    sets.push({
      setNumber: sets.length + 1,
      weightKg: lastSet.weightKg,
      reps: lastSet.reps,
      rir: lastSet.rir,
      completed: false,
    });
    setActiveSession({ ...activeSession, exercises: updatedExercises });
  };

  const removeSet = (exIdx: number) => {
    if (!activeSession) return;
    haptics.light();
    const updatedExercises = [...activeSession.exercises];
    if (updatedExercises[exIdx].sets.length > 1) {
      updatedExercises[exIdx].sets.pop();
      setActiveSession({ ...activeSession, exercises: updatedExercises });
    }
  };

  const toggleSkipExercise = (exIdx: number) => {
    if (!activeSession) return;
    haptics.warning();
    const updatedExercises = [...activeSession.exercises];
    updatedExercises[exIdx].skipped = !updatedExercises[exIdx].skipped;
    setActiveSession({ ...activeSession, exercises: updatedExercises });
  };

  const finishSession = () => {
    if (!activeSession) return;
    haptics.success();

    const todayStr = new Date().toISOString().split('T')[0];
    let totalVolumeKg = 0;
    let completedSetsCount = 0;

    const historyExercises = activeSession.exercises
      .filter((ex) => !ex.skipped)
      .map((ex) => {
        let exVol = 0;
        let exReps = 0;
        let topWeight = 0;

        const setsData = ex.sets.map((s) => {
          if (s.completed) {
            completedSetsCount++;
            exVol += s.weightKg * s.reps;
            exReps += s.reps;
            if (s.weightKg > topWeight) topWeight = s.weightKg;
          }
          return {
            weightKg: s.weightKg,
            reps: s.reps,
            rir: s.rir,
            completed: s.completed,
          };
        });

        totalVolumeKg += exVol;

        return {
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: setsData,
          topWeightKg: topWeight,
          totalVolumeKg: exVol,
          totalReps: exReps,
        };
      });

    const durationMinutes = Math.max(1, Math.round(activeSession.elapsedSeconds / 60));

    const historyItem: WorkoutHistoryItem = {
      id: `hist-${Date.now()}`,
      date: todayStr,
      dayTitle: activeSession.title,
      durationMinutes,
      totalVolumeKg,
      setsCompleted: completedSetsCount,
      exercises: historyExercises,
    };

    database.saveWorkoutHistory(historyItem);
    database.clearActiveSession();

    // Mark today's workout habit as completed
    const habits = database.getDailyHabits(todayStr);
    if (!habits.workoutCompleted) {
      database.toggleHabit(todayStr, 'workoutCompleted');
    }

    setActiveSession(null);

    Alert.alert(
      'Workout Saved!',
      `Great job! You lifted ${totalVolumeKg.toLocaleString()} kg total volume over ${durationMinutes} minutes.`,
      [
        {
          text: 'View History',
          onPress: () => router.push('/history'),
        },
        {
          text: 'Done',
          style: 'default',
        },
      ]
    );
  };

  const cancelWorkout = () => {
    Alert.alert('Discard Workout?', 'Are you sure you want to discard this session without saving?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          haptics.warning();
          database.clearActiveSession();
          setActiveSession(null);
        },
      },
    ]);
  };

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // If no workout is currently active, show Programme Selector to Start
  if (!activeSession) {
    const selectedDay = program[selectedDayIndex] || program[0];

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.base }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>WORKOUT PROGRAMME</Text>
          <Text style={[styles.title, { color: theme.text }]}>Gym Mode</Text>
        </View>

        {/* Day Selector Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {program.map((p, idx) => {
            const isSelected = idx === selectedDayIndex;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: isSelected ? theme.text : theme.card,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  haptics.selection();
                  setSelectedDayIndex(idx);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? (colorScheme === 'dark' ? '#000' : '#FFF') : theme.text,
                    },
                  ]}
                >
                  {p.dayOfWeek}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Routine Overview */}
        <NativeCard style={styles.programCard}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: selectedDay.isRestDay
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: selectedDay.isRestDay ? '#38BDF8' : theme.accent },
                ]}
              >
                {selectedDay.isRestDay ? 'RECOVERY DAY' : `${selectedDay.exercises.length} EXERCISES`}
              </Text>
            </View>
            <Text style={[styles.focusTag, { color: theme.textMuted }]}>{selectedDay.focus}</Text>
          </View>

          <Text style={[styles.routineTitle, { color: theme.text }]}>{selectedDay.title}</Text>

          {selectedDay.isRestDay ? (
            <View style={styles.recoveryBox}>
              <Text style={[styles.recoveryIntro, { color: theme.textSecondary }]}>
                Rest days build muscle. Complete your active recovery protocols:
              </Text>
              {selectedDay.recoveryActivities?.map((act, i) => (
                <View key={i} style={styles.recoveryItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#38BDF8" />
                  <Text style={[styles.recoveryText, { color: theme.text }]}>{act}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.exercisesTable}>
              {selectedDay.exercises.map((item, idx) => (
                <View
                  key={item.exerciseId || idx}
                  style={[styles.routineExerciseRow, { borderBottomColor: theme.cardBorder }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.exName, { color: theme.text }]}>{item.name}</Text>
                    {item.notes ? (
                      <Text style={[styles.exNotes, { color: theme.textMuted }]}>{item.notes}</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.exSetsReps, { color: theme.textSecondary }]}>
                    {item.targetSets} × {item.targetReps}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {!selectedDay.isRestDay && (
            <NativeButton
              title="Launch This Workout"
              onPress={() => startSession(selectedDay)}
              icon={<Ionicons name="play" size={18} color={colorScheme === 'dark' ? '#000' : '#FFF'} />}
              style={{ marginTop: 16 }}
            />
          )}
        </NativeCard>
      </ScrollView>
    );
  }

  // ACTIVE LIVE WORKOUT TRACKING INTERFACE
  return (
    <View style={[styles.container, { backgroundColor: theme.base }]}>
      {/* Sticky Active Session Header */}
      <View style={[styles.activeHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.activeHeaderLeft}>
          <Text style={[styles.activeTitle, { color: theme.text }]} numberOfLines={1}>
            {activeSession.title}
          </Text>
          <View style={styles.timerLiveRow}>
            <View
              style={[
                styles.livePulse,
                { backgroundColor: activeSession.isPaused ? theme.warning : theme.accent },
              ]}
            />
            <Text style={[styles.timerLiveText, { color: theme.text }]}>
              {formatElapsed(activeSession.elapsedSeconds)} {activeSession.isPaused ? '(Paused)' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.activeHeaderRight}>
          <TouchableOpacity
            style={[styles.headerControlBtn, { backgroundColor: theme.subtle }]}
            onPress={() => setShowRestTimer(true)}
          >
            <Ionicons name="timer-outline" size={20} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerControlBtn, { backgroundColor: theme.subtle, marginLeft: 8 }]}
            onPress={togglePause}
          >
            <Ionicons name={activeSession.isPaused ? 'play' : 'pause'} size={20} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.finishBtn, { backgroundColor: theme.accent, marginLeft: 8 }]}
            onPress={finishSession}
          >
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Exercises List */}
      <ScrollView
        style={styles.activeScroll}
        contentContainerStyle={styles.activeScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeSession.exercises.map((ex, exIdx) => {
          if (ex.skipped) {
            return (
              <NativeCard key={ex.exerciseId} variant="subtle" style={styles.skippedCard}>
                <View style={styles.skippedRow}>
                  <Text style={[styles.skippedTitle, { color: theme.textMuted }]}>{ex.name} (Skipped)</Text>
                  <TouchableOpacity onPress={() => toggleSkipExercise(exIdx)}>
                    <Text style={[styles.undoText, { color: theme.accent }]}>Undo</Text>
                  </TouchableOpacity>
                </View>
              </NativeCard>
            );
          }

          return (
            <NativeCard key={ex.exerciseId} style={styles.exerciseCard}>
              {/* Exercise Header */}
              <View style={styles.exerciseCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardExName, { color: theme.text }]}>{ex.name}</Text>
                  <Text style={[styles.cardTarget, { color: theme.textMuted }]}>
                    Target: {ex.targetSets} sets × {ex.targetReps} reps
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.skipBtn, { backgroundColor: theme.subtle }]}
                  onPress={() => toggleSkipExercise(exIdx)}
                >
                  <Text style={[styles.skipBtnText, { color: theme.textMuted }]}>Skip</Text>
                </TouchableOpacity>
              </View>

              {/* Set Column Headers */}
              <View style={styles.setColHeaders}>
                <Text style={[styles.colHeader, { width: 36, color: theme.textMuted }]}>SET</Text>
                <Text style={[styles.colHeader, { flex: 1, color: theme.textMuted }]}>KG</Text>
                <Text style={[styles.colHeader, { flex: 1, color: theme.textMuted }]}>REPS</Text>
                <Text style={[styles.colHeader, { width: 44, color: theme.textMuted, textAlign: 'center' }]}>RIR</Text>
                <Text style={[styles.colHeader, { width: 44, color: theme.textMuted, textAlign: 'center' }]}>DONE</Text>
              </View>

              {/* Sets Rows */}
              {ex.sets.map((set, setIdx) => (
                <View
                  key={set.setNumber}
                  style={[
                    styles.setRow,
                    set.completed && { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 10 },
                  ]}
                >
                  {/* Set Number */}
                  <View style={styles.setNumberCol}>
                    <Text style={[styles.setNumText, { color: theme.textSecondary }]}>{set.setNumber}</Text>
                  </View>

                  {/* Weight Stepper */}
                  <View style={styles.stepperCol}>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: theme.subtle }]}
                      onPress={() => updateSetWeight(exIdx, setIdx, -2.5)}
                    >
                      <Ionicons name="remove" size={14} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.stepperValue, { color: theme.text }]}>{set.weightKg}</Text>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: theme.subtle }]}
                      onPress={() => updateSetWeight(exIdx, setIdx, 2.5)}
                    >
                      <Ionicons name="add" size={14} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Reps Stepper */}
                  <View style={styles.stepperCol}>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: theme.subtle }]}
                      onPress={() => updateSetReps(exIdx, setIdx, -1)}
                    >
                      <Ionicons name="remove" size={14} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.stepperValue, { color: theme.text }]}>{set.reps}</Text>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: theme.subtle }]}
                      onPress={() => updateSetReps(exIdx, setIdx, 1)}
                    >
                      <Ionicons name="add" size={14} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  {/* RIR (Reps In Reserve) */}
                  <TouchableOpacity
                    style={[styles.rirCol, { backgroundColor: theme.subtle }]}
                    onPress={() => cycleRIR(exIdx, setIdx)}
                  >
                    <Text style={[styles.rirText, { color: theme.text }]}>{set.rir}</Text>
                  </TouchableOpacity>

                  {/* Completion Checkbox */}
                  <TouchableOpacity
                    style={styles.doneCol}
                    onPress={() => toggleSetComplete(exIdx, setIdx)}
                  >
                    <Ionicons
                      name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={28}
                      color={set.completed ? theme.accent : theme.borderStrong}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add / Remove Set Row */}
              <View style={styles.setActionsRow}>
                <TouchableOpacity style={styles.setActionBtn} onPress={() => addSet(exIdx)}>
                  <Ionicons name="add" size={16} color={theme.accent} />
                  <Text style={[styles.setActionText, { color: theme.accent }]}>Add Set</Text>
                </TouchableOpacity>

                {ex.sets.length > 1 && (
                  <TouchableOpacity style={[styles.setActionBtn, { marginLeft: 16 }]} onPress={() => removeSet(exIdx)}>
                    <Ionicons name="trash-outline" size={15} color={theme.danger} />
                    <Text style={[styles.setActionText, { color: theme.danger }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </NativeCard>
          );
        })}

        {/* Discard Workout Button */}
        <TouchableOpacity style={styles.discardBtn} onPress={cancelWorkout}>
          <Text style={[styles.discardBtnText, { color: theme.danger }]}>Discard Workout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Rest Timer Modal */}
      <RestTimerModal
        visible={showRestTimer}
        initialSeconds={restSeconds}
        onClose={() => setShowRestTimer(false)}
      />
    </View>
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
  header: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  programCard: {
    padding: 18,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  focusTag: {
    fontSize: 12,
    fontWeight: '600',
  },
  routineTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  recoveryBox: {
    paddingVertical: 8,
  },
  recoveryIntro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  recoveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  recoveryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  exercisesTable: {
    marginTop: 4,
  },
  routineExerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  exName: {
    fontSize: 15,
    fontWeight: '600',
  },
  exNotes: {
    fontSize: 12,
    marginTop: 2,
  },
  exSetsReps: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  activeHeaderLeft: {
    flex: 1,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  timerLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  timerLiveText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  activeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  activeScroll: {
    flex: 1,
  },
  activeScrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  exerciseCard: {
    padding: 16,
    marginBottom: 14,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardExName: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardTarget: {
    fontSize: 12,
    marginTop: 2,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skipBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  setColHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  setNumberCol: {
    width: 36,
  },
  setNumText: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  stepperCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '700',
    width: 34,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  rirCol: {
    width: 36,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  rirText: {
    fontSize: 13,
    fontWeight: '700',
  },
  doneCol: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
  },
  setActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setActionText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  skippedCard: {
    padding: 14,
    marginBottom: 10,
  },
  skippedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skippedTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  undoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  discardBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  discardBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
