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
import { vegetarianAndEggFoods } from '@/constants/InitialData';
import { NutritionLogItem, UserProfile, FoodDatabaseItem } from '@/types';

export default function NutritionScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const todayStr = new Date().toISOString().split('T')[0];

  const [profile, setProfile] = useState<UserProfile>(database.getProfile());
  const [logs, setLogs] = useState<NutritionLogItem[]>(database.getNutritionLogs(todayStr));
  const [waterMl, setWaterMl] = useState<number>(2000);
  const [creatineTaken, setCreatineTaken] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showFoodPicker, setShowFoodPicker] = useState<boolean>(false);

  const loadNutritionData = useCallback(() => {
    setProfile(database.getProfile());
    setLogs(database.getNutritionLogs(todayStr));
  }, [todayStr]);

  useFocusEffect(
    useCallback(() => {
      loadNutritionData();
    }, [loadNutritionData])
  );

  const addFoodToLog = (item: FoodDatabaseItem) => {
    haptics.success();

    const newLog: NutritionLogItem = {
      id: `nutr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: todayStr,
      mealType: selectedMeal,
      foodName: item.name,
      quantity: item.servingSize,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    };

    database.saveNutritionLog(newLog);
    const updated = database.getNutritionLogs(todayStr);
    setLogs(updated);

    // If protein goal exceeded, mark habit
    const totalProtein = updated.reduce((sum, n) => sum + n.protein, 0);
    if (totalProtein >= profile.dailyProteinTargetGrams) {
      const habits = database.getDailyHabits(todayStr);
      if (!habits.proteinMet) {
        database.toggleHabit(todayStr, 'proteinMet');
      }
    }

    setShowFoodPicker(false);
  };

  const deleteFood = (id: string) => {
    haptics.light();
    database.deleteNutritionLog(id);
    setLogs(database.getNutritionLogs(todayStr));
  };

  const addWater = (amountMl: number) => {
    haptics.selection();
    const updated = Math.max(0, waterMl + amountMl);
    setWaterMl(updated);
    if (updated >= profile.dailyWaterTargetLiters * 1000) {
      const habits = database.getDailyHabits(todayStr);
      if (!habits.hydrated) {
        database.toggleHabit(todayStr, 'hydrated');
      }
    }
  };

  const toggleCreatine = () => {
    haptics.selection();
    const updated = !creatineTaken;
    setCreatineTaken(updated);
    const habits = database.getDailyHabits(todayStr);
    if (updated !== habits.supplementsTaken) {
      database.toggleHabit(todayStr, 'supplementsTaken');
    }
  };

  // Totals calculations
  const totalCalories = logs.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = logs.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = logs.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = logs.reduce((sum, item) => sum + item.fat, 0);

  const calPercent = Math.min((totalCalories / profile.dailyCalorieTarget) * 100, 100);
  const proteinPercent = Math.min((totalProtein / profile.dailyProteinTargetGrams) * 100, 100);

  const filteredFoods = vegetarianAndEggFoods.filter((f: FoodDatabaseItem) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.base }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>LEAN BULKING & FUEL</Text>
        <Text style={[styles.title, { color: theme.text }]}>Nutrition</Text>
      </View>

      {/* Daily Macro Progress Summary */}
      <NativeCard style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Calories Consumed</Text>
            <Text style={[styles.summaryBigNumber, { color: theme.text }]}>
              {Math.round(totalCalories)} <Text style={[styles.subUnit, { color: theme.textMuted }]}>/ {profile.dailyCalorieTarget} kcal</Text>
            </Text>
          </View>
          <View
            style={[
              styles.surplusBadge,
              { backgroundColor: totalCalories >= 2000 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' },
            ]}
          >
            <Text style={[styles.surplusBadgeText, { color: totalCalories >= 2000 ? theme.accent : theme.warning }]}>
              {totalCalories >= profile.dailyCalorieTarget ? 'TARGET REACHED' : 'LEAN GAIN SURPLUS'}
            </Text>
          </View>
        </View>

        {/* Calorie Bar */}
        <View style={[styles.progressTrack, { backgroundColor: theme.subtle }]}>
          <View style={[styles.progressBar, { width: `${calPercent}%`, backgroundColor: theme.text }]} />
        </View>

        {/* 3 Macro Metrics */}
        <View style={styles.macrosRow}>
          <View style={styles.macroCol}>
            <Text style={[styles.macroLabel, { color: '#10B981' }]}>Protein</Text>
            <Text style={[styles.macroValue, { color: theme.text }]}>
              {Math.round(totalProtein)}g <Text style={{ fontSize: 11, color: theme.textMuted }}>/ {profile.dailyProteinTargetGrams}g</Text>
            </Text>
            <View style={[styles.macroBarTrack, { backgroundColor: theme.subtle }]}>
              <View style={[styles.macroBarFill, { width: `${proteinPercent}%`, backgroundColor: '#10B981' }]} />
            </View>
          </View>

          <View style={styles.macroCol}>
            <Text style={[styles.macroLabel, { color: '#38BDF8' }]}>Carbs</Text>
            <Text style={[styles.macroValue, { color: theme.text }]}>{Math.round(totalCarbs)}g</Text>
            <View style={[styles.macroBarTrack, { backgroundColor: theme.subtle }]}>
              <View style={[styles.macroBarFill, { width: `${Math.min((totalCarbs / 300) * 100, 100)}%`, backgroundColor: '#38BDF8' }]} />
            </View>
          </View>

          <View style={styles.macroCol}>
            <Text style={[styles.macroLabel, { color: '#F59E0B' }]}>Fats</Text>
            <Text style={[styles.macroValue, { color: theme.text }]}>{Math.round(totalFat)}g</Text>
            <View style={[styles.macroBarTrack, { backgroundColor: theme.subtle }]}>
              <View style={[styles.macroBarFill, { width: `${Math.min((totalFat / 75) * 100, 100)}%`, backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
        </View>
      </NativeCard>

      {/* Hydration & Creatine Stack */}
      <View style={styles.dualCardRow}>
        {/* Water Card */}
        <NativeCard style={[styles.miniCard, { flex: 1, marginRight: 6 }]}>
          <View style={styles.miniCardHeader}>
            <Ionicons name="water" size={20} color="#38BDF8" />
            <Text style={[styles.miniCardTitle, { color: theme.text }]}>Water</Text>
          </View>
          <Text style={[styles.miniCardValue, { color: theme.text }]}>
            {(waterMl / 1000).toFixed(1)} / {profile.dailyWaterTargetLiters.toFixed(1)} L
          </Text>
          <View style={styles.waterStepperRow}>
            <TouchableOpacity
              style={[styles.waterStepBtn, { backgroundColor: theme.subtle }]}
              onPress={() => addWater(250)}
            >
              <Text style={[styles.waterStepText, { color: theme.text }]}>+250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.waterStepBtn, { backgroundColor: theme.subtle, marginLeft: 4 }]}
              onPress={() => addWater(500)}
            >
              <Text style={[styles.waterStepText, { color: theme.text }]}>+500ml</Text>
            </TouchableOpacity>
          </View>
        </NativeCard>

        {/* Creatine Card */}
        <NativeCard style={[styles.miniCard, { flex: 1, marginLeft: 6 }]}>
          <View style={styles.miniCardHeader}>
            <Ionicons name="fitness" size={20} color="#10B981" />
            <Text style={[styles.miniCardTitle, { color: theme.text }]}>Creatine</Text>
          </View>
          <Text style={[styles.miniCardValue, { color: theme.text }]}>5g Daily Monohydrate</Text>
          <TouchableOpacity
            style={[
              styles.creatineToggleBtn,
              { backgroundColor: creatineTaken ? 'rgba(16, 185, 129, 0.15)' : theme.subtle },
            ]}
            onPress={toggleCreatine}
          >
            <Ionicons
              name={creatineTaken ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={creatineTaken ? theme.accent : theme.textMuted}
            />
            <Text
              style={[
                styles.creatineToggleText,
                { color: creatineTaken ? theme.accent : theme.textMuted, marginLeft: 6 },
              ]}
            >
              {creatineTaken ? 'Taken Today' : 'Mark Taken'}
            </Text>
          </TouchableOpacity>
        </NativeCard>
      </View>

      {/* Quick Add Meal Section */}
      <NativeCard style={styles.quickAddCard}>
        <View style={styles.quickAddHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Log Meal</Text>
          <TouchableOpacity
            style={[styles.addFoodPill, { backgroundColor: theme.text }]}
            onPress={() => setShowFoodPicker(!showFoodPicker)}
          >
            <Ionicons name={showFoodPicker ? 'close' : 'add'} size={16} color={colorScheme === 'dark' ? '#000' : '#FFF'} />
            <Text style={[styles.addFoodPillText, { color: colorScheme === 'dark' ? '#000' : '#FFF' }]}>
              {showFoodPicker ? 'Close' : 'Add Food'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Meal Type Selector */}
        <View style={styles.mealTypeRow}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.mealTypeChip,
                {
                  backgroundColor: selectedMeal === m ? theme.text : theme.subtle,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                haptics.selection();
                setSelectedMeal(m);
              }}
            >
              <Text
                style={[
                  styles.mealChipText,
                  { color: selectedMeal === m ? (colorScheme === 'dark' ? '#000' : '#FFF') : theme.text },
                ]}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Food Database Picker Modal/Dropdown */}
        {showFoodPicker && (
          <View style={[styles.pickerBox, { backgroundColor: theme.subtle, borderColor: theme.border }]}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search vegetarian & egg foods..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
              {filteredFoods.map((food) => (
                <TouchableOpacity
                  key={food.id}
                  style={[styles.foodPickerItem, { borderBottomColor: theme.cardBorder }]}
                  onPress={() => addFoodToLog(food)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerFoodName, { color: theme.text }]}>{food.name}</Text>
                    <Text style={[styles.pickerFoodServing, { color: theme.textMuted }]}>
                      {food.servingSize} • {food.protein}g protein
                    </Text>
                  </View>
                  <View style={styles.pickerCaloriesRow}>
                    <Text style={[styles.pickerCalories, { color: theme.text }]}>{food.calories} kcal</Text>
                    <Ionicons name="add-circle" size={22} color={theme.accent} style={{ marginLeft: 8 }} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </NativeCard>

      {/* Today's Food Log Ledger */}
      <NativeCard style={styles.logListCard}>
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Today’s Meals</Text>

        {logs.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No meals logged yet today. Use the button above to log your high-protein foods.
          </Text>
        ) : (
          logs.map((item) => (
            <View key={item.id} style={[styles.logItemRow, { borderBottomColor: theme.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.logItemHeader}>
                  <Text style={[styles.logItemMeal, { color: theme.textMuted }]}>
                    {item.mealType.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.logItemFoodName, { color: theme.text }]}>{item.foodName}</Text>
                <Text style={[styles.logItemSub, { color: theme.textMuted }]}>
                  {item.quantity} • {item.protein}g protein • {item.carbs}g carbs • {item.fat}g fat
                </Text>
              </View>

              <View style={styles.logItemRight}>
                <Text style={[styles.logItemCalories, { color: theme.text }]}>{item.calories} kcal</Text>
                <TouchableOpacity onPress={() => deleteFood(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={16} color={theme.danger} style={{ marginTop: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  summaryCard: {
    padding: 18,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryBigNumber: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  surplusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  surplusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  macroBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  dualCardRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  miniCard: {
    padding: 14,
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  miniCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  miniCardValue: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  waterStepperRow: {
    flexDirection: 'row',
  },
  waterStepBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  waterStepText: {
    fontSize: 11,
    fontWeight: '700',
  },
  creatineToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  creatineToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickAddCard: {
    padding: 16,
    marginBottom: 12,
  },
  quickAddHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  addFoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addFoodPillText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  mealTypeRow: {
    flexDirection: 'row',
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  mealChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pickerBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
  },
  foodPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerFoodName: {
    fontSize: 13,
    fontWeight: '600',
  },
  pickerFoodServing: {
    fontSize: 11,
    marginTop: 2,
  },
  pickerCaloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerCalories: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  logListCard: {
    padding: 16,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  logItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logItemHeader: {
    marginBottom: 2,
  },
  logItemMeal: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  logItemFoodName: {
    fontSize: 14,
    fontWeight: '600',
  },
  logItemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  logItemRight: {
    alignItems: 'flex-end',
  },
  logItemCalories: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
