import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { database } from '@/services/database';
import { haptics } from '@/services/haptics';
import { NativeCard } from '@/components/NativeCard';
import { NativeButton } from '@/components/NativeButton';
import { HeaderBar } from '@/components/HeaderBar';
import { UserProfile } from '@/types';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [profile, setProfile] = useState<UserProfile>(database.getProfile());

  const [name, setName] = useState(profile.name);
  const [heightCm, setHeightCm] = useState(profile.heightCm.toString());
  const [currentWeightKg, setCurrentWeightKg] = useState(profile.currentWeightKg.toString());
  const [targetWeightKg, setTargetWeightKg] = useState(profile.targetWeightKg.toString());
  const [calories, setCalories] = useState(profile.dailyCalorieTarget.toString());
  const [protein, setProtein] = useState(profile.dailyProteinTargetGrams.toString());
  const [water, setWater] = useState(profile.dailyWaterTargetLiters.toString());

  const saveProfile = () => {
    haptics.success();

    const updated: UserProfile = {
      ...profile,
      name,
      heightCm: parseFloat(heightCm) || profile.heightCm,
      currentWeightKg: parseFloat(currentWeightKg) || profile.currentWeightKg,
      targetWeightKg: parseFloat(targetWeightKg) || profile.targetWeightKg,
      dailyCalorieTarget: parseInt(calories, 10) || profile.dailyCalorieTarget,
      dailyProteinTargetGrams: parseInt(protein, 10) || profile.dailyProteinTargetGrams,
      dailyWaterTargetLiters: parseFloat(water) || profile.dailyWaterTargetLiters,
    };

    database.updateProfile(updated);
    setProfile(updated);
    Alert.alert('Settings Saved', 'Your profile and targets have been updated.');
  };

  const handleExport = () => {
    haptics.light();
    const backupJson = database.exportBackup();
    Alert.alert('Database Backup Ready', `Backup payload generated (${backupJson.length} bytes). Everything is saved offline in SQLite.`);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data?',
      'This will clear all logs and restore default AestheticOS profile and programmes. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Database',
          style: 'destructive',
          onPress: () => {
            haptics.warning();
            database.resetDatabase();
            const p = database.getProfile();
            setProfile(p);
            setName(p.name);
            setHeightCm(p.heightCm.toString());
            setCurrentWeightKg(p.currentWeightKg.toString());
            setTargetWeightKg(p.targetWeightKg.toString());
            setCalories(p.dailyCalorieTarget.toString());
            setProtein(p.dailyProteinTargetGrams.toString());
            setWater(p.dailyWaterTargetLiters.toString());
            Alert.alert('Database Reset', 'Default settings restored.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.base }]}>
      <HeaderBar title="Settings" subtitle="PROFILE & TARGETS" showBack />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile & Target Form */}
        <NativeCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 12 }]}>Personal Profile</Text>

          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.dualFieldRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Height (cm)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
                keyboardType="decimal-pad"
                value={heightCm}
                onChangeText={setHeightCm}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Current Weight (kg)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
                keyboardType="decimal-pad"
                value={currentWeightKg}
                onChangeText={setCurrentWeightKg}
              />
            </View>
          </View>

          <View style={[styles.fieldRow, { marginTop: 10 }]}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Target Weight (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
              keyboardType="decimal-pad"
              value={targetWeightKg}
              onChangeText={setTargetWeightKg}
            />
          </View>

          <View style={styles.dualFieldRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Daily Calories (kcal)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Protein Target (g)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
              />
            </View>
          </View>

          <View style={[styles.fieldRow, { marginTop: 10 }]}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Water Target (L)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.subtle, color: theme.text, borderColor: theme.border }]}
              keyboardType="decimal-pad"
              value={water}
              onChangeText={setWater}
            />
          </View>

          <NativeButton title="Save Profile Settings" onPress={saveProfile} style={{ marginTop: 16 }} />
        </NativeCard>

        {/* Data Persistence & Backup */}
        <NativeCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 8 }]}>Offline Database</Text>
          <Text style={[styles.cardSubText, { color: theme.textSecondary, marginBottom: 14 }]}>
            AestheticOS stores all workouts, logs, and measurements locally in Expo SQLite on your device.
          </Text>

          <NativeButton
            title="Export JSON Backup"
            onPress={handleExport}
            variant="secondary"
            icon={<Ionicons name="download-outline" size={18} color={theme.text} />}
          />

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
            <Text style={[styles.resetButtonText, { color: theme.danger }]}>Reset Database to Defaults</Text>
          </TouchableOpacity>
        </NativeCard>

        {/* App Info */}
        <View style={styles.infoFooter}>
          <Text style={[styles.infoText, { color: theme.textMuted }]}>AestheticOS v1.0.0 (Native React Native + Expo)</Text>
          <Text style={[styles.infoSubText, { color: theme.textMuted }]}>
            Designed with Apple Monochromatic Human Interface Guidelines
          </Text>
        </View>
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
  card: {
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubText: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldRow: {
    marginBottom: 8,
  },
  dualFieldRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  fieldLabel: {
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoFooter: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoSubText: {
    fontSize: 11,
    marginTop: 2,
  },
});
