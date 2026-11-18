'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  CheckCircle2,
  Calendar,
  Flame,
  Dumbbell,
  Scale,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { UserProfile, WorkoutHistoryItem, BodyMeasurement } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { fireMilestoneCelebration } from '@/lib/confetti';

export default function ChallengePage() {
  const [profile, setProfile] = useState<UserProfile>(StorageService.getProfile());
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);

  useEffect(() => {
    const load = () => {
      setProfile(StorageService.getProfile());
      setCompletedDays(StorageService.getChallengeCompletedDays());
      setHistory(StorageService.getHistory());
      setMeasurements(StorageService.getMeasurements());
    };
    load();
    window.addEventListener('aesthetic-storage-update', load);
    return () => window.removeEventListener('aesthetic-storage-update', load);
  }, []);

  const totalDays = 30;
  const daysCompletedCount = completedDays.length;
  const challengeProgressPercent = Math.round((daysCompletedCount / totalDays) * 100);

  const toggleDay = (dayNum: number) => {
    StorageService.toggleChallengeDay(dayNum);
    const updated = StorageService.getChallengeCompletedDays();
    setCompletedDays(updated);

    // If milestone reached, fire celebratory particles!
    if ([1, 7, 15, 21, 30].includes(dayNum) && !completedDays.includes(dayNum)) {
      fireMilestoneCelebration();
    }
  };

  const milestones = [
    {
      day: 1,
      title: 'Day 1: Baseline Architecture',
      description: 'Record accurate baseline scale weight, upper chest, waist, and arms. Take private baseline posture photos.',
      achieved: completedDays.includes(1),
    },
    {
      day: 7,
      title: 'Day 7: First Weekly Calibration',
      description: 'Evaluate recovery fatigue, adjust gym working weights, and confirm 5/5 workout consistency.',
      achieved: completedDays.includes(7),
    },
    {
      day: 15,
      title: 'Day 15: Midpoint Progress Check-in',
      description: 'Verify lean mass gain (~0.5 kg up). Ensure waist circumference has remained narrow and firm.',
      achieved: completedDays.includes(15),
    },
    {
      day: 21,
      title: 'Day 21: Habit Lock-In Review',
      description: 'Neurological habit formation achieved. Daily 30m walking, 95g protein, and sound sleep automated.',
      achieved: completedDays.includes(21),
    },
    {
      day: 30,
      title: 'Day 30: Final Comparison & Celebration',
      description: 'Measure overall hypertrophy, compare side-by-side posture photographs, and plan Phase 2 progression.',
      achieved: completedDays.includes(30),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-850">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Transformation Roadmap
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 mt-1">
            30-Day Aesthetic Foundation
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Build consistency, master fundamental movement patterns, and kickstart clean muscular accretion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success" className="px-3 py-1 text-xs">
            {daysCompletedCount} of 30 Days Logged ({challengeProgressPercent}%)
          </Badge>
        </div>
      </div>

      {/* 1. Milestone Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 p-4">
          <ProgressRing progress={challengeProgressPercent} size={60} strokeWidth={6} color="#10B981">
            <Trophy className="w-5 h-5 text-emerald-500" />
          </ProgressRing>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Overall Completion</div>
            <div className="text-2xl font-extrabold tabular-nums text-neutral-900 dark:text-neutral-100">
              {challengeProgressPercent}%
            </div>
            <div className="text-[11px] text-emerald-500 font-semibold">
              {30 - daysCompletedCount} days to finale
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            <Dumbbell className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Workouts Completed</div>
            <div className="text-2xl font-extrabold tabular-nums text-neutral-900 dark:text-neutral-100">
              {history.length} <span className="text-xs font-normal text-neutral-400">sessions</span>
            </div>
            <div className="text-[11px] text-neutral-500">Progressive overload active</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Net Weight Trajectory</div>
            <div className="text-2xl font-extrabold tabular-nums text-neutral-900 dark:text-neutral-100">
              {profile.currentWeightKg} <span className="text-xs font-normal text-neutral-400">kg</span>
            </div>
            <div className="text-[11px] text-emerald-500 font-semibold">+0.8 kg lean increase</div>
          </div>
        </Card>
      </div>

      {/* 2. Key Milestones Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Journey Milestones</CardTitle>
          <CardDescription>
            Structured checkpoints to measure progressive overload and habit retention without false expectations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {milestones.map((m) => (
              <div
                key={m.day}
                onClick={() => toggleDay(m.day)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  m.achieved
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      m.achieved
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {m.achieved && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                      {m.title}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                </div>

                <Badge variant={m.achieved ? 'success' : 'neutral'} className="self-end sm:self-auto shrink-0">
                  {m.achieved ? 'Milestone Complete' : `Day ${m.day} Target`}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. 30-Day Check-in Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">30-Day Interactive Calendar</CardTitle>
            <CardDescription>Click any day to mark tasks complete for that day</CardDescription>
          </div>
          <span className="text-xs font-semibold text-neutral-400">
            {completedDays.length} / 30 Days
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
              const isDone = completedDays.includes(dayNum);
              const isMilestone = [1, 7, 15, 21, 30].includes(dayNum);

              return (
                <button
                  key={dayNum}
                  onClick={() => toggleDay(dayNum)}
                  className={`py-3 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                    isDone
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent shadow-sm'
                      : isMilestone
                      ? 'border-amber-500/40 bg-amber-500/5 text-neutral-800 dark:text-neutral-200 hover:border-amber-500'
                      : 'border-neutral-200/60 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <span className="tabular-nums">Day {dayNum}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isDone
                        ? 'bg-emerald-400 dark:bg-emerald-600'
                        : isMilestone
                        ? 'bg-amber-500'
                        : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. Expectation & Health Principle Banner */}
      <div className="p-4 rounded-2xl bg-neutral-100/50 dark:bg-[#0A0A0A] border border-neutral-200/60 dark:border-neutral-850 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            Expectation Management & Scientific Realism
          </span>
          <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
            In 30 days, biological transformations focus on neural adaptation, joint strengthening, glycogen uptake, and establishing lifelong daily habits. Do not expect miraculous 10 kg changes or localized facial fat reduction. Sustainable physique development takes months of deliberate repetition and proper recovery.
          </p>
        </div>
      </div>
    </div>
  );
}
