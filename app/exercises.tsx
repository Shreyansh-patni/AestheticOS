import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { database } from '@/services/database';
import { haptics } from '@/services/haptics';
import { NativeCard } from '@/components/NativeCard';
import { HeaderBar } from '@/components/HeaderBar';
import { Exercise, MuscleGroup } from '@/types';

export default function ExercisesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [allExercises] = useState<Exercise[]>(database.getExercises());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MuscleGroup | 'All'>('All');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const categories: Array<MuscleGroup | 'All'> = [
    'All',
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Forearms',
    'Legs',
    'Abs',
    'Cardio',
    'Mobility',
  ];

  const filtered = allExercises.filter((ex) => {
    const matchesCat = selectedCategory === 'All' || ex.category === selectedCategory;
    const matchesSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.targetMuscle.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.base }]}>
      <HeaderBar title="Exercise Library" subtitle="FORM & TECHNIQUE" showBack />

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.subtle, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search 40+ exercises, muscles, cues..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Chips */}
      <View style={styles.chipWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? theme.text : theme.card,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  haptics.selection();
                  setSelectedCategory(cat);
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
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Exercises List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.countLabel, { color: theme.textMuted }]}>
          Showing {filtered.length} exercise{filtered.length === 1 ? '' : 's'}
        </Text>

        {filtered.map((ex) => (
          <TouchableOpacity
            key={ex.id}
            activeOpacity={0.7}
            onPress={() => {
              haptics.light();
              setSelectedExercise(ex);
            }}
          >
            <NativeCard style={styles.exerciseCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exTitle, { color: theme.text }]}>{ex.name}</Text>
                  <Text style={[styles.exTarget, { color: theme.textSecondary }]}>{ex.targetMuscle}</Text>
                </View>
                <View style={[styles.equipmentBadge, { backgroundColor: theme.subtle }]}>
                  <Text style={[styles.equipmentText, { color: theme.textMuted }]}>{ex.equipment}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={[styles.repsTag, { color: theme.textMuted }]}>
                  Default: {ex.defaultSets} sets × {ex.defaultReps}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </View>
            </NativeCard>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Detail / Instructions Modal */}
      <Modal visible={Boolean(selectedExercise)} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {selectedExercise && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalCategory, { color: theme.accent }]}>
                      {selectedExercise.category.toUpperCase()} • {selectedExercise.equipment.toUpperCase()}
                    </Text>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedExercise.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedExercise(null)}>
                    <Ionicons name="close-circle" size={28} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {/* Target & Secondary Muscles */}
                  <View style={styles.sectionBlock}>
                    <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>TARGET MUSCLE</Text>
                    <Text style={[styles.bodyText, { color: theme.text }]}>{selectedExercise.targetMuscle}</Text>
                    {selectedExercise.secondaryMuscles.length > 0 && (
                      <Text style={[styles.subText, { color: theme.textMuted, marginTop: 2 }]}>
                        Secondary: {selectedExercise.secondaryMuscles.join(', ')}
                      </Text>
                    )}
                  </View>

                  {/* Instructions */}
                  <View style={styles.sectionBlock}>
                    <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>EXECUTION INSTRUCTIONS</Text>
                    {selectedExercise.instructions.map((inst, i) => (
                      <View key={i} style={styles.instructionRow}>
                        <Text style={[styles.stepNumber, { color: theme.accent }]}>{i + 1}.</Text>
                        <Text style={[styles.instructionText, { color: theme.text }]}>{inst}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Common Mistakes */}
                  {selectedExercise.commonMistakes && selectedExercise.commonMistakes.length > 0 && (
                    <View style={styles.sectionBlock}>
                      <Text style={[styles.sectionHeading, { color: theme.warning }]}>COMMON MISTAKES TO AVOID</Text>
                      {selectedExercise.commonMistakes.map((mis, i) => (
                        <View key={i} style={styles.instructionRow}>
                          <Ionicons name="alert-circle-outline" size={16} color={theme.warning} style={{ marginRight: 6 }} />
                          <Text style={[styles.instructionText, { color: theme.textSecondary }]}>{mis}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Substitutes */}
                  {selectedExercise.substitutes && selectedExercise.substitutes.length > 0 && (
                    <View style={styles.sectionBlock}>
                      <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>RECOMMENDED SUBSTITUTES</Text>
                      <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
                        {selectedExercise.substitutes.join(' • ')}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 44,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  chipWrapper: {
    marginBottom: 8,
  },
  chipRow: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  countLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  exerciseCard: {
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  exTarget: {
    fontSize: 12,
    marginTop: 2,
  },
  equipmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  equipmentText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
  },
  repsTag: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalCategory: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalScroll: {
    marginBottom: 20,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subText: {
    fontSize: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    width: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
