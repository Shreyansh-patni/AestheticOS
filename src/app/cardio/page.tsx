'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Plus,
  Compass,
  TrendingUp,
  Heart,
  Calendar,
  Sparkles,
  Footprints,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { CardioWalkLog, CardioRunLog, UserProfile } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Modal } from '@/components/ui/Modal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

export default function CardioPage() {
  const [profile, setProfile] = useState<UserProfile>(StorageService.getProfile());
  const [walkLogs, setWalkLogs] = useState<CardioWalkLog[]>([]);
  const [runLogs, setRunLogs] = useState<CardioRunLog[]>([]);

  // Live Walking Stopwatch
  const [isWalking, setIsWalking] = useState(false);
  const [walkElapsedSeconds, setWalkElapsedSeconds] = useState(0);

  // Manual Walk Modal
  const [showWalkModal, setShowWalkModal] = useState(false);
  const [manualWalkDuration, setManualWalkDuration] = useState(30);
  const [manualWalkDistance, setManualWalkDistance] = useState(2.8);
  const [manualWalkNotes, setManualWalkNotes] = useState('');

  // Manual Run Modal
  const [showRunModal, setShowRunModal] = useState(false);
  const [runDistance, setRunDistance] = useState(3.0);
  const [runDuration, setRunDuration] = useState(20);
  const [runType, setRunType] = useState<'easy' | 'interval' | 'tempo'>('easy');
  const [runNotes, setRunNotes] = useState('');
  const [todayDateStr, setTodayDateStr] = useState('2026-11-18');
  const [past7Days, setPast7Days] = useState<{ day: string; date: string; minutes: number; target: number }[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayDateStr(today);

    const load = () => {
      const p = StorageService.getProfile();
      const w = StorageService.getWalks();
      const r = StorageService.getRuns();
      setProfile(p);
      setWalkLogs(w);
      setRunLogs(r);

      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayWalks = w.filter((walk) => walk.date === dateStr);
        const totalMins = dayWalks.reduce((sum, walk) => sum + walk.durationMinutes, 0);
        return {
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          date: dateStr,
          minutes: totalMins,
          target: p.dailyWalkingTargetMinutes,
        };
      });
      setPast7Days(days);
    };
    load();
    window.addEventListener('aesthetic-storage-update', load);
    return () => window.removeEventListener('aesthetic-storage-update', load);
  }, []);

  // Live timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isWalking) {
      interval = setInterval(() => {
        setWalkElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWalking]);

  // Today's total walked minutes
  const todayWalks = walkLogs.filter((w) => w.date === todayDateStr);
  const todayWalkMinutes = todayWalks.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  // Finish live walking session
  const finishLiveWalk = () => {
    setIsWalking(false);
    const durationMins = Math.max(Math.round(walkElapsedSeconds / 60), 1);
    const newWalk: CardioWalkLog = {
      id: `w-${Date.now()}`,
      date: todayDateStr,
      durationMinutes: durationMins,
      distanceKm: Number(((durationMins * 5.0) / 60).toFixed(2)), // est 5 km/h
      notes: 'Live timed outdoor walk',
      completed: true,
    };
    StorageService.addWalk(newWalk);
    StorageService.updateHabitForDate(todayDateStr, { walkCompleted: true });
    setWalkElapsedSeconds(0);
  };

  // Add manual walk
  const handleSaveManualWalk = (e: React.FormEvent) => {
    e.preventDefault();
    const newWalk: CardioWalkLog = {
      id: `w-${Date.now()}`,
      date: todayDateStr,
      durationMinutes: manualWalkDuration,
      distanceKm: manualWalkDistance,
      notes: manualWalkNotes || 'Manual daily walk entry',
      completed: true,
    };
    StorageService.addWalk(newWalk);
    StorageService.updateHabitForDate(todayDateStr, { walkCompleted: true });
    setShowWalkModal(false);
    setManualWalkNotes('');
  };

  // Add manual run
  const handleSaveRun = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedPace = runDistance > 0 ? Number((runDuration / runDistance).toFixed(2)) : 0;
    const newRun: CardioRunLog = {
      id: `r-${Date.now()}`,
      date: todayDateStr,
      distanceKm: runDistance,
      durationMinutes: runDuration,
      paceMinutesPerKm: calculatedPace,
      type: runType,
      notes: runNotes,
    };
    StorageService.addRun(newRun);
    StorageService.updateHabitForDate(todayDateStr, { runCompleted: true });
    setShowRunModal(false);
    setRunNotes('');
  };

  // Running progress chart data
  const runningChartData = runLogs
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((r) => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      distance: r.distanceKm,
      pace: r.paceMinutesPerKm,
    }));

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-850">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Cardiovascular Health & Recovery
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 mt-1">
            Cardio Architecture
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Low-impact daily walking and gradual aerobic running to enhance recovery, heart rate variability, and fat metabolism.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="subtle" size="md" onClick={() => setShowWalkModal(true)}>
            <Plus className="w-4 h-4" /> Log Walk
          </Button>
          <Button variant="primary" size="md" onClick={() => setShowRunModal(true)}>
            <Plus className="w-4 h-4" /> Log Run
          </Button>
        </div>
      </div>

      {/* 1. WALKING TRACKER (Hero Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Walking Live Stopwatch Card */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="success">Daily Goal: 30 Min</Badge>
              <Footprints className="w-4 h-4 text-emerald-500" />
            </div>
            <CardTitle className="text-xl mt-2">Daily Walking Tracker</CardTitle>
            <CardDescription>
              A non-negotiable daily habit for blood flow, joint mobility, and posture.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-2">
              <ProgressRing
                progress={Math.min((todayWalkMinutes / 30) * 100, 100)}
                size={140}
                strokeWidth={10}
                color="#10B981"
              >
                <div className="text-center">
                  <div className="text-3xl font-extrabold tabular-nums tracking-tight">
                    {isWalking ? formatTimer(walkElapsedSeconds) : todayWalkMinutes}
                  </div>
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase">
                    {isWalking ? 'Elapsed' : 'Mins Done'}
                  </div>
                </div>
              </ProgressRing>
            </div>

            <div className="text-center text-xs text-neutral-500">
              {todayWalkMinutes >= 30 ? (
                <span className="text-emerald-500 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 30-Minute Target Achieved Today
                </span>
              ) : (
                <span>{30 - todayWalkMinutes} minutes remaining to reach your daily goal</span>
              )}
            </div>

            {/* Live Timer Controls */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-850">
              {!isWalking ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsWalking(true)}
                  className="w-full"
                >
                  <Play className="w-4 h-4 fill-current" /> Start Live Walk
                </Button>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <Button
                    variant="subtle"
                    size="md"
                    onClick={() => setIsWalking(false)}
                    className="flex-1"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={finishLiveWalk}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Finish Walk
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Walking Consistency Chart (2 cols) */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">7-Day Walking Consistency</CardTitle>
              <span className="text-xs font-semibold text-emerald-500 tabular-nums">
                Target: 30 min / day
              </span>
            </div>
            <CardDescription>
              Consistency over intensity. Steady daily walking enhances mitochondrial health without inducing muscular catabolism.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={past7Days}>
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    unit="m"
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
                  <Bar dataKey="minutes" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Walk Logs List */}
            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-850 space-y-2">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Recent Walk Logs
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-850 max-h-36 overflow-y-auto">
                {walkLogs.slice(0, 4).map((w) => (
                  <div key={w.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {w.durationMinutes} min walk
                      </span>
                      {w.distanceKm && (
                        <span className="text-neutral-400 ml-2">({w.distanceKm} km)</span>
                      )}
                      {w.notes && <div className="text-neutral-400 text-[11px]">{w.notes}</div>}
                    </div>
                    <span className="text-neutral-400 tabular-nums">{w.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. RUNNING SECTION (Beginner Progression) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Running Info & Guidelines */}
        <Card className="lg:col-span-1 space-y-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="neutral">Beginner Aerobic Program</Badge>
              <Compass className="w-4 h-4 text-neutral-400" />
            </div>
            <CardTitle className="text-xl mt-2">Easy Running Protocol</CardTitle>
            <CardDescription>
              Target: 2–3 easy sessions per week. Conversational pace only.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            <div className="p-3 rounded-xl bg-neutral-100/60 dark:bg-neutral-850/60 text-neutral-700 dark:text-neutral-300 space-y-1.5">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                Rule of Thumb: Conversational Pace
              </span>
              <p>
                As a returning beginner, running too fast creates unnecessary joint inflammation and central fatigue that hurts hypertrophy. Keep runs in Zone 2 where you can hold a spoken conversation comfortably.
              </p>
            </div>

            <ul className="space-y-1.5 list-disc list-inside">
              <li>Start with 15–20 minutes or 2–3 km.</li>
              <li>Use run/walk intervals if needed (e.g. 2 min jog / 1 min walk).</li>
              <li>Keep cadence light and upright.</li>
            </ul>

            <Button
              variant="primary"
              size="md"
              onClick={() => setShowRunModal(true)}
              className="w-full mt-2"
            >
              <Plus className="w-4 h-4" /> Log Running Session
            </Button>
          </CardContent>
        </Card>

        {/* Running Progression Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Running Distance & Pace Tracker</CardTitle>
              <span className="text-xs font-semibold text-neutral-400">
                {runLogs.length} Sessions Logged
              </span>
            </div>
            <CardDescription>
              Track distance and average pace improvements across easy runs.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {runningChartData.length > 0 ? (
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={runningChartData}>
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      unit="km"
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
                    <Line
                      type="monotone"
                      dataKey="distance"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-neutral-500">
                No running sessions logged yet. Tap &apos;Log Run&apos; to record your first easy jog.
              </div>
            )}

            {/* Recent Run Entries */}
            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-850 space-y-2">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Run History
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
                {runLogs.map((r) => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {r.distanceKm} km in {r.durationMinutes} min
                      </div>
                      <div className="text-neutral-400 text-[11px]">
                        Pace: {r.paceMinutesPerKm} min/km • Type: {r.type}
                        {r.notes && ` • ${r.notes}`}
                      </div>
                    </div>
                    <span className="text-neutral-400 tabular-nums">{r.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* MODAL: LOG MANUAL WALK                                         */}
      {/* ============================================================== */}
      {showWalkModal && (
        <Modal
          isOpen={showWalkModal}
          onClose={() => setShowWalkModal(false)}
          title="Log Walking Session"
          description="Record daily outdoor stroll or treadmill walk"
          maxWidth="sm"
        >
          <form onSubmit={handleSaveManualWalk} className="space-y-4 text-xs md:text-sm">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Duration (Minutes) *
              </label>
              <input
                type="number"
                min={5}
                max={180}
                required
                value={manualWalkDuration}
                onChange={(e) => setManualWalkDuration(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Estimated Distance (Kilometers)
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={manualWalkDistance}
                onChange={(e) => setManualWalkDistance(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Morning park stroll, relaxed breathing..."
                value={manualWalkNotes}
                onChange={(e) => setManualWalkNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setShowWalkModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                Save Walk
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL: LOG RUNNING SESSION                                     */}
      {/* ============================================================== */}
      {showRunModal && (
        <Modal
          isOpen={showRunModal}
          onClose={() => setShowRunModal(false)}
          title="Log Running Session"
          description="Enter your distance, duration and run pace"
          maxWidth="sm"
        >
          <form onSubmit={handleSaveRun} className="space-y-4 text-xs md:text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Distance (km) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0.5}
                  required
                  value={runDistance}
                  onChange={(e) => setRunDistance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Duration (min) *
                </label>
                <input
                  type="number"
                  min={5}
                  required
                  value={runDuration}
                  onChange={(e) => setRunDuration(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Run Type
              </label>
              <select
                value={runType}
                onChange={(e) => setRunType(e.target.value as 'easy' | 'interval' | 'tempo')}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              >
                <option value="easy">Easy Conversational Run (Recommended)</option>
                <option value="interval">Run / Walk Intervals</option>
                <option value="tempo">Tempo Pace</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Calculated Pace
              </label>
              <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                {runDistance > 0 ? (runDuration / runDistance).toFixed(2) : 0} min / km
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Felt light, breathing easy..."
                value={runNotes}
                onChange={(e) => setRunNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setShowRunModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                Save Run
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
