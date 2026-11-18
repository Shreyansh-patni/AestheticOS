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
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { database } from '@/services/database';
import { haptics } from '@/services/haptics';
import { NativeCard } from '@/components/NativeCard';
import { NativeButton } from '@/components/NativeButton';
import { CardioWalkLog, CardioRunLog, UserProfile } from '@/types';

export default function CardioScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [profile, setProfile] = useState<UserProfile>(database.getProfile());
  const [walkLogs, setWalkLogs] = useState<CardioWalkLog[]>(database.getWalkLogs());
  const [runLogs, setRunLogs] = useState<CardioRunLog[]>(database.getRunLogs());

  // Walk Live Stopwatch state
  const [isWalking, setIsWalking] = useState(false);
  const [walkElapsedSeconds, setWalkElapsedSeconds] = useState(0);
  const walkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual Run Log inputs
  const [runDistance, setRunDistance] = useState('3.0');
  const [runMinutes, setRunMinutes] = useState('20');
  const [runType, setRunType] = useState<'easy' | 'interval' | 'tempo'>('easy');
  const [runNotes, setRunNotes] = useState('');
  const [showRunForm, setShowRunForm] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadCardioData = useCallback(() => {
    setProfile(database.getProfile());
    setWalkLogs(database.getWalkLogs());
    setRunLogs(database.getRunLogs());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCardioData();
    }, [loadCardioData])
  );

  // Walk stopwatch effect
  useEffect(() => {
    if (isWalking) {
      walkTimerRef.current = setInterval(() => {
        setWalkElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (walkTimerRef.current) clearInterval(walkTimerRef.current);
    }
    return () => {
      if (walkTimerRef.current) clearInterval(walkTimerRef.current);
    };
  }, [isWalking]);

  const toggleWalkTimer = () => {
    haptics.medium();
    setIsWalking((prev) => !prev);
  };

  const finishWalk = () => {
    haptics.success();
    setIsWalking(false);

    const durationMinutes = Math.max(1, Math.round(walkElapsedSeconds / 60));
    // Estimate ~4.8 km/h walking pace (approx 0.08 km per minute)
    const distanceKm = Number((durationMinutes * 0.08).toFixed(2));

    const newLog: CardioWalkLog = {
      id: `walk-${Date.now()}`,
      date: todayStr,
      durationMinutes,
      distanceKm,
      notes: 'Live timed walk',
      completed: durationMinutes >= profile.dailyWalkingTargetMinutes,
    };

    database.saveWalkLog(newLog);
    database.toggleHabit(todayStr, 'walkCompleted');

    setWalkElapsedSeconds(0);
    loadCardioData();

    Alert.alert(
      'Walk Saved!',
      `Logged ${durationMinutes} minutes (${distanceKm} km). Excellent habit consistency!`
    );
  };

  const resetWalkTimer = () => {
    haptics.light();
    setIsWalking(false);
    setWalkElapsedSeconds(0);
  };

  const saveRunLog = () => {
    const dist = parseFloat(runDistance);
    const mins = parseFloat(runMinutes);

    if (isNaN(dist) || dist <= 0 || isNaN(mins) || mins <= 0) {
      Alert.alert('Invalid Entry', 'Please enter valid distance and duration.');
      return;
    }

    haptics.success();
    const pace = Number((mins / dist).toFixed(2));

    const newRun: CardioRunLog = {
      id: `run-${Date.now()}`,
      date: todayStr,
      distanceKm: dist,
      durationMinutes: mins,
      paceMinutesPerKm: pace,
      type: runType,
      notes: runNotes,
    };

    database.saveRunLog(newRun);
    database.toggleHabit(todayStr, 'runCompleted');

    setRunNotes('');
    setShowRunForm(false);
    loadCardioData();

    Alert.alert('Run Saved!', `Logged ${dist} km at ${pace} min/km pace.`);
  };

  const todayWalks = walkLogs.filter((w) => w.date === todayStr);
  const todayWalkMinutes = todayWalks.reduce((acc, w) => acc + w.durationMinutes, 0);

  const formatStopwatch = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.base }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>AEROBIC & RECOVERY</Text>
        <Text style={[styles.title, { color: theme.text }]}>Cardio Tracker</Text>
      </View>

      {/* Walking Section Card */}
      <NativeCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="walk" size={24} color="#38BDF8" />
            <Text style={[styles.cardTitle, { color: theme.text, marginLeft: 8 }]}>Daily 30-Min Walk</Text>
          </View>
          <View
            style={[
              styles.targetBadge,
              {
                backgroundColor:
                  todayWalkMinutes >= profile.dailyWalkingTargetMinutes
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(56, 189, 248, 0.15)',
              },
            ]}
          >
            <Text
              style={[
                styles.targetBadgeText,
                {
                  color:
                    todayWalkMinutes >= profile.dailyWalkingTargetMinutes
                      ? theme.accent
                      : '#38BDF8',
                },
              ]}
            >
              {todayWalkMinutes >= profile.dailyWalkingTargetMinutes ? 'GOAL MET' : `${todayWalkMinutes}/30 MIN`}
            </Text>
          </View>
        </View>

        <Text style={[styles.bodyDescription, { color: theme.textSecondary }]}>
          Daily low-intensity walking enhances active muscle recovery, improves insulin sensitivity, and promotes overall leanness without depleting energy needed for hypertrophy.
        </Text>

        {/* Live Stopwatch UI */}
        <View style={[styles.stopwatchBox, { backgroundColor: theme.subtle, borderColor: theme.border }]}>
          <Text style={[styles.stopwatchText, { color: theme.text }]}>
            {formatStopwatch(walkElapsedSeconds)}
          </Text>
          <Text style={[styles.stopwatchLabel, { color: theme.textMuted }]}>
            {isWalking ? 'Walking now...' : walkElapsedSeconds > 0 ? 'Paused' : 'Ready to start'}
          </Text>

          <View style={styles.stopwatchControls}>
            {walkElapsedSeconds > 0 && !isWalking && (
              <TouchableOpacity
                style={[styles.smallCtrlBtn, { backgroundColor: theme.cardBorder }]}
                onPress={resetWalkTimer}
              >
                <Ionicons name="refresh" size={18} color={theme.text} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.mainWalkBtn,
                { backgroundColor: isWalking ? theme.warning : '#38BDF8' },
              ]}
              onPress={toggleWalkTimer}
            >
              <Ionicons name={isWalking ? 'pause' : 'play'} size={20} color="#FFFFFF" />
              <Text style={styles.mainWalkBtnText}>{isWalking ? 'Pause Walk' : 'Start Walk'}</Text>
            </TouchableOpacity>

            {walkElapsedSeconds >= 60 && (
              <TouchableOpacity
                style={[styles.finishWalkBtn, { backgroundColor: theme.accent }]}
                onPress={finishWalk}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.mainWalkBtnText}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </NativeCard>

      {/* Running Section Card */}
      <NativeCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="footsteps" size={24} color="#F59E0B" />
            <Text style={[styles.cardTitle, { color: theme.text, marginLeft: 8 }]}>Beginner Running</Text>
          </View>
          <Text style={[styles.targetBadgeText, { color: theme.textMuted }]}>
            {profile.weeklyRunningSessionsTarget} Sessions / Wk
          </Text>
        </View>

        <Text style={[styles.bodyDescription, { color: theme.textSecondary }]}>
          Gradually introduce 2–3 easy aerobic base sessions per week. Maintain a conversational pace (Zone 2) to build cardiovascular capacity without compromising strength gains.
        </Text>

        {!showRunForm ? (
          <NativeButton
            title="+ Log Completed Run"
            onPress={() => setShowRunForm(true)}
            variant="secondary"
            style={{ marginTop: 8 }}
          />
        ) : (
          <View style={[styles.formContainer, { backgroundColor: theme.subtle, borderColor: theme.border }]}>
            <Text style={[styles.formHeader, { color: theme.text }]}>Log Run Session</Text>

            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Distance (km)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  keyboardType="decimal-pad"
                  value={runDistance}
                  onChangeText={setRunDistance}
                  placeholder="3.0"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Duration (min)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  keyboardType="numeric"
                  value={runMinutes}
                  onChangeText={setRunMinutes}
                  placeholder="20"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* Run Type Selector */}
            <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: 8 }]}>Run Type</Text>
            <View style={styles.typeSelectorRow}>
              {(['easy', 'interval', 'tempo'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: runType === t ? theme.text : theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => {
                    haptics.selection();
                    setRunType(t);
                  }}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: runType === t ? (colorScheme === 'dark' ? '#000' : '#FFF') : theme.text },
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: 8 }]}>Notes</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              value={runNotes}
              onChangeText={setRunNotes}
              placeholder="Felt easy, kept heart rate under control"
              placeholderTextColor={theme.textMuted}
            />

            <View style={styles.formBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRunForm(false)}>
                <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <NativeButton title="Save Run" onPress={saveRunLog} size="sm" variant="primary" />
            </View>
          </View>
        )}
      </NativeCard>

      {/* Recent Running History */}
      {runLogs.length > 0 && (
        <NativeCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 10 }]}>Recent Runs</Text>
          {runLogs.slice(0, 5).map((run) => (
            <View key={run.id} style={[styles.historyRow, { borderBottomColor: theme.cardBorder }]}>
              <View>
                <Text style={[styles.historyDate, { color: theme.text }]}>
                  {run.date} • {run.type.toUpperCase()}
                </Text>
                <Text style={[styles.historyDetail, { color: theme.textMuted }]}>
                  {run.distanceKm} km in {run.durationMinutes} min ({run.paceMinutesPerKm} min/km)
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
            </View>
          ))}
        </NativeCard>
      )}
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
  card: {
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bodyDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  stopwatchBox: {
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  stopwatchText: {
    fontSize: 44,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  stopwatchLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 14,
  },
  stopwatchControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallCtrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  mainWalkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  finishWalkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 10,
  },
  mainWalkBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
  formContainer: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  formHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 14,
  },
  cancelBtn: {
    marginRight: 14,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyDetail: {
    fontSize: 12,
    marginTop: 2,
  },
});
