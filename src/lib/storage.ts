import {
  UserProfile,
  WorkoutProgramDay,
  Exercise,
  FoodDatabaseItem,
  WorkoutHistoryItem,
  BodyMeasurement,
  CardioWalkLog,
  CardioRunLog,
  NutritionLogItem,
  DailyHabitLog,
  ActiveWorkoutSession,
} from '@/types';
import {
  initialProfile,
  initialWorkoutProgram,
  initialExercises,
  initialFoodDatabase,
  initialMeasurements,
  initialWorkoutHistory,
  initialWalkLogs,
  initialRunLogs,
  initialNutritionLogs,
  initialHabits,
} from './initialData';

const STORAGE_KEYS = {
  PROFILE: 'aesthetic_profile_v1',
  PROGRAM: 'aesthetic_program_v1',
  EXERCISES: 'aesthetic_exercises_v1',
  ACTIVE_SESSION: 'aesthetic_active_session_v1',
  HISTORY: 'aesthetic_history_v1',
  WALKS: 'aesthetic_walks_v1',
  RUNS: 'aesthetic_runs_v1',
  FOOD_DB: 'aesthetic_food_db_v1',
  NUTRITION_LOGS: 'aesthetic_nutrition_logs_v1',
  HABITS: 'aesthetic_habits_v1',
  MEASUREMENTS: 'aesthetic_measurements_v1',
  CHALLENGE_DAYS: 'aesthetic_challenge_days_v1',
};

// Safe localStorage helper
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Dispatch custom event for cross-component reactivity
    window.dispatchEvent(new Event('aesthetic-storage-update'));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

export const StorageService = {
  // Profile
  getProfile(): UserProfile {
    return getStored<UserProfile>(STORAGE_KEYS.PROFILE, initialProfile);
  },
  saveProfile(profile: UserProfile): void {
    setStored(STORAGE_KEYS.PROFILE, profile);
  },

  // Exercises
  getExercises(): Exercise[] {
    return getStored<Exercise[]>(STORAGE_KEYS.EXERCISES, initialExercises);
  },
  saveExercises(exercises: Exercise[]): void {
    setStored(STORAGE_KEYS.EXERCISES, exercises);
  },
  addExercise(exercise: Exercise): void {
    const list = this.getExercises();
    setStored(STORAGE_KEYS.EXERCISES, [exercise, ...list]);
  },
  updateExercise(exercise: Exercise): void {
    const list = this.getExercises().map((e) => (e.id === exercise.id ? exercise : e));
    setStored(STORAGE_KEYS.EXERCISES, list);
  },

  // Program
  getProgram(): WorkoutProgramDay[] {
    return getStored<WorkoutProgramDay[]>(STORAGE_KEYS.PROGRAM, initialWorkoutProgram);
  },
  saveProgram(program: WorkoutProgramDay[]): void {
    setStored(STORAGE_KEYS.PROGRAM, program);
  },

  // Active Workout Session
  getActiveSession(): ActiveWorkoutSession | null {
    return getStored<ActiveWorkoutSession | null>(STORAGE_KEYS.ACTIVE_SESSION, null);
  },
  saveActiveSession(session: ActiveWorkoutSession | null): void {
    setStored(STORAGE_KEYS.ACTIVE_SESSION, session);
  },
  clearActiveSession(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      window.dispatchEvent(new Event('aesthetic-storage-update'));
    }
  },

  // Workout History
  getHistory(): WorkoutHistoryItem[] {
    return getStored<WorkoutHistoryItem[]>(STORAGE_KEYS.HISTORY, initialWorkoutHistory);
  },
  saveHistory(history: WorkoutHistoryItem[]): void {
    setStored(STORAGE_KEYS.HISTORY, history);
  },
  addWorkoutToHistory(workout: WorkoutHistoryItem): void {
    const history = this.getHistory();
    setStored(STORAGE_KEYS.HISTORY, [workout, ...history]);
  },
  deleteWorkoutFromHistory(id: string): void {
    const history = this.getHistory().filter((w) => w.id !== id);
    setStored(STORAGE_KEYS.HISTORY, history);
  },

  // Cardio: Walks
  getWalks(): CardioWalkLog[] {
    return getStored<CardioWalkLog[]>(STORAGE_KEYS.WALKS, initialWalkLogs);
  },
  saveWalks(walks: CardioWalkLog[]): void {
    setStored(STORAGE_KEYS.WALKS, walks);
  },
  addWalk(walk: CardioWalkLog): void {
    const walks = this.getWalks();
    setStored(STORAGE_KEYS.WALKS, [walk, ...walks]);
  },

  // Cardio: Runs
  getRuns(): CardioRunLog[] {
    return getStored<CardioRunLog[]>(STORAGE_KEYS.RUNS, initialRunLogs);
  },
  saveRuns(runs: CardioRunLog[]): void {
    setStored(STORAGE_KEYS.RUNS, runs);
  },
  addRun(run: CardioRunLog): void {
    const runs = this.getRuns();
    setStored(STORAGE_KEYS.RUNS, [run, ...runs]);
  },

  // Food Database
  getFoodDatabase(): FoodDatabaseItem[] {
    return getStored<FoodDatabaseItem[]>(STORAGE_KEYS.FOOD_DB, initialFoodDatabase);
  },
  saveFoodDatabase(foods: FoodDatabaseItem[]): void {
    setStored(STORAGE_KEYS.FOOD_DB, foods);
  },
  addFoodToDatabase(food: FoodDatabaseItem): void {
    const foods = this.getFoodDatabase();
    setStored(STORAGE_KEYS.FOOD_DB, [food, ...foods]);
  },

  // Nutrition Logs
  getNutritionLogs(): NutritionLogItem[] {
    return getStored<NutritionLogItem[]>(STORAGE_KEYS.NUTRITION_LOGS, initialNutritionLogs);
  },
  saveNutritionLogs(logs: NutritionLogItem[]): void {
    setStored(STORAGE_KEYS.NUTRITION_LOGS, logs);
  },
  addNutritionLog(item: NutritionLogItem): void {
    const logs = this.getNutritionLogs();
    setStored(STORAGE_KEYS.NUTRITION_LOGS, [item, ...logs]);
  },
  deleteNutritionLog(id: string): void {
    const logs = this.getNutritionLogs().filter((l) => l.id !== id);
    setStored(STORAGE_KEYS.NUTRITION_LOGS, logs);
  },

  // Habits
  getHabits(): DailyHabitLog[] {
    return getStored<DailyHabitLog[]>(STORAGE_KEYS.HABITS, initialHabits);
  },
  saveHabits(habits: DailyHabitLog[]): void {
    setStored(STORAGE_KEYS.HABITS, habits);
  },
  getHabitForDate(date: string): DailyHabitLog {
    const list = this.getHabits();
    const found = list.find((h) => h.date === date);
    if (found) return found;
    return {
      date,
      workoutCompleted: false,
      walkCompleted: false,
      runCompleted: false,
      proteinMet: false,
      balancedMeals: false,
      hydrated: false,
      sleptWell: false,
      supplementsTaken: false,
      mobilityCompleted: false,
    };
  },
  updateHabitForDate(date: string, partial: Partial<DailyHabitLog>): void {
    const list = this.getHabits();
    const index = list.findIndex((h) => h.date === date);
    if (index >= 0) {
      list[index] = { ...list[index], ...partial };
      setStored(STORAGE_KEYS.HABITS, [...list]);
    } else {
      const current = this.getHabitForDate(date);
      setStored(STORAGE_KEYS.HABITS, [{ ...current, ...partial }, ...list]);
    }
  },

  // Body Measurements
  getMeasurements(): BodyMeasurement[] {
    return getStored<BodyMeasurement[]>(STORAGE_KEYS.MEASUREMENTS, initialMeasurements);
  },
  saveMeasurements(measurements: BodyMeasurement[]): void {
    setStored(STORAGE_KEYS.MEASUREMENTS, measurements);
  },
  addMeasurement(measurement: BodyMeasurement): void {
    const list = this.getMeasurements();
    setStored(STORAGE_KEYS.MEASUREMENTS, [measurement, ...list]);
  },
  deleteMeasurement(id: string): void {
    const list = this.getMeasurements().filter((m) => m.id !== id);
    setStored(STORAGE_KEYS.MEASUREMENTS, list);
  },

  // 30-Day Challenge
  getChallengeCompletedDays(): number[] {
    return getStored<number[]>(STORAGE_KEYS.CHALLENGE_DAYS, [1, 2, 3, 4, 5, 6, 7]);
  },
  saveChallengeCompletedDays(days: number[]): void {
    setStored(STORAGE_KEYS.CHALLENGE_DAYS, days);
  },
  toggleChallengeDay(day: number): void {
    const days = this.getChallengeCompletedDays();
    if (days.includes(day)) {
      setStored(
        STORAGE_KEYS.CHALLENGE_DAYS,
        days.filter((d) => d !== day)
      );
    } else {
      setStored(STORAGE_KEYS.CHALLENGE_DAYS, [...days, day].sort((a, b) => a - b));
    }
  },

  // Export / Import / Reset
  exportAllDataJSON(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      program: this.getProgram(),
      exercises: this.getExercises(),
      history: this.getHistory(),
      walks: this.getWalks(),
      runs: this.getRuns(),
      foodDatabase: this.getFoodDatabase(),
      nutritionLogs: this.getNutritionLogs(),
      habits: this.getHabits(),
      measurements: this.getMeasurements(),
      challengeDays: this.getChallengeCompletedDays(),
    };
    return JSON.stringify(data, null, 2);
  },

  exportWorkoutsCSV(): string {
    const history = this.getHistory();
    const headers = ['Date', 'Workout Title', 'Duration (min)', 'Total Volume (kg)', 'Sets Completed', 'Notes'];
    const rows = history.map((w) => [
      `"${w.date}"`,
      `"${w.dayTitle.replace(/"/g, '""')}"`,
      w.durationMinutes,
      w.totalVolumeKg,
      w.setsCompleted,
      `"${(w.notes || '').replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  exportMeasurementsCSV(): string {
    const measurements = this.getMeasurements();
    const headers = ['Date', 'Weight (kg)', 'Height (cm)', 'Waist (cm)', 'Chest (cm)', 'Arms (cm)', 'Shoulders (cm)', 'Thighs (cm)', 'Notes'];
    const rows = measurements.map((m) => [
      `"${m.date}"`,
      m.weightKg,
      m.heightCm,
      m.waistCm || '',
      m.chestCm || '',
      m.armsCm || '',
      m.shouldersCm || '',
      m.thighsCm || '',
      `"${(m.notes || '').replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  importAllDataJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile) this.saveProfile(data.profile);
      if (data.program) this.saveProgram(data.program);
      if (data.exercises) this.saveExercises(data.exercises);
      if (data.history) this.saveHistory(data.history);
      if (data.walks) this.saveWalks(data.walks);
      if (data.runs) this.saveRuns(data.runs);
      if (data.foodDatabase) this.saveFoodDatabase(data.foodDatabase);
      if (data.nutritionLogs) this.saveNutritionLogs(data.nutritionLogs);
      if (data.habits) this.saveHabits(data.habits);
      if (data.measurements) this.saveMeasurements(data.measurements);
      if (data.challengeDays) this.saveChallengeCompletedDays(data.challengeDays);
      return { success: true, message: 'All data imported successfully.' };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'Invalid JSON file format.' };
    }
  },

  resetToDefaults(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
    window.dispatchEvent(new Event('aesthetic-storage-update'));
  },
};
