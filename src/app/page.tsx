'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  CheckCircle2,
  Calendar,
  Flame,
  Dumbbell,
  Scale,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import {
  UserProfile,
  WorkoutProgramDay,
  ActiveWorkoutSession,
  DailyHabitLog,
  WorkoutHistoryItem,
  BodyMeasurement,
} from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile>(StorageService.getProfile());
  const [program, setProgram] = useState<WorkoutProgramDay[]>(StorageService.getProgram());
  const [activeSession, setActiveSession] = useState<ActiveWorkoutSession | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [todayDateStr, setTodayDateStr] = useState<string>('2026-11-18');
  const [todayHabit, setTodayHabit] = useState<DailyHabitLog>({
    date: '2026-11-18',
    workoutCompleted: false,
    walkCompleted: false,
    runCompleted: false,
    proteinMet: false,
    balancedMeals: false,
    hydrated: false,
    sleptWell: false,
    supplementsTaken: false,
    mobilityCompleted: false,
  });
  const [selectedDayName, setSelectedDayName] = useState<string>('Monday');
  const [todayWalkMinutes, setTodayWalkMinutes] = useState(30);
  const [past7Days, setPast7Days] = useState<string[]>([]);
  const [greeting, setGreeting] = useState('Welcome');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayDateStr(today);

    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');

    const past = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    setPast7Days(past);

    const loadData = () => {
      setProfile(StorageService.getProfile());
      setProgram(StorageService.getProgram());
      setActiveSession(StorageService.getActiveSession());
      setHistory(StorageService.getHistory());
      setMeasurements(StorageService.getMeasurements());
      setTodayHabit(StorageService.getHabitForDate(today));

      // Determine today's day of week
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDayOfWeek = dayNames[new Date().getDay()];
      setSelectedDayName(todayDayOfWeek);

      // Check walk logs for today
      const walks = StorageService.getWalks();
      const todayWalk = walks.find((w) => w.date === today);
      if (todayWalk) {
        setTodayWalkMinutes(todayWalk.durationMinutes);
      }
    };

    loadData();
    window.addEventListener('aesthetic-storage-update', loadData);
    return () => window.removeEventListener('aesthetic-storage-update', loadData);
  }, []);

  // Today's workout program day
  const todayProgramDay = program.find((p) => p.dayOfWeek === selectedDayName) || program[0];

  // Calculate weekly completion
  const workoutsThisWeek = history.filter((h) => past7Days.includes(h.date)).length;
  const weeklyWorkoutTarget = 5;
  const weeklyCompletionRate = Math.min(Math.round((workoutsThisWeek / weeklyWorkoutTarget) * 100), 100);

  // Total weekly volume
  const weeklyVolume = history
    .filter((h) => past7Days.includes(h.date))
    .reduce((acc, curr) => acc + curr.totalVolumeKg, 0);

  // Toggle habit checkbox
  const toggleHabit = (field: keyof DailyHabitLog) => {
    const updated = {
      ...todayHabit,
      [field]: !todayHabit[field],
    };
    setTodayHabit(updated);
    StorageService.updateHabitForDate(todayDateStr, { [field]: !todayHabit[field] });
  };

  // Quick complete 30-min walk
  const markWalkCompleted = () => {
    StorageService.addWalk({
      id: `w-${Date.now()}`,
      date: todayDateStr,
      durationMinutes: 30,
      distanceKm: 2.8,
      notes: 'Completed 30-minute daily target walk',
      completed: true,
    });
    toggleHabit('walkCompleted');
    setTodayWalkMinutes(30);
  };

  // Prepare weight chart data
  const weightChartData = measurements
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: m.weightKg,
      target: profile.targetWeightKg,
    }));

  // Check if today was already worked out
  const todayWorkedOut = history.some((h) => h.date === todayDateStr);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Greeting Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-850">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
            <span>Aesthetic Operating System</span>
            <span>•</span>
            <span className="text-emerald-500">5-Day Hypertrophy Plan</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50">
            {greeting}, {profile.name}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
            {profile.primaryGoal}. Sustainable progressive overload and healthy lean caloric surplus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/workout">
            <Button variant="primary" size="lg" className="shadow-lg">
              {activeSession && activeSession.status === 'active' ? (
                <>
                  <Play className="w-4 h-4 fill-current animate-pulse text-emerald-400" /> Resume Workout
                </>
              ) : todayWorkedOut ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Workout Logged Today
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Start Today&apos;s Workout
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. 7-Day Weekly Calendar Strip */}
      <div className="bg-neutral-50/70 dark:bg-[#0A0A0A] border border-neutral-200/70 dark:border-neutral-850 rounded-2xl p-3 md:p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Weekly Training Schedule</span>
          </div>
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 tabular-nums">
            {workoutsThisWeek} of 5 Sessions Done
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 md:gap-3">
          {program.map((day) => {
            const isToday = day.dayOfWeek === selectedDayName;
            const isRest = day.isRestDay;

            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayName(day.dayOfWeek)}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all border text-center ${
                  isToday
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-transparent shadow-sm'
                    : 'bg-white/80 dark:bg-neutral-900/60 border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-300 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-75">
                  {day.dayOfWeek.slice(0, 3)}
                </span>
                <span className="text-xs md:text-sm font-bold mt-0.5 truncate max-w-full">
                  {isRest ? 'Rest' : day.title.split('+')[0].trim()}
                </span>
                <div className="mt-1.5">
                  {isRest ? (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                  ) : (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Core Activity Rings & Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Workout Progress Card */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Weekly Workouts
              </span>
              <div className="text-2xl font-extrabold tracking-tight tabular-nums mt-1 text-neutral-950 dark:text-neutral-50">
                {workoutsThisWeek} <span className="text-xs font-normal text-neutral-400">/ 5 days</span>
              </div>
            </div>
            <ProgressRing progress={weeklyCompletionRate} size={48} strokeWidth={5} color="#10B981">
              <Dumbbell className="w-4 h-4 text-emerald-500" />
            </ProgressRing>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-between text-xs text-neutral-500">
            <span>Consistency:</span>
            <span className="font-semibold text-emerald-500">{weeklyCompletionRate}%</span>
          </div>
        </Card>

        {/* Daily Walk Progress Card */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Daily Walking
              </span>
              <div className="text-2xl font-extrabold tracking-tight tabular-nums mt-1 text-neutral-950 dark:text-neutral-50">
                {todayWalkMinutes}{' '}
                <span className="text-xs font-normal text-neutral-400">/ 30 min</span>
              </div>
            </div>
            <ProgressRing
              progress={Math.min((todayWalkMinutes / 30) * 100, 100)}
              size={48}
              strokeWidth={5}
              color="#10B981"
            >
              <Flame className="w-4 h-4 text-emerald-500" />
            </ProgressRing>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-between text-xs">
            {todayWalkMinutes >= 30 ? (
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Target Achieved
              </span>
            ) : (
              <button
                onClick={markWalkCompleted}
                className="text-xs font-semibold text-neutral-900 dark:text-white hover:underline cursor-pointer"
              >
                Log 30m Walk
              </button>
            )}
            <Link href="/cardio" className="text-neutral-400 hover:text-neutral-600 text-xs">
              View →
            </Link>
          </div>
        </Card>

        {/* Current Body Weight Card */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Body Weight
              </span>
              <div className="text-2xl font-extrabold tracking-tight tabular-nums mt-1 text-neutral-950 dark:text-neutral-50">
                {profile.currentWeightKg}{' '}
                <span className="text-xs font-normal text-neutral-400">kg</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Scale className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-between text-xs text-neutral-500">
            <span>Target Goal:</span>
            <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
              {profile.targetWeightKg} kg (+10kg lean)
            </span>
          </div>
        </Card>

        {/* Weekly Volume Card */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Weekly Volume
              </span>
              <div className="text-2xl font-extrabold tracking-tight tabular-nums mt-1 text-neutral-950 dark:text-neutral-50">
                {weeklyVolume.toLocaleString()}{' '}
                <span className="text-xs font-normal text-neutral-400">kg</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-850 flex items-center justify-between text-xs text-neutral-500">
            <span>Progression:</span>
            <span className="font-semibold text-emerald-500">+8.5% overload</span>
          </div>
        </Card>
      </div>

      {/* 4. Today's Workout Detail Card & Weight Progression Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workout Preview (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={todayProgramDay.isRestDay ? 'neutral' : 'success'}>
                    {todayProgramDay.dayOfWeek}
                  </Badge>
                  {todayWorkedOut && <Badge variant="success">Completed Today</Badge>}
                </div>
                <CardTitle className="text-xl mt-2">{todayProgramDay.title}</CardTitle>
                <CardDescription>{todayProgramDay.focus}</CardDescription>
              </div>

              <Link href="/workout">
                <Button variant="primary" size="sm">
                  {todayProgramDay.isRestDay ? 'View Recovery' : 'Start Session'}
                </Button>
              </Link>
            </CardHeader>

            <CardContent>
              {todayProgramDay.isRestDay ? (
                <div className="space-y-3 py-2">
                  <div className="p-4 rounded-xl bg-neutral-100/60 dark:bg-neutral-850/60 text-xs text-neutral-600 dark:text-neutral-300 space-y-2">
                    <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" /> Active Recovery Guidance
                    </div>
                    <p>
                      Muscles grow during rest when muscle protein synthesis exceeds breakdown. Today&apos;s goal is blood flow without fatigue.
                    </p>
                    <ul className="list-disc list-inside space-y-1 pt-1">
                      {todayProgramDay.recoveryActivities?.map((act, idx) => (
                        <li key={idx}>{act}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    Planned Exercises ({todayProgramDay.exercises.length})
                  </div>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
                    {todayProgramDay.exercises.map((ex, idx) => (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between text-sm hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center text-xs font-semibold tabular-nums">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {ex.name}
                            </div>
                            {ex.notes && (
                              <div className="text-xs text-neutral-400 dark:text-neutral-500">
                                {ex.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 tabular-nums bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                          {ex.targetSets} sets × {ex.targetReps}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Educational Callout: Spot Reduction Myth Buster */}
          <div className="p-4 rounded-2xl bg-neutral-100/50 dark:bg-[#0A0A0A] border border-neutral-200/60 dark:border-neutral-850 flex items-start gap-3.5">
            <ShieldAlert className="w-5 h-5 text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                Fitness Philosophy & Biological Realities
              </span>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Spot reduction (targeting facial fat or belly fat loss directly) is biologically impossible. Fat loss occurs systemically when overall body fat changes. At 55 kg and 175 cm, your objective is <strong>gradual muscle hypertrophy</strong> and healthy lean mass accretion with a small caloric surplus, not an aggressive deficit or extreme dehydration.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Weight Trend & Daily Habits */}
        <div className="space-y-4">
          {/* Weight Chart Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Weight Progression</CardTitle>
                <Link href="/progress" className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                  Detailed →
                </Link>
              </div>
              <CardDescription>
                Target: {profile.targetWeightKg} kg (Long-term lean bulking)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-44 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightChartData}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[54, 58]}
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit="kg"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#121212',
                        borderColor: '#262626',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#FFF',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#weightGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 flex justify-between items-center">
                <span>Start: 55.0 kg</span>
                <span className="font-semibold text-emerald-500">Current: {profile.currentWeightKg} kg</span>
                <span>Goal: {profile.targetWeightKg} kg</span>
              </div>
            </CardContent>
          </Card>

          {/* Daily Habits Quick Checklist */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Daily Habits</CardTitle>
                <span className="text-xs font-semibold text-emerald-500 tabular-nums">
                  {
                    [
                      todayHabit.workoutCompleted,
                      todayHabit.walkCompleted,
                      todayHabit.proteinMet,
                      todayHabit.balancedMeals,
                      todayHabit.hydrated,
                      todayHabit.sleptWell,
                      todayHabit.supplementsTaken,
                      todayHabit.mobilityCompleted,
                    ].filter(Boolean).length
                  }{' '}
                  / 8 Complete
                </span>
              </div>
              <CardDescription>Sustainable consistency without punitive resets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: 'Completed Workout', key: 'workoutCompleted' },
                  { label: '30-Minute Walk', key: 'walkCompleted' },
                  { label: 'Met Protein Target (95g)', key: 'proteinMet' },
                  { label: 'Ate Balanced Meals', key: 'balancedMeals' },
                  { label: 'Maintained Hydration (3L)', key: 'hydrated' },
                  { label: 'Slept 7–9 Hours', key: 'sleptWell' },
                  { label: 'Took Creatine (5g)', key: 'supplementsTaken' },
                  { label: 'Recovery / Mobility', key: 'mobilityCompleted' },
                ].map((habit) => {
                  const isChecked = !!todayHabit[habit.key as keyof DailyHabitLog];
                  return (
                    <div
                      key={habit.key}
                      onClick={() => toggleHabit(habit.key as keyof DailyHabitLog)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer transition-colors text-xs"
                    >
                      <span className={isChecked ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-500'}>
                        {habit.label}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 30-Day Challenge Banner Card */}
          <Link href="/challenge" className="block">
            <div className="p-4 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-850 dark:text-neutral-100 hover:bg-neutral-800 transition-colors flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Active Challenge
                  </div>
                  <div className="text-sm font-bold">30-Day Aesthetic Foundation</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
