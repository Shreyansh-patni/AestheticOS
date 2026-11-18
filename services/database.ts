import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import {
  UserProfile,
  WorkoutProgramDay,
  Exercise,
  WorkoutHistoryItem,
  CardioWalkLog,
  CardioRunLog,
  NutritionLogItem,
  DailyHabitLog,
  BodyMeasurement,
  ActiveWorkoutSession,
} from '@/types';
import {
  initialProfile,
  initialWorkoutProgram,
  initialExercises,
  seedWorkoutHistory,
  initialMeasurements,
} from '@/constants/InitialData';

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('aestheticos.db');
  }
  return dbInstance;
}

// In-memory / web fallback store if needed
const webStorage = {
  profile: JSON.stringify(initialProfile),
  program: JSON.stringify(initialWorkoutProgram),
  exercises: JSON.stringify(initialExercises),
  history: JSON.stringify(seedWorkoutHistory),
  measurements: JSON.stringify(initialMeasurements),
  walks: '[]',
  runs: '[]',
  nutrition: '[]',
  habits: '{}',
  challenge: '[]',
  activeSession: 'null',
};

export const database = {
  init(): void {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const db = getDb();

      // Create Tables
      db.execSync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS profile (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS program (
          id TEXT PRIMARY KEY,
          dayOfWeek TEXT NOT NULL,
          data TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS exercises (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workout_history (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          dayTitle TEXT NOT NULL,
          durationMinutes INTEGER NOT NULL,
          totalVolumeKg REAL NOT NULL,
          setsCompleted INTEGER NOT NULL,
          data TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS active_session (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS walk_logs (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          durationMinutes INTEGER NOT NULL,
          distanceKm REAL,
          notes TEXT,
          completed INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS run_logs (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          distanceKm REAL NOT NULL,
          durationMinutes REAL NOT NULL,
          paceMinutesPerKm REAL NOT NULL,
          type TEXT NOT NULL,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS nutrition_logs (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          mealType TEXT NOT NULL,
          foodName TEXT NOT NULL,
          quantity TEXT NOT NULL,
          calories REAL NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fat REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS daily_habits (
          date TEXT PRIMARY KEY,
          data TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS measurements (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          weightKg REAL NOT NULL,
          heightCm REAL NOT NULL,
          waistCm REAL,
          chestCm REAL,
          armsCm REAL,
          shouldersCm REAL,
          thighsCm REAL,
          notes TEXT,
          photoUrl TEXT,
          photoPose TEXT
        );

        CREATE TABLE IF NOT EXISTS challenge_days (
          dayNumber INTEGER PRIMARY KEY,
          completedAt TEXT NOT NULL
        );
      `);

      // Seed Profile if missing
      const profileRow = db.getFirstSync<{ count: number }>('SELECT count(*) as count FROM profile');
      if (!profileRow || profileRow.count === 0) {
        db.runSync('INSERT INTO profile (id, data) VALUES (1, ?)', [JSON.stringify(initialProfile)]);
      }

      // Seed Program if missing
      const programRow = db.getFirstSync<{ count: number }>('SELECT count(*) as count FROM program');
      if (!programRow || programRow.count === 0) {
        for (const day of initialWorkoutProgram) {
          db.runSync('INSERT INTO program (id, dayOfWeek, data) VALUES (?, ?, ?)', [
            day.id,
            day.dayOfWeek,
            JSON.stringify(day),
          ]);
        }
      }

      // Seed Exercises if missing
      const exercisesRow = db.getFirstSync<{ count: number }>('SELECT count(*) as count FROM exercises');
      if (!exercisesRow || exercisesRow.count === 0) {
        for (const ex of initialExercises) {
          db.runSync('INSERT INTO exercises (id, data) VALUES (?, ?)', [ex.id, JSON.stringify(ex)]);
        }
      }

      // Seed History if missing
      const historyRow = db.getFirstSync<{ count: number }>('SELECT count(*) as count FROM workout_history');
      if (!historyRow || historyRow.count === 0) {
        for (const h of seedWorkoutHistory) {
          db.runSync(
            'INSERT INTO workout_history (id, date, dayTitle, durationMinutes, totalVolumeKg, setsCompleted, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [h.id, h.date, h.dayTitle, h.durationMinutes, h.totalVolumeKg, h.setsCompleted, JSON.stringify(h)]
          );
        }
      }

      // Seed Measurements if missing
      const measureRow = db.getFirstSync<{ count: number }>('SELECT count(*) as count FROM measurements');
      if (!measureRow || measureRow.count === 0) {
        for (const m of initialMeasurements) {
          db.runSync(
            'INSERT INTO measurements (id, date, weightKg, heightCm, waistCm, chestCm, armsCm, shouldersCm, thighsCm, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [m.id, m.date, m.weightKg, m.heightCm, m.waistCm || null, m.chestCm || null, m.armsCm || null, m.shouldersCm || null, m.thighsCm || null, m.notes || '']
          );
        }
      }

      // Seed initial walk log for today if none exists
      const today = new Date().toISOString().split('T')[0];
      const todayWalk = db.getFirstSync<{ count: number }>('SELECT count(*) as count FROM walk_logs WHERE date = ?', [today]);
      if (!todayWalk || todayWalk.count === 0) {
        db.runSync(
          'INSERT INTO walk_logs (id, date, durationMinutes, distanceKm, notes, completed) VALUES (?, ?, ?, ?, ?, ?)',
          ['walk-initial', today, 30, 2.4, 'Daily 30-minute foundation walk', 1]
        );
      }
    } catch (err) {
      console.warn('Database initialization warning:', err);
    }
  },

  // USER PROFILE
  getProfile(): UserProfile {
    if (Platform.OS === 'web') {
      return JSON.parse(webStorage.profile);
    }
    try {
      const db = getDb();
      const row = db.getFirstSync<{ data: string }>('SELECT data FROM profile WHERE id = 1');
      return row ? JSON.parse(row.data) : initialProfile;
    } catch {
      return initialProfile;
    }
  },

  updateProfile(profile: UserProfile): void {
    if (Platform.OS === 'web') {
      webStorage.profile = JSON.stringify(profile);
      return;
    }
    try {
      const db = getDb();
      db.runSync('UPDATE profile SET data = ? WHERE id = 1', [JSON.stringify(profile)]);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  },

  // WORKOUT PROGRAM
  getProgram(): WorkoutProgramDay[] {
    if (Platform.OS === 'web') {
      return JSON.parse(webStorage.program);
    }
    try {
      const db = getDb();
      const rows = db.getAllSync<{ data: string }>('SELECT data FROM program');
      if (rows && rows.length > 0) {
        return rows.map((r) => JSON.parse(r.data));
      }
      return initialWorkoutProgram;
    } catch {
      return initialWorkoutProgram;
    }
  },

  updateProgramDay(day: WorkoutProgramDay): void {
    if (Platform.OS === 'web') {
      const list = JSON.parse(webStorage.program) as WorkoutProgramDay[];
      const idx = list.findIndex((d) => d.id === day.id);
      if (idx >= 0) list[idx] = day;
      webStorage.program = JSON.stringify(list);
      return;
    }
    try {
      const db = getDb();
      db.runSync('UPDATE program SET data = ? WHERE id = ?', [JSON.stringify(day), day.id]);
    } catch (err) {
      console.error('Failed to update program day:', err);
    }
  },

  // EXERCISES
  getExercises(): Exercise[] {
    if (Platform.OS === 'web') {
      return JSON.parse(webStorage.exercises);
    }
    try {
      const db = getDb();
      const rows = db.getAllSync<{ data: string }>('SELECT data FROM exercises');
      if (rows && rows.length > 0) {
        return rows.map((r) => JSON.parse(r.data));
      }
      return initialExercises;
    } catch {
      return initialExercises;
    }
  },

  saveExercise(exercise: Exercise): void {
    if (Platform.OS === 'web') {
      const list = JSON.parse(webStorage.exercises) as Exercise[];
      const idx = list.findIndex((e) => e.id === exercise.id);
      if (idx >= 0) list[idx] = exercise;
      else list.push(exercise);
      webStorage.exercises = JSON.stringify(list);
      return;
    }
    try {
      const db = getDb();
      db.runSync(
        'INSERT OR REPLACE INTO exercises (id, data) VALUES (?, ?)',
        [exercise.id, JSON.stringify(exercise)]
      );
    } catch (err) {
      console.error('Failed to save exercise:', err);
    }
  },

  // ACTIVE SESSION (IN-PROGRESS WORKOUT)
  getActiveSession(): ActiveWorkoutSession | null {
    if (Platform.OS === 'web') {
      const data = webStorage.activeSession;
      return data && data !== 'null' ? JSON.parse(data) : null;
    }
    try {
      const db = getDb();
      const row = db.getFirstSync<{ data: string }>('SELECT data FROM active_session WHERE id = 1');
      return row ? JSON.parse(row.data) : null;
    } catch {
      return null;
    }
  },

  saveActiveSession(session: ActiveWorkoutSession): void {
    if (Platform.OS === 'web') {
      webStorage.activeSession = JSON.stringify(session);
      return;
    }
    try {
      const db = getDb();
      db.runSync(
        'INSERT OR REPLACE INTO active_session (id, data) VALUES (1, ?)',
        [JSON.stringify(session)]
      );
    } catch (err) {
      console.error('Failed to save active session:', err);
    }
  },

  clearActiveSession(): void {
    if (Platform.OS === 'web') {
      webStorage.activeSession = 'null';
      return;
    }
    try {
      const db = getDb();
      db.runSync('DELETE FROM active_session WHERE id = 1');
    } catch (err) {
      console.error('Failed to clear active session:', err);
    }
  },

  // WORKOUT HISTORY
  getWorkoutHistory(): WorkoutHistoryItem[] {
    if (Platform.OS === 'web') {
      return JSON.parse(webStorage.history);
    }
    try {
      const db = getDb();
      const rows = db.getAllSync<{ data: string }>(
        'SELECT data FROM workout_history ORDER BY date DESC, id DESC'
      );
      return rows.map((r) => JSON.parse(r.data));
    } catch {
      return seedWorkoutHistory;
    }
  },

  saveWorkoutHistory(item: WorkoutHistoryItem): void {
    if (Platform.OS === 'web') {
      const list = JSON.parse(webStorage.history) as WorkoutHistoryItem[];
      list.unshift(item);
      webStorage.history = JSON.stringify(list);
      return;
    }
    try {
      const db = getDb();
      db.runSync(
        'INSERT OR REPLACE INTO workout_history (id, date, dayTitle, durationMinutes, totalVolumeKg, setsCompleted, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          item.id,
          item.date,
          item.dayTitle,
          item.durationMinutes,
          item.totalVolumeKg,
          item.setsCompleted,
          JSON.stringify(item),
        ]
      );
    } catch (err) {
      console.error('Failed to save workout history:', err);
    }
  },

  deleteWorkoutHistory(id: string): void {
    if (Platform.OS === 'web') {
      const list = (JSON.parse(webStorage.history) as WorkoutHistoryItem[]).filter((h) => h.id !== id);
      webStorage.history = JSON.stringify(list);
      return;
    }
    try {
      const db = getDb();
      db.runSync('DELETE FROM workout_history WHERE id = ?', [id]);
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  },

  // DAILY HABITS
  getDailyHabits(date: string): DailyHabitLog {
    const defaultHabits: DailyHabitLog = {
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

    if (Platform.OS === 'web') {
      const all = JSON.parse(webStorage.habits);
      return all[date] || defaultHabits;
    }

    try {
      const db = getDb();
      const row = db.getFirstSync<{ data: string }>('SELECT data FROM daily_habits WHERE date = ?', [date]);
      return row ? JSON.parse(row.data) : defaultHabits;
    } catch {
      return defaultHabits;
    }
  },

  saveDailyHabits(habits: DailyHabitLog): void {
    if (Platform.OS === 'web') {
      const all = JSON.parse(webStorage.habits);
      all[habits.date] = habits;
      webStorage.habits = JSON.stringify(all);
      return;
    }
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO daily_habits (date, data) VALUES (?, ?)', [
        habits.date,
        JSON.stringify(habits),
      ]);
    } catch (err) {
      console.error('Failed to save daily habits:', err);
    }
  },

  toggleHabit(date: string, key: keyof Omit<DailyHabitLog, 'date'>): DailyHabitLog {
    const current = this.getDailyHabits(date);
    const updated = {
      ...current,
      [key]: !current[key],
    };
    this.saveDailyHabits(updated);
    return updated;
  },

  // CARDIO - WALKS
  getWalkLogs(date?: string): CardioWalkLog[] {
    if (Platform.OS === 'web') {
      const list = JSON.parse(webStorage.walks) as CardioWalkLog[];
      return date ? list.filter((w) => w.date === date) : list;
    }
    try {
      const db = getDb();
      if (date) {
        const rows = db.getAllSync<CardioWalkLog>(
          'SELECT id, date, durationMinutes, distanceKm, notes, completed FROM walk_logs WHERE date = ? ORDER BY id DESC',
          [date]
        );
        return rows.map((r) => ({ ...r, completed: Boolean(r.completed) }));
      } else {
        const rows = db.getAllSync<CardioWalkLog>(
          'SELECT id, date, durationMinutes, distanceKm, notes, completed FROM walk_logs ORDER BY date DESC, id DESC LIMIT 30'
        );
        return rows.map((r) => ({ ...r, completed: Boolean(r.completed) }));
      }
    } catch {
      return [];
    }
  },

  saveWalkLog(log: CardioWalkLog): void {
    if (Platform.OS === 'web') {
      const list = JSON.parse(webStorage.walks) as CardioWalkLog[];
      list.unshift(log);
      webStorage.walks = JSON.stringify(list);
      return;
    }
    try {
      const db = getDb();
      db.runSync(
        'INSERT OR REPLACE INTO walk_logs (id, date, durationMinutes, distanceKm, notes, completed) VALUES (?, ?, ?, ?, ?, ?)',
        [log.id, log.date, log.durationMinutes, log.distanceKm || null, log.notes || '', log.completed ? 1 : 0]
      );
    } catch (err) {
      console.error('Failed to save walk log:', err);
    }
  },

  // CARDIO - RUNS
  getRunLogs(): CardioRunLog[] {
    if (Platform.OS === 'web') {
      return JSON.parse(webStorage.runs);
    }
    try {
      const db = getDb();
      const rows = db.getAllSync<CardioRunLog>(
        'SELECT id, date, distanceKm, durationMinutes, paceMinutesPerKm, type, notes FROM run_logs ORDER BY date DESC, id DESC'
      );
      return rows;
    } catch {
      return [];
    }
  },

  saveRunLog(log: CardioRunLog): void {
    if (Platform.OS === 'web') {
      const list = JSON.parse(webStorage.runs) as CardioRunLog[];
      list.unshift(log);
      webStorage.runs = JSON.stringify(list);
      return;
    }
    try {
      const db = getDb();
      db.runSync(
        'INSERT OR REPLACE INTO run_logs (id, date, distanceKm, durationMinutes, paceMinutesPerKm, type, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [log.id, log.date, log.distanceKm, log.durationMinutes, log.paceMinutesPerKm, log.type, log.notes || '']
      );
    } catch (err) {
      console.error('Failed to save run log:', err);
    }
  },

  // NUTRITION
  getNutritionLogs(date: string): NutritionLogItem[] {
    if (Platform.OS === 'web') {
      const list = JSON.parse(webStorage.nutrition) as NutritionLogItem[];
      return list.filter((n) => n.date === date);
    }
    try {
      const db = getDb();
      const rows = db.getAllSync<NutritionLogItem>(
        'SELECT id, date, mealType, foodName, quantity, calories, protein, carbs, fat FROM nutrition_logs WHERE date = ? ORDER BY id ASC',
        [date]
      );
      return rows;
    } catch {
      return [];
    }
  },

  saveNutritionLog(item: NutritionLogItem): void {
    if (Platform.OS === 'web') {
      const list = JSON.parse(webStorage.nutrition) as NutritionLogItem[];
      list.push(item);
      webStorage.nutrition = JSON.stringify(list);
      return;
    }
    try {
      const db = getDb();
      db.runSync(
        'INSERT OR REPLACE INTO nutrition_logs (id, date, mealType, foodName, quantity, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [item.id, item.date, item.mealType, item.foodName, item.quantity, item.calories, item.protein, item.carbs, item.fat]
      );
    } catch (err) {
      console.error('Failed to save nutrition log:', err);
    }
  },

  deleteNutritionLog(id: string): void {
    if (Platform.OS === 'web') {
      const list = (JSON.parse(webStorage.nutrition) as NutritionLogItem[]).filter((n) => n.id !== id);
      webStorage.nutrition = JSON.stringify(list);
      return;
    }
    try {
      const db = getDb();
      db.runSync('DELETE FROM nutrition_logs WHERE id = ?', [id]);
    } catch (err) {
      console.error('Failed to delete nutrition log:', err);
    }
  },

  // MEASUREMENTS
  getMeasurements(): BodyMeasurement[] {
    if (Platform.OS === 'web') {
      return JSON.parse(webStorage.measurements);
    }
    try {
      const db = getDb();
      const rows = db.getAllSync<BodyMeasurement>(
        'SELECT id, date, weightKg, heightCm, waistCm, chestCm, armsCm, shouldersCm, thighsCm, notes, photoUrl, photoPose FROM measurements ORDER BY date DESC, id DESC'
      );
      return rows;
    } catch {
      return initialMeasurements;
    }
  },

  saveMeasurement(m: BodyMeasurement): void {
    if (Platform.OS === 'web') {
      const list = JSON.parse(webStorage.measurements) as BodyMeasurement[];
      const idx = list.findIndex((item) => item.id === m.id);
      if (idx >= 0) list[idx] = m;
      else list.unshift(m);
      webStorage.measurements = JSON.stringify(list);
      return;
    }
    try {
      const db = getDb();
      db.runSync(
        'INSERT OR REPLACE INTO measurements (id, date, weightKg, heightCm, waistCm, chestCm, armsCm, shouldersCm, thighsCm, notes, photoUrl, photoPose) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          m.id,
          m.date,
          m.weightKg,
          m.heightCm,
          m.waistCm || null,
          m.chestCm || null,
          m.armsCm || null,
          m.shouldersCm || null,
          m.thighsCm || null,
          m.notes || '',
          m.photoUrl || null,
          m.photoPose || null,
        ]
      );
    } catch (err) {
      console.error('Failed to save measurement:', err);
    }
  },

  deleteMeasurement(id: string): void {
    if (Platform.OS === 'web') {
      const list = (JSON.parse(webStorage.measurements) as BodyMeasurement[]).filter((m) => m.id !== id);
      webStorage.measurements = JSON.stringify(list);
      return;
    }
    try {
      const db = getDb();
      db.runSync('DELETE FROM measurements WHERE id = ?', [id]);
    } catch (err) {
      console.error('Failed to delete measurement:', err);
    }
  },

  // 30-DAY CHALLENGE
  getChallengeDays(): number[] {
    if (Platform.OS === 'web') {
      return JSON.parse(webStorage.challenge);
    }
    try {
      const db = getDb();
      const rows = db.getAllSync<{ dayNumber: number }>('SELECT dayNumber FROM challenge_days ORDER BY dayNumber ASC');
      return rows.map((r) => r.dayNumber);
    } catch {
      return [];
    }
  },

  toggleChallengeDay(dayNumber: number): boolean {
    const completedDays = this.getChallengeDays();
    const isCompleted = completedDays.includes(dayNumber);

    if (Platform.OS === 'web') {
      let updated: number[];
      if (isCompleted) {
        updated = completedDays.filter((d) => d !== dayNumber);
      } else {
        updated = [...completedDays, dayNumber];
      }
      webStorage.challenge = JSON.stringify(updated);
      return !isCompleted;
    }

    try {
      const db = getDb();
      if (isCompleted) {
        db.runSync('DELETE FROM challenge_days WHERE dayNumber = ?', [dayNumber]);
        return false;
      } else {
        db.runSync('INSERT INTO challenge_days (dayNumber, completedAt) VALUES (?, ?)', [
          dayNumber,
          new Date().toISOString(),
        ]);
        return true;
      }
    } catch (err) {
      console.error('Failed to toggle challenge day:', err);
      return isCompleted;
    }
  },

  // RESET DATABASE
  resetDatabase(): void {
    if (Platform.OS === 'web') {
      webStorage.profile = JSON.stringify(initialProfile);
      webStorage.program = JSON.stringify(initialWorkoutProgram);
      webStorage.exercises = JSON.stringify(initialExercises);
      webStorage.history = JSON.stringify(seedWorkoutHistory);
      webStorage.measurements = JSON.stringify(initialMeasurements);
      webStorage.walks = '[]';
      webStorage.runs = '[]';
      webStorage.nutrition = '[]';
      webStorage.habits = '{}';
      webStorage.challenge = '[]';
      webStorage.activeSession = 'null';
      return;
    }

    try {
      const db = getDb();
      db.execSync(`
        DELETE FROM profile;
        DELETE FROM program;
        DELETE FROM exercises;
        DELETE FROM workout_history;
        DELETE FROM active_session;
        DELETE FROM walk_logs;
        DELETE FROM run_logs;
        DELETE FROM nutrition_logs;
        DELETE FROM daily_habits;
        DELETE FROM measurements;
        DELETE FROM challenge_days;
      `);
      this.init();
    } catch (err) {
      console.error('Failed to reset database:', err);
    }
  },

  // EXPORT / IMPORT
  exportBackup(): string {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      program: this.getProgram(),
      exercises: this.getExercises(),
      history: this.getWorkoutHistory(),
      measurements: this.getMeasurements(),
      walks: this.getWalkLogs(),
      runs: this.getRunLogs(),
      challenge: this.getChallengeDays(),
    };
    return JSON.stringify(backup, null, 2);
  },
};
