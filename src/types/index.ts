export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Legs'
  | 'Abs'
  | 'Cardio'
  | 'Mobility';

export type EquipmentType =
  | 'Barbell'
  | 'Dumbbell'
  | 'Cable'
  | 'Machine'
  | 'Bodyweight'
  | 'Other';

export interface Exercise {
  id: string;
  name: string;
  category: MuscleGroup;
  targetMuscle: string;
  secondaryMuscles: string[];
  equipment: EquipmentType;
  instructions: string[];
  commonMistakes: string[];
  defaultSets: number;
  defaultReps: string;
  substitutes: string[];
  tips: string;
}

export interface ProgramExercise {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: string;
  notes?: string;
}

export interface WorkoutProgramDay {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  title: string;
  focus: string;
  exercises: ProgramExercise[];
  isRestDay: boolean;
  recoveryActivities?: string[];
}

export interface ActiveSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number; // Reps in reserve: 0 (failure), 1, 2, 3+
  completed: boolean;
  isWarmup?: boolean;
}

export interface ActiveExercise {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps: string;
  sets: ActiveSet[];
  notes?: string;
  skipped?: boolean;
  replacedWithId?: string;
}

export interface ActiveWorkoutSession {
  id: string;
  dayId: string;
  title: string;
  startTime: number; // timestamp ms
  elapsedSeconds: number;
  isPaused: boolean;
  status: 'active' | 'completed' | 'abandoned';
  exercises: ActiveExercise[];
  notes?: string;
}

export interface HistoryExerciseSummary {
  exerciseId: string;
  name: string;
  sets: { weightKg: number; reps: number; rir: number; completed: boolean }[];
  topWeightKg: number;
  totalVolumeKg: number;
  totalReps: number;
}

export interface WorkoutHistoryItem {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  dayTitle: string;
  durationMinutes: number;
  totalVolumeKg: number;
  setsCompleted: number;
  exercises: HistoryExerciseSummary[];
  notes?: string;
  personalRecords?: string[];
}

export interface CardioWalkLog {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  distanceKm?: number;
  notes?: string;
  completed: boolean;
}

export interface CardioRunLog {
  id: string;
  date: string; // YYYY-MM-DD
  distanceKm: number;
  durationMinutes: number;
  paceMinutesPerKm: number; // e.g. 5.5 = 5m30s
  type: 'easy' | 'interval' | 'tempo';
  notes?: string;
}

export interface FoodDatabaseItem {
  id: string;
  name: string;
  servingSize: string; // e.g. "100g", "2 whole eggs", "1 cup cooked"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isVegetarianOrEgg: boolean;
}

export interface NutritionLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyHabitLog {
  date: string; // YYYY-MM-DD
  workoutCompleted: boolean;
  walkCompleted: boolean;
  runCompleted: boolean;
  proteinMet: boolean;
  balancedMeals: boolean;
  hydrated: boolean;
  sleptWell: boolean;
  supplementsTaken: boolean;
  mobilityCompleted: boolean;
}

export interface BodyMeasurement {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  heightCm: number;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  shouldersCm?: number;
  thighsCm?: number;
  notes?: string;
  photoUrl?: string; // base64 or stored URL
  photoPose?: 'front' | 'side' | 'back';
}

export interface UserProfile {
  name: string;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  primaryGoal: string;
  secondaryGoals: string[];
  trainingExperience: string;
  scheduleDescription: string;
  dailyWalkingTargetMinutes: number;
  weeklyRunningSessionsTarget: number;
  dailyCalorieTarget: number;
  dailyProteinTargetGrams: number;
  dailyWaterTargetLiters: number;
  trackCreatine: boolean;
  unitSystem: 'metric' | 'imperial';
  theme: 'dark' | 'light' | 'system';
}

export interface ChallengeDay {
  dayNumber: number;
  milestoneTitle?: string;
  description: string;
  isMilestone: boolean;
  tasks: string[];
}
