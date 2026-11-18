'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Check,
  Info,
  ArrowRightLeft,
  SkipForward,
  Timer,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import {
  WorkoutProgramDay,
  ActiveWorkoutSession,
  ActiveExercise,
  ActiveSet,
  Exercise,
  WorkoutHistoryItem,
  HistoryExerciseSummary,
} from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { RestTimer } from '@/components/ui/RestTimer';
import { fireWorkoutCelebration } from '@/lib/confetti';
import { initialWorkoutProgram, initialExercises } from '@/lib/initialData';

export default function WorkoutPage() {
  const [program, setProgram] = useState<WorkoutProgramDay[]>(initialWorkoutProgram);
  const [exercisesLibrary, setExercisesLibrary] = useState<Exercise[]>(initialExercises);
  const [activeSession, setActiveSession] = useState<ActiveWorkoutSession | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>('monday');

  // Rest Timer State
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration] = useState(90);

  // Exercise Instruction Modal State
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

  // Replace Exercise Modal State
  const [replacingExerciseIndex, setReplacingExerciseIndex] = useState<number | null>(null);

  // Finish Workout Modal State
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishNotes, setFinishNotes] = useState('');

  // Add Exercise to Program Modal State
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);

  // Timer interval for elapsed time
  useEffect(() => {
    const load = () => {
      setProgram(StorageService.getProgram());
      setExercisesLibrary(StorageService.getExercises());
      setActiveSession(StorageService.getActiveSession());
      setHistory(StorageService.getHistory());
    };
    load();

    window.addEventListener('aesthetic-storage-update', load);
    return () => window.removeEventListener('aesthetic-storage-update', load);
  }, []);

  const isSessionActive = Boolean(activeSession && activeSession.status === 'active' && !activeSession.isPaused);

  // Sync elapsed time ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSessionActive) {
      interval = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev) return null;
          const updated = { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
          StorageService.saveActiveSession(updated);
          return updated;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive]);

  // Selected day in program
  const currentProgramDay = program.find((p) => p.id === selectedDayId) || initialWorkoutProgram[0];

  // Lookup previous weights for an exercise from history
  const getPreviousPerformance = (exerciseId: string) => {
    for (const h of history) {
      const match = h.exercises.find((e) => e.exerciseId === exerciseId);
      if (match && match.sets.length > 0) {
        return match.sets.map((s, idx) => `Set ${idx + 1}: ${s.weightKg} kg × ${s.reps}`).join(' | ');
      }
    }
    return 'First session with this movement';
  };

  // Start Workout
  const handleStartWorkout = (day: WorkoutProgramDay) => {
    if (day.isRestDay) return;

    // Convert program exercises to active session exercises
    const sessionExercises: ActiveExercise[] = day.exercises.map((pEx) => {
      // Find previous weight if available
      let defaultWeight = 12;
      for (const h of history) {
        const match = h.exercises.find((e) => e.exerciseId === pEx.exerciseId);
        if (match && match.sets[0]?.weightKg) {
          defaultWeight = match.sets[0].weightKg;
          break;
        }
      }

      // Parse target reps range for default reps (e.g. "6-10" -> 8)
      const targetRepsNum = parseInt(pEx.targetReps.split('–')[0].split('-')[0]) || 10;

      const sets: ActiveSet[] = Array.from({ length: pEx.targetSets }, (_, i) => ({
        setNumber: i + 1,
        weightKg: defaultWeight,
        reps: targetRepsNum,
        rir: 2,
        completed: false,
      }));

      return {
        exerciseId: pEx.exerciseId,
        name: pEx.name,
        targetSets: pEx.targetSets,
        targetReps: pEx.targetReps,
        sets,
        notes: pEx.notes || '',
        skipped: false,
      };
    });

    const newSession: ActiveWorkoutSession = {
      id: `session-${Date.now()}`,
      dayId: day.id,
      title: `${day.dayOfWeek}: ${day.title}`,
      startTime: Date.now(),
      elapsedSeconds: 0,
      isPaused: false,
      status: 'active',
      exercises: sessionExercises,
    };

    StorageService.saveActiveSession(newSession);
    setActiveSession(newSession);
  };

  // Toggle pause
  const togglePause = () => {
    if (!activeSession) return;
    const updated: ActiveWorkoutSession = {
      ...activeSession,
      isPaused: !activeSession.isPaused,
    };
    StorageService.saveActiveSession(updated);
    setActiveSession(updated);
  };

  // Update a set
  const updateSet = (exerciseIndex: number, setIndex: number, partial: Partial<ActiveSet>) => {
    if (!activeSession) return;
    const exercises = [...activeSession.exercises];
    const sets = [...exercises[exerciseIndex].sets];

    const wasCompleted = sets[setIndex].completed;
    sets[setIndex] = { ...sets[setIndex], ...partial };
    exercises[exerciseIndex].sets = sets;

    const updated = { ...activeSession, exercises };
    StorageService.saveActiveSession(updated);
    setActiveSession(updated);

    // Auto-trigger rest timer if set was newly marked completed
    if (!wasCompleted && partial.completed) {
      setShowRestTimer(true);
    }
  };

  // Add set
  const addSet = (exerciseIndex: number) => {
    if (!activeSession) return;
    const exercises = [...activeSession.exercises];
    const currentSets = exercises[exerciseIndex].sets;
    const lastSet = currentSets[currentSets.length - 1];

    const newSet: ActiveSet = {
      setNumber: currentSets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : 12,
      reps: lastSet ? lastSet.reps : 10,
      rir: 2,
      completed: false,
    };

    exercises[exerciseIndex].sets = [...currentSets, newSet];
    const updated = { ...activeSession, exercises };
    StorageService.saveActiveSession(updated);
    setActiveSession(updated);
  };

  // Remove set
  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (!activeSession) return;
    const exercises = [...activeSession.exercises];
    const filtered = exercises[exerciseIndex].sets
      .filter((_, idx) => idx !== setIndex)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 }));

    exercises[exerciseIndex].sets = filtered;
    const updated = { ...activeSession, exercises };
    StorageService.saveActiveSession(updated);
    setActiveSession(updated);
  };

  // Toggle skip exercise
  const toggleSkipExercise = (exerciseIndex: number) => {
    if (!activeSession) return;
    const exercises = [...activeSession.exercises];
    exercises[exerciseIndex].skipped = !exercises[exerciseIndex].skipped;
    const updated = { ...activeSession, exercises };
    StorageService.saveActiveSession(updated);
    setActiveSession(updated);
  };

  // Replace exercise
  const handleReplaceExercise = (exerciseIndex: number, newExercise: Exercise) => {
    if (!activeSession) return;
    const exercises = [...activeSession.exercises];
    const targetSets = exercises[exerciseIndex].targetSets;

    exercises[exerciseIndex] = {
      ...exercises[exerciseIndex],
      exerciseId: newExercise.id,
      name: newExercise.name,
      targetReps: newExercise.defaultReps,
      sets: Array.from({ length: targetSets }, (_, i) => ({
        setNumber: i + 1,
        weightKg: 10,
        reps: 10,
        rir: 2,
        completed: false,
      })),
      replacedWithId: newExercise.id,
    };

    const updated = { ...activeSession, exercises };
    StorageService.saveActiveSession(updated);
    setActiveSession(updated);
    setReplacingExerciseIndex(null);
  };

  // Finish Workout
  const handleFinishWorkout = () => {
    if (!activeSession) return;

    let totalVolume = 0;
    let completedSetsCount = 0;
    const historyExercises: HistoryExerciseSummary[] = [];

    activeSession.exercises.forEach((ex) => {
      if (ex.skipped) return;
      const doneSets = ex.sets.filter((s) => s.completed);
      if (doneSets.length === 0) return;

      completedSetsCount += doneSets.length;
      const exVolume = doneSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
      totalVolume += exVolume;

      const topWeight = Math.max(...doneSets.map((s) => s.weightKg), 0);
      const totalReps = doneSets.reduce((sum, s) => sum + s.reps, 0);

      historyExercises.push({
        exerciseId: ex.exerciseId,
        name: ex.name,
        sets: doneSets.map((s) => ({
          weightKg: s.weightKg,
          reps: s.reps,
          rir: s.rir,
          completed: true,
        })),
        topWeightKg: topWeight,
        totalVolumeKg: exVolume,
        totalReps,
      });
    });

    const newHistoryItem: WorkoutHistoryItem = {
      id: `hist-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      dayTitle: activeSession.title,
      durationMinutes: Math.max(Math.round(activeSession.elapsedSeconds / 60), 1),
      totalVolumeKg: totalVolume,
      setsCompleted: completedSetsCount,
      exercises: historyExercises,
      notes: finishNotes || activeSession.notes,
    };

    // Save to history & habits
    StorageService.addWorkoutToHistory(newHistoryItem);
    StorageService.updateHabitForDate(newHistoryItem.date, { workoutCompleted: true });
    StorageService.clearActiveSession();

    // Trigger celebration
    fireWorkoutCelebration();

    setActiveSession(null);
    setShowFinishModal(false);
    setFinishNotes('');
  };

  // Discard workout
  const handleDiscardWorkout = () => {
    if (confirm('Are you sure you want to discard this workout session? Data will not be saved.')) {
      StorageService.clearActiveSession();
      setActiveSession(null);
    }
  };

  // Format seconds to mm:ss
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // High volume notice check (if exercise count > 9)
  const isHighVolumeDay = Boolean(currentProgramDay?.exercises && currentProgramDay.exercises.length > 9);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* REST TIMER (Floating or Docked) */}
      <RestTimer
        isOpen={showRestTimer}
        initialSeconds={restDuration}
        onClose={() => setShowRestTimer(false)}
      />

      {/* ============================================================== */}
      {/* ACTIVE WORKOUT MODE (GYM SESSION)                              */}
      {/* ============================================================== */}
      {activeSession && activeSession.status === 'active' ? (
        <div className="space-y-6">
          {/* Gym Session Sticky Top Bar */}
          <div className="bg-neutral-900 text-white dark:bg-[#121212] border border-neutral-800 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-20 backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">
                  Gym Mode Active
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5">
                {activeSession.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-neutral-800 dark:bg-neutral-850 px-3.5 py-2 rounded-xl text-sm font-semibold tabular-nums border border-neutral-700 dark:border-neutral-800">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span>{formatSeconds(activeSession.elapsedSeconds)}</span>
              </div>

              <Button
                variant="subtle"
                size="md"
                onClick={() => setShowRestTimer(true)}
                className="hidden sm:inline-flex"
              >
                <Timer className="w-4 h-4 text-emerald-400" /> Rest Timer
              </Button>

              <Button variant="subtle" size="md" onClick={togglePause}>
                {activeSession.isPaused ? (
                  <>
                    <Play className="w-4 h-4" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                )}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => setShowFinishModal(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Check className="w-4 h-4" /> Finish
              </Button>
            </div>
          </div>

          {/* Exercise Logging Cards */}
          <div className="space-y-6">
            {activeSession.exercises.map((ex, exIdx) => {
              const fullEx = exercisesLibrary.find((e) => e.id === ex.exerciseId);

              return (
                <Card
                  key={exIdx}
                  className={ex.skipped ? 'opacity-40 border-dashed' : 'border-neutral-200 dark:border-neutral-850'}
                >
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center justify-center tabular-nums">
                          {exIdx + 1}
                        </span>
                        <CardTitle className="text-lg">{ex.name}</CardTitle>
                        {ex.skipped && <Badge variant="neutral">Skipped</Badge>}
                      </div>
                      <CardDescription className="mt-1">
                        Target: {ex.targetSets} sets × {ex.targetReps}
                        {ex.notes && ` • Note: ${ex.notes}`}
                      </CardDescription>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                        Previous best: {getPreviousPerformance(ex.exerciseId)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {fullEx && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingExercise(fullEx)}
                          title="View technique instructions"
                        >
                          <Info className="w-3.5 h-3.5" /> Guide
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplacingExerciseIndex(exIdx)}
                        title="Replace with alternative exercise"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Replace
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSkipExercise(exIdx)}
                        title="Skip exercise"
                      >
                        <SkipForward className="w-3.5 h-3.5" /> {ex.skipped ? 'Unskip' : 'Skip'}
                      </Button>
                    </div>
                  </CardHeader>

                  {!ex.skipped && (
                    <CardContent className="space-y-4 pt-2">
                      {/* Sets Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-100 dark:border-neutral-850 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                              <th className="py-2 px-1 w-12 text-center">Set</th>
                              <th className="py-2 px-2">Weight (kg)</th>
                              <th className="py-2 px-2">Reps</th>
                              <th className="py-2 px-2">RIR</th>
                              <th className="py-2 px-2 text-center w-14">Done</th>
                              <th className="py-2 px-1 w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
                            {ex.sets.map((set, setIdx) => (
                              <tr
                                key={setIdx}
                                className={`transition-colors ${
                                  set.completed
                                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10'
                                    : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50'
                                }`}
                              >
                                {/* Set number */}
                                <td className="py-2.5 px-1 text-center font-bold text-xs text-neutral-500 tabular-nums">
                                  {set.setNumber}
                                </td>

                                {/* Weight Input with Quick +/- */}
                                <td className="py-2.5 px-2">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        updateSet(exIdx, setIdx, {
                                          weightKg: Math.max(0, Number((set.weightKg - 1).toFixed(1))),
                                        })
                                      }
                                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center text-xs font-bold hover:bg-neutral-200"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={set.weightKg}
                                      onChange={(e) =>
                                        updateSet(exIdx, setIdx, { weightKg: parseFloat(e.target.value) || 0 })
                                      }
                                      className="w-16 h-8 text-center text-sm font-semibold rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                    />
                                    <button
                                      onClick={() =>
                                        updateSet(exIdx, setIdx, {
                                          weightKg: Number((set.weightKg + 1).toFixed(1)),
                                        })
                                      }
                                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center text-xs font-bold hover:bg-neutral-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* Reps Input with Quick +/- */}
                                <td className="py-2.5 px-2">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        updateSet(exIdx, setIdx, {
                                          reps: Math.max(0, set.reps - 1),
                                        })
                                      }
                                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center text-xs font-bold hover:bg-neutral-200"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={set.reps}
                                      onChange={(e) =>
                                        updateSet(exIdx, setIdx, { reps: parseInt(e.target.value) || 0 })
                                      }
                                      className="w-14 h-8 text-center text-sm font-semibold rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 tabular-nums focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                    />
                                    <button
                                      onClick={() =>
                                        updateSet(exIdx, setIdx, {
                                          reps: set.reps + 1,
                                        })
                                      }
                                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center text-xs font-bold hover:bg-neutral-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* RIR Selector */}
                                <td className="py-2.5 px-2">
                                  <select
                                    value={set.rir}
                                    onChange={(e) =>
                                      updateSet(exIdx, setIdx, { rir: parseInt(e.target.value) })
                                    }
                                    className="h-8 px-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200"
                                  >
                                    <option value={0}>0 (Failure)</option>
                                    <option value={1}>1 RIR</option>
                                    <option value={2}>2 RIR</option>
                                    <option value={3}>3 RIR</option>
                                    <option value={4}>4+ RIR</option>
                                  </select>
                                </td>

                                {/* Set Done Checkbox */}
                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    onClick={() =>
                                      updateSet(exIdx, setIdx, { completed: !set.completed })
                                    }
                                    className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                                      set.completed
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                        : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-500'
                                    }`}
                                  >
                                    {set.completed && <Check className="w-4 h-4 stroke-[3]" />}
                                  </button>
                                </td>

                                {/* Delete Set */}
                                <td className="py-2.5 px-1 text-right">
                                  {ex.sets.length > 1 && (
                                    <button
                                      onClick={() => removeSet(exIdx, setIdx)}
                                      className="p-1 rounded text-neutral-400 hover:text-red-500"
                                      title="Remove set"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Add Set & Exercise Notes */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <Button
                          variant="subtle"
                          size="sm"
                          onClick={() => addSet(exIdx)}
                          className="self-start text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Set
                        </Button>

                        <input
                          type="text"
                          placeholder="Add exercise notes (form, adjustments)..."
                          value={ex.notes || ''}
                          onChange={(e) => {
                            if (!activeSession) return;
                            const exercises = [...activeSession.exercises];
                            exercises[exIdx].notes = e.target.value;
                            const updated = { ...activeSession, exercises };
                            StorageService.saveActiveSession(updated);
                            setActiveSession(updated);
                          }}
                          className="text-xs px-3 py-1.5 rounded-xl bg-neutral-100/60 dark:bg-neutral-850/60 border border-neutral-200/60 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none w-full sm:w-72"
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Bottom Discard & Finish Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-850">
            <Button variant="danger" size="md" onClick={handleDiscardWorkout}>
              Discard Workout
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowFinishModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Check className="w-5 h-5" /> Complete Workout Session
            </Button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* PROGRAM OVERVIEW / PROGRAM EDITOR MODE                         */
        /* ============================================================== */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-850">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                Weekly Training Programme
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 mt-1">
                Workout Architecture
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                5 strength days, 2 active recovery days. Fully editable sets, repetitions and movements.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={currentProgramDay.isRestDay}
              onClick={() => handleStartWorkout(currentProgramDay)}
              className="shadow-md"
            >
              {currentProgramDay.isRestDay ? (
                'Rest Day Scheduled'
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Start {currentProgramDay.dayOfWeek}&apos;s Workout
                </>
              )}
            </Button>
          </div>

          {/* Day Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {program.map((day) => {
              const isSelected = day.id === selectedDayId;
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent shadow-sm'
                      : 'bg-neutral-50/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {day.dayOfWeek}
                  {day.isRestDay && ' (Rest)'}
                </button>
              );
            })}
          </div>

          {/* High volume alert banner if applicable */}
          {isHighVolumeDay && !currentProgramDay.isRestDay && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">High Volume Fatigue Notice:</span> Today has {currentProgramDay.exercises.length} movements. As a returning beginner, if you experience central nervous system fatigue or joint stiffness, feel free to remove or reduce secondary isolation exercises. Consistent recovery drives hypertrophy.
              </div>
            </div>
          )}

          {/* Current Day Details Card */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={currentProgramDay.isRestDay ? 'neutral' : 'success'}>
                    {currentProgramDay.dayOfWeek}
                  </Badge>
                  <span className="text-xs text-neutral-400">
                    {currentProgramDay.exercises.length} Exercises
                  </span>
                </div>
                <CardTitle className="text-xl mt-2">{currentProgramDay.title}</CardTitle>
                <CardDescription>{currentProgramDay.focus}</CardDescription>
              </div>

              {!currentProgramDay.isRestDay && (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setShowAddExerciseModal(true)}
                  className="mt-2 sm:mt-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Exercise
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {currentProgramDay.isRestDay ? (
                <div className="p-6 rounded-2xl bg-neutral-100/50 dark:bg-neutral-850/50 space-y-4 text-center">
                  <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
                      Scheduled Active Recovery
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
                      No heavy weight lifting today. Active recovery enhances lymphatic drainage, reduces DOMS, and restores glycogen stores.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left max-w-lg mx-auto text-xs text-neutral-700 dark:text-neutral-300">
                    {currentProgramDay.recoveryActivities?.map((act, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
                  {currentProgramDay.exercises.map((ex, idx) => {
                    const fullEx = exercisesLibrary.find((e) => e.id === ex.exerciseId);

                    return (
                      <div
                        key={idx}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                              {ex.name}
                            </div>
                            <div className="text-xs text-neutral-400 dark:text-neutral-500">
                              {ex.notes || (fullEx ? `${fullEx.targetMuscle} • ${fullEx.equipment}` : '')}
                            </div>
                          </div>
                        </div>

                        {/* Editable Target Sets and Reps */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={ex.targetSets}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                const updatedProgram = program.map((p) => {
                                  if (p.id !== currentProgramDay.id) return p;
                                  const updatedEx = [...p.exercises];
                                  updatedEx[idx] = { ...updatedEx[idx], targetSets: val };
                                  return { ...p, exercises: updatedEx };
                                });
                                setProgram(updatedProgram);
                                StorageService.saveProgram(updatedProgram);
                              }}
                              className="w-10 h-7 text-center rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold tabular-nums"
                            />
                            <span>sets ×</span>
                            <input
                              type="text"
                              value={ex.targetReps}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updatedProgram = program.map((p) => {
                                  if (p.id !== currentProgramDay.id) return p;
                                  const updatedEx = [...p.exercises];
                                  updatedEx[idx] = { ...updatedEx[idx], targetReps: val };
                                  return { ...p, exercises: updatedEx };
                                });
                                setProgram(updatedProgram);
                                StorageService.saveProgram(updatedProgram);
                              }}
                              className="w-16 h-7 text-center rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold tabular-nums"
                            />
                          </div>

                          {fullEx && (
                            <button
                              onClick={() => setViewingExercise(fullEx)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              title="Technique & mistakes"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const updatedProgram = program.map((p) => {
                                if (p.id !== currentProgramDay.id) return p;
                                return {
                                  ...p,
                                  exercises: p.exercises.filter((_, i) => i !== idx),
                                };
                              });
                              setProgram(updatedProgram);
                              StorageService.saveProgram(updatedProgram);
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Remove exercise from program"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EXERCISE TECHNIQUE & INSTRUCTIONS                       */}
      {/* ============================================================== */}
      {viewingExercise && (
        <Modal
          isOpen={!!viewingExercise}
          onClose={() => setViewingExercise(null)}
          title={viewingExercise.name}
          description={`${viewingExercise.category} • ${viewingExercise.equipment} • Target: ${viewingExercise.targetMuscle}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs md:text-sm">
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                Step-by-Step Technique:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-neutral-600 dark:text-neutral-300">
                {viewingExercise.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div>
              <div className="font-semibold text-amber-600 dark:text-amber-400 mb-1.5">
                Common Mistakes to Avoid:
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-300">
                {viewingExercise.commonMistakes.map((mistake, i) => (
                  <li key={i}>{mistake}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                Targeted Muscles:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="success">Primary: {viewingExercise.targetMuscle}</Badge>
                {viewingExercise.secondaryMuscles.map((sm, i) => (
                  <Badge key={i} variant="neutral">
                    {sm}
                  </Badge>
                ))}
              </div>
            </div>

            {viewingExercise.substitutes.length > 0 && (
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                  Viable Substitutions:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {viewingExercise.substitutes.map((sub, i) => (
                    <Badge key={i} variant="outline">
                      {sub}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-neutral-100/60 dark:bg-neutral-850/60 text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Coaching Cue: </span>
              {viewingExercise.tips}
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL: REPLACE EXERCISE FROM LIBRARY                           */}
      {/* ============================================================== */}
      {replacingExerciseIndex !== null && (
        <Modal
          isOpen={replacingExerciseIndex !== null}
          onClose={() => setReplacingExerciseIndex(null)}
          title="Select Exercise Replacement"
          description="Choose an alternative movement from the verified exercise library"
          maxWidth="lg"
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {exercisesLibrary.map((ex) => (
              <div
                key={ex.id}
                onClick={() => handleReplaceExercise(replacingExerciseIndex, ex)}
                className="p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                    {ex.name}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {ex.category} • {ex.targetMuscle} • {ex.equipment}
                  </div>
                </div>
                <Button variant="subtle" size="sm">
                  Select
                </Button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD EXERCISE TO CURRENT PROGRAM DAY                     */}
      {/* ============================================================== */}
      {showAddExerciseModal && (
        <Modal
          isOpen={showAddExerciseModal}
          onClose={() => setShowAddExerciseModal(false)}
          title={`Add Exercise to ${currentProgramDay.dayOfWeek}`}
          description="Select an exercise from the library to include in this day's routine"
          maxWidth="lg"
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {exercisesLibrary.map((ex) => (
              <div
                key={ex.id}
                onClick={() => {
                  const updatedProgram = program.map((p) => {
                    if (p.id !== currentProgramDay.id) return p;
                    return {
                      ...p,
                      exercises: [
                        ...p.exercises,
                        {
                          exerciseId: ex.id,
                          name: ex.name,
                          targetSets: ex.defaultSets,
                          targetReps: ex.defaultReps,
                          notes: ex.tips,
                        },
                      ],
                    };
                  });
                  setProgram(updatedProgram);
                  StorageService.saveProgram(updatedProgram);
                  setShowAddExerciseModal(false);
                }}
                className="p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                    {ex.name}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {ex.category} • {ex.targetMuscle} • {ex.equipment}
                  </div>
                </div>
                <Button variant="subtle" size="sm">
                  Add to Routine
                </Button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL: FINISH WORKOUT SUMMARY                                  */}
      {/* ============================================================== */}
      {showFinishModal && activeSession && (
        <Modal
          isOpen={showFinishModal}
          onClose={() => setShowFinishModal(false)}
          title="Complete Workout Session"
          description="Review session statistics and save to workout history"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Duration</span>
                <span className="text-base font-bold tabular-nums">
                  {Math.round(activeSession.elapsedSeconds / 60)} min
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Sets Done</span>
                <span className="text-base font-bold tabular-nums">
                  {activeSession.exercises.reduce(
                    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
                    0
                  )}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <span className="text-[11px] text-neutral-400 block">Volume</span>
                <span className="text-base font-bold tabular-nums">
                  {activeSession.exercises
                    .reduce(
                      (acc, ex) =>
                        acc +
                        ex.sets
                          .filter((s) => s.completed)
                          .reduce((sAcc, s) => sAcc + s.weightKg * s.reps, 0),
                      0
                    )
                    .toLocaleString()}{' '}
                  kg
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Workout Session Notes
              </label>
              <textarea
                rows={3}
                placeholder="How did energy, pumps, and technique feel today?"
                value={finishNotes}
                onChange={(e) => setFinishNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" onClick={() => setShowFinishModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleFinishWorkout}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              >
                Save & Finish Session
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
