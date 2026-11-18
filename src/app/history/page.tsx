'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  Dumbbell,
  Clock,
  TrendingUp,
  Trophy,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { WorkoutHistoryItem, HistoryExerciseSummary } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function HistoryPage() {
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('All');
  const [viewingWorkout, setViewingWorkout] = useState<WorkoutHistoryItem | null>(null);

  useEffect(() => {
    const load = () => {
      setHistory(StorageService.getHistory());
    };
    load();
    window.addEventListener('aesthetic-storage-update', load);
    return () => window.removeEventListener('aesthetic-storage-update', load);
  }, []);

  // Filter history
  const filteredHistory = history.filter((w) => {
    const matchesSearch =
      w.dayTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.date.includes(searchQuery) ||
      w.exercises.some((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMuscle =
      selectedMuscleFilter === 'All' ||
      w.dayTitle.toLowerCase().includes(selectedMuscleFilter.toLowerCase());

    return matchesSearch && matchesMuscle;
  });

  // Calculate Personal Records across history
  const personalRecordsMap = new Map<string, { topWeight: number; date: string; name: string }>();

  history.forEach((h) => {
    h.exercises.forEach((ex) => {
      const existing = personalRecordsMap.get(ex.name);
      if (!existing || ex.topWeightKg > existing.topWeight) {
        personalRecordsMap.set(ex.name, {
          topWeight: ex.topWeightKg,
          date: h.date,
          name: ex.name,
        });
      }
    });
  });

  const topPersonalRecords = Array.from(personalRecordsMap.values())
    .sort((a, b) => b.topWeight - a.topWeight)
    .slice(0, 4);

  // Total Lifetime Volume
  const totalLifetimeVolume = history.reduce((sum, h) => sum + h.totalVolumeKg, 0);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this workout history log?')) {
      StorageService.deleteWorkoutFromHistory(id);
      if (viewingWorkout?.id === id) setViewingWorkout(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-850">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Training Ledger & Analytics
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 mt-1">
            Workout History
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Every session archived with exact sets, weights, repetitions, and calculated volume.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="px-3 py-1">
            {history.length} Sessions Logged
          </Badge>
        </div>
      </div>

      {/* 1. Personal Records & Total Volume Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between">
          <span className="text-xs text-neutral-500 font-medium">Lifetime Training Volume</span>
          <div className="text-2xl font-extrabold tabular-nums tracking-tight mt-1 text-neutral-900 dark:text-neutral-100">
            {totalLifetimeVolume.toLocaleString()}{' '}
            <span className="text-xs font-normal text-neutral-400">kg</span>
          </div>
          <div className="text-xs text-emerald-500 font-medium mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-850">
            Progressive overload confirmed
          </div>
        </Card>

        {topPersonalRecords.map((pr, idx) => (
          <Card key={idx} className="flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-medium truncate max-w-[140px]">
                {pr.name}
              </span>
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </div>
            <div className="text-xl font-bold tabular-nums tracking-tight mt-1 text-neutral-900 dark:text-neutral-100">
              {pr.topWeight} <span className="text-xs font-normal text-neutral-400">kg working PR</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-850">
              Achieved: {pr.date}
            </div>
          </Card>
        ))}
      </div>

      {/* 2. Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search workouts by name, exercise, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-50 dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-850 text-xs md:text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', 'Chest', 'Back', 'Legs', 'Shoulders'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedMuscleFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedMuscleFilter === filter
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm'
                  : 'bg-neutral-50/60 dark:bg-neutral-900/60 border-neutral-200/60 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Workout Sessions List */}
      <div className="space-y-3">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            onClick={() => setViewingWorkout(item)}
            className="p-4 md:p-5 rounded-2xl bg-neutral-50/60 dark:bg-[#0A0A0A] border border-neutral-200/70 dark:border-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-neutral-400 tabular-nums">
                  {item.date}
                </span>
                {item.personalRecords && item.personalRecords.length > 0 && (
                  <Badge variant="warning" className="text-[10px]">
                    <Trophy className="w-2.5 h-2.5 mr-1" /> PR Achieved
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-500 transition-colors">
                {item.dayTitle}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                {item.exercises.map((e) => e.name).join(' • ')}
              </p>
            </div>

            <div className="flex items-center gap-6 self-end md:self-auto shrink-0 text-xs">
              <div className="text-right">
                <div className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {item.totalVolumeKg.toLocaleString()} kg
                </div>
                <div className="text-[11px] text-neutral-400">Total Volume</div>
              </div>

              <div className="text-right">
                <div className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {item.setsCompleted} sets • {item.durationMinutes} min
                </div>
                <div className="text-[11px] text-neutral-400">Session Load</div>
              </div>

              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="py-12 text-center text-sm text-neutral-500">
            No past workout sessions found matching your search.
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: WORKOUT SESSION DETAILS                                 */}
      {/* ============================================================== */}
      {viewingWorkout && (
        <Modal
          isOpen={!!viewingWorkout}
          onClose={() => setViewingWorkout(null)}
          title={viewingWorkout.dayTitle}
          description={`Logged on ${viewingWorkout.date} • Duration: ${viewingWorkout.durationMinutes} min • Total Volume: ${viewingWorkout.totalVolumeKg.toLocaleString()} kg`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs md:text-sm">
            {viewingWorkout.notes && (
              <div className="p-3 rounded-xl bg-neutral-100/60 dark:bg-neutral-850/60 text-xs text-neutral-700 dark:text-neutral-300">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">Session Notes: </span>
                {viewingWorkout.notes}
              </div>
            )}

            <div className="space-y-3">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Completed Exercises
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
                {viewingWorkout.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                        {ex.name}
                      </div>
                      <div className="text-xs text-neutral-500 tabular-nums">
                        Top: {ex.topWeightKg} kg • Volume: {ex.totalVolumeKg} kg
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {ex.sets.map((set, setIdx) => (
                        <span
                          key={setIdx}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold tabular-nums text-neutral-800 dark:text-neutral-200"
                        >
                          Set {setIdx + 1}: {set.weightKg} kg × {set.reps} (RIR {set.rir})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-850">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(viewingWorkout.id)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Entry
              </Button>

              <Button variant="subtle" size="md" onClick={() => setViewingWorkout(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
