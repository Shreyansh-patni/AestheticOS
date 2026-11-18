import React, { useState, useCallback } from 'react';
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
import { BodyMeasurement, UserProfile } from '@/types';

export default function ProgressScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [profile, setProfile] = useState<UserProfile>(database.getProfile());
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(database.getMeasurements());
  const [showAddForm, setShowAddForm] = useState(false);

  // New Measurement form state
  const [inputWeight, setInputWeight] = useState('');
  const [inputWaist, setInputWaist] = useState('');
  const [inputChest, setInputChest] = useState('');
  const [inputArms, setInputArms] = useState('');
  const [inputShoulders, setInputShoulders] = useState('');
  const [inputNotes, setInputNotes] = useState('');

  const loadData = useCallback(() => {
    setProfile(database.getProfile());
    setMeasurements(database.getMeasurements());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const latest = measurements[0] || {
    weightKg: profile.currentWeightKg,
    heightCm: profile.heightCm,
    waistCm: 72,
    chestCm: 90,
    armsCm: 29,
    shouldersCm: 108,
  };

  const oldest = measurements[measurements.length - 1] || latest;

  // Aesthetic V-Taper Ratio: Shoulders / Waist
  const vTaperRatio = latest.shouldersCm && latest.waistCm
    ? (latest.shouldersCm / latest.waistCm).toFixed(2)
    : '1.50';

  const weightProgressPercent = Math.min(
    Math.max(
      ((latest.weightKg - oldest.weightKg) / (profile.targetWeightKg - oldest.weightKg)) * 100,
      10
    ),
    100
  );

  const saveNewMeasurement = () => {
    const w = parseFloat(inputWeight);
    if (isNaN(w) || w <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
      return;
    }

    haptics.success();

    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry: BodyMeasurement = {
      id: `m-${Date.now()}`,
      date: todayStr,
      weightKg: w,
      heightCm: profile.heightCm,
      waistCm: parseFloat(inputWaist) || undefined,
      chestCm: parseFloat(inputChest) || undefined,
      armsCm: parseFloat(inputArms) || undefined,
      shouldersCm: parseFloat(inputShoulders) || undefined,
      notes: inputNotes,
    };

    database.saveMeasurement(newEntry);

    // Also update current profile weight
    const updatedProfile = { ...profile, currentWeightKg: w };
    database.updateProfile(updatedProfile);
    setProfile(updatedProfile);

    setInputWeight('');
    setInputWaist('');
    setInputChest('');
    setInputArms('');
    setInputShoulders('');
    setInputNotes('');
    setShowAddForm(false);
    loadData();

    Alert.alert('Saved!', 'New body measurement recorded.');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.base }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>BODY COMPOSITION & PROPORTIONS</Text>
        <Text style={[styles.title, { color: theme.text }]}>Progress</Text>
      </View>

      {/* Main Target Progression Card */}
      <NativeCard style={styles.card}>
        <View style={styles.targetHeader}>
          <View>
            <Text style={[styles.targetLabel, { color: theme.textMuted }]}>Aesthetic Target</Text>
            <Text style={[styles.targetNumbers, { color: theme.text }]}>
              {latest.weightKg.toFixed(1)} kg <Text style={{ color: theme.textMuted, fontSize: 18 }}>→</Text>{' '}
              {profile.targetWeightKg.toFixed(1)} kg
            </Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Text style={[styles.pillBadgeText, { color: theme.accent }]}>+10 KG LEAN MASS</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBarTrack, { backgroundColor: theme.subtle }]}>
          <View style={[styles.progressBarFill, { width: `${weightProgressPercent}%`, backgroundColor: theme.accent }]} />
        </View>

        <View style={styles.progressSubRow}>
          <Text style={[styles.subText, { color: theme.textMuted }]}>
            Current: {latest.weightKg} kg (Height: {profile.heightCm} cm)
          </Text>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>
            {(profile.targetWeightKg - latest.weightKg).toFixed(1)} kg to goal
          </Text>
        </View>
      </NativeCard>

      {/* V-Taper Ratio & Golden Proportions */}
      <NativeCard style={styles.card}>
        <View style={styles.vTaperHeader}>
          <View style={styles.iconTitleRow}>
            <Ionicons name="sparkles" size={20} color="#F59E0B" />
            <Text style={[styles.cardTitle, { color: theme.text, marginLeft: 8 }]}>V-Taper Ratio</Text>
          </View>
          <Text style={[styles.vTaperScore, { color: theme.text }]}>{vTaperRatio} : 1.0</Text>
        </View>

        <Text style={[styles.bodyDescription, { color: theme.textSecondary }]}>
          Calculated as Shoulder Circumference ÷ Waist Circumference. Classical aesthetic symmetry peaks around 1.618 (The Golden Ratio). Focus on lateral deltoids, upper chest, and lats while keeping the waist tight.
        </Text>

        <View style={styles.metricGrid}>
          <View style={[styles.metricTile, { backgroundColor: theme.subtle }]}>
            <Text style={[styles.tileLabel, { color: theme.textMuted }]}>Shoulders</Text>
            <Text style={[styles.tileValue, { color: theme.text }]}>{latest.shouldersCm || '--'} cm</Text>
          </View>
          <View style={[styles.metricTile, { backgroundColor: theme.subtle }]}>
            <Text style={[styles.tileLabel, { color: theme.textMuted }]}>Waist</Text>
            <Text style={[styles.tileValue, { color: theme.text }]}>{latest.waistCm || '--'} cm</Text>
          </View>
          <View style={[styles.metricTile, { backgroundColor: theme.subtle }]}>
            <Text style={[styles.tileLabel, { color: theme.textMuted }]}>Chest</Text>
            <Text style={[styles.tileValue, { color: theme.text }]}>{latest.chestCm || '--'} cm</Text>
          </View>
          <View style={[styles.metricTile, { backgroundColor: theme.subtle }]}>
            <Text style={[styles.tileLabel, { color: theme.textMuted }]}>Arms</Text>
            <Text style={[styles.tileValue, { color: theme.text }]}>{latest.armsCm || '--'} cm</Text>
          </View>
        </View>
      </NativeCard>

      {/* Recovery Guidance & Volume Fatigue Warning */}
      <NativeCard variant="subtle" style={styles.card}>
        <View style={styles.iconTitleRow}>
          <Ionicons name="shield-checkmark" size={20} color="#38BDF8" />
          <Text style={[styles.cardTitle, { color: theme.text, marginLeft: 8 }]}>Recovery & Progression Rule</Text>
        </View>
        <Text style={[styles.bodyDescription, { color: theme.textSecondary, marginTop: 6 }]}>
          As a returning beginner, central nervous system fatigue and joint adaptation precede muscular hypertrophy. Never train to complete muscular failure on every single set. Maintain 1–2 Reps In Reserve (RIR). If you experience persistent soreness, take an extra rest day without guilt.
        </Text>
      </NativeCard>

      {/* Log New Measurement Card */}
      <NativeCard style={styles.card}>
        <View style={styles.targetHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Log Measurements</Text>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: theme.text }]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons name={showAddForm ? 'close' : 'add'} size={16} color={colorScheme === 'dark' ? '#000' : '#FFF'} />
            <Text style={[styles.smallBtnText, { color: colorScheme === 'dark' ? '#000' : '#FFF' }]}>
              {showAddForm ? 'Cancel' : 'New Entry'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View style={styles.formContainer}>
            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Weight (kg) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
                  keyboardType="decimal-pad"
                  placeholder="55.5"
                  placeholderTextColor={theme.textMuted}
                  value={inputWeight}
                  onChangeText={setInputWeight}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Waist (cm)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
                  keyboardType="decimal-pad"
                  placeholder="72"
                  placeholderTextColor={theme.textMuted}
                  value={inputWaist}
                  onChangeText={setInputWaist}
                />
              </View>
            </View>

            <View style={[styles.formRow, { marginTop: 10 }]}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Chest (cm)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
                  keyboardType="decimal-pad"
                  placeholder="91"
                  placeholderTextColor={theme.textMuted}
                  value={inputChest}
                  onChangeText={setInputChest}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Shoulders (cm)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
                  keyboardType="decimal-pad"
                  placeholder="109"
                  placeholderTextColor={theme.textMuted}
                  value={inputShoulders}
                  onChangeText={setInputShoulders}
                />
              </View>
            </View>

            <View style={[styles.formRow, { marginTop: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Arms (cm)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
                  keyboardType="decimal-pad"
                  placeholder="29.5"
                  placeholderTextColor={theme.textMuted}
                  value={inputArms}
                  onChangeText={setInputArms}
                />
              </View>
            </View>

            <NativeButton
              title="Save Measurement"
              onPress={saveNewMeasurement}
              style={{ marginTop: 14 }}
            />
          </View>
        )}
      </NativeCard>

      {/* Historical Ledger Table */}
      <NativeCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 12 }]}>Measurement History</Text>
        {measurements.map((m) => (
          <View key={m.id} style={[styles.historyRow, { borderBottomColor: theme.cardBorder }]}>
            <View>
              <Text style={[styles.historyDate, { color: theme.text }]}>{m.date}</Text>
              <Text style={[styles.historyDetails, { color: theme.textMuted }]}>
                W: {m.waistCm || '--'}cm • C: {m.chestCm || '--'}cm • S: {m.shouldersCm || '--'}cm • A: {m.armsCm || '--'}cm
              </Text>
            </View>
            <Text style={[styles.historyWeight, { color: theme.accent }]}>{m.weightKg.toFixed(1)} kg</Text>
          </View>
        ))}
      </NativeCard>
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
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  targetNumbers: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  subText: {
    fontSize: 12,
    fontWeight: '500',
  },
  vTaperHeader: {
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
    fontSize: 16,
    fontWeight: '700',
  },
  vTaperScore: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  bodyDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricTile: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  smallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  formContainer: {
    marginTop: 12,
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
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  historyWeight: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
