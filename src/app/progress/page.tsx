'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Camera,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import {
  BodyMeasurement,
  UserProfile,
  WorkoutHistoryItem,
} from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function ProgressPage() {
  const [profile, setProfile] = useState<UserProfile>(StorageService.getProfile());
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);

  // Selected exercise for strength progression chart
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('Incline Dumbbell Press');

  // New Measurement Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWeight, setNewWeight] = useState(55.8);
  const [newWaist, setNewWaist] = useState(72);
  const [newChest, setNewChest] = useState(89);
  const [newArms, setNewArms] = useState(29);
  const [newShoulders, setNewShoulders] = useState(109);
  const [newThighs, setNewThighs] = useState(48.5);
  const [newNotes, setNewNotes] = useState('');
  const [photoDataUri, setPhotoDataUri] = useState<string | undefined>(undefined);
  const [photoPose, setPhotoPose] = useState<'front' | 'side' | 'back'>('front');

  useEffect(() => {
    const load = () => {
      setProfile(StorageService.getProfile());
      setMeasurements(StorageService.getMeasurements());
      setHistory(StorageService.getHistory());
    };
    load();
    window.addEventListener('aesthetic-storage-update', load);
    return () => window.removeEventListener('aesthetic-storage-update', load);
  }, []);

  // Sorted measurements
  const sortedMeasurements = measurements
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Latest vs Baseline
  const baseline = sortedMeasurements[0] || {
    weightKg: 55,
    waistCm: 72,
    chestCm: 88,
    armsCm: 28.5,
    shouldersCm: 108,
    thighsCm: 48,
  };
  const latest = sortedMeasurements[sortedMeasurements.length - 1] || baseline;

  // Weight chart data
  const weightChartData = sortedMeasurements.map((m) => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weightKg,
    target: profile.targetWeightKg,
  }));

  // Waist chart data
  const waistChartData = sortedMeasurements.map((m) => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    waist: m.waistCm,
  }));

  // Strength progression by selected exercise
  const strengthData: { date: string; topWeight: number; totalVolume: number }[] = [];
  history
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((h) => {
      const match = h.exercises.find((e) =>
        e.name.toLowerCase().includes(selectedExerciseName.toLowerCase())
      );
      if (match) {
        strengthData.push({
          date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          topWeight: match.topWeightKg,
          totalVolume: match.totalVolumeKg,
        });
      }
    });

  // Handle Image Upload locally
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save new measurement
  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const newM: BodyMeasurement = {
      id: `m-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      weightKg: newWeight,
      heightCm: profile.heightCm,
      waistCm: newWaist,
      chestCm: newChest,
      armsCm: newArms,
      shouldersCm: newShoulders,
      thighsCm: newThighs,
      notes: newNotes,
      photoUrl: photoDataUri,
      photoPose: photoPose,
    };

    StorageService.addMeasurement(newM);
    // Update profile current weight
    StorageService.saveProfile({ ...profile, currentWeightKg: newWeight });

    setShowAddModal(false);
    setNewNotes('');
    setPhotoDataUri(undefined);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-850">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Physique & Biomarkers
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 mt-1">
            Progress Analytics
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track weight trend, waist retention, muscular circumferences, and progressive strength overload.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Log New Measurement
        </Button>
      </div>

      {/* 1. Baseline vs Latest Comparison Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Weight', base: `${baseline.weightKg} kg`, current: `${latest.weightKg} kg`, diff: `+${(latest.weightKg - baseline.weightKg).toFixed(1)} kg`, good: true },
          { label: 'Waist', base: `${baseline.waistCm || 72} cm`, current: `${latest.waistCm || 72} cm`, diff: `${((latest.waistCm || 72) - (baseline.waistCm || 72)).toFixed(1)} cm`, good: true },
          { label: 'Upper Chest', base: `${baseline.chestCm || 88} cm`, current: `${latest.chestCm || 89} cm`, diff: `+${((latest.chestCm || 89) - (baseline.chestCm || 88)).toFixed(1)} cm`, good: true },
          { label: 'Shoulders', base: `${baseline.shouldersCm || 108} cm`, current: `${latest.shouldersCm || 109} cm`, diff: `+${((latest.shouldersCm || 109) - (baseline.shouldersCm || 108)).toFixed(1)} cm`, good: true },
          { label: 'Arms', base: `${baseline.armsCm || 28.5} cm`, current: `${latest.armsCm || 29.1} cm`, diff: `+${((latest.armsCm || 29.1) - (baseline.armsCm || 28.5)).toFixed(1)} cm`, good: true },
          { label: 'Thighs', base: `${baseline.thighsCm || 48} cm`, current: `${latest.thighsCm || 48.7} cm`, diff: `+${((latest.thighsCm || 48.7) - (baseline.thighsCm || 48)).toFixed(1)} cm`, good: true },
        ].map((stat, i) => (
          <Card key={i} className="p-3.5 flex flex-col justify-between">
            <span className="text-[11px] text-neutral-400 font-medium">{stat.label}</span>
            <div className="my-1.5">
              <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {stat.current}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-100 dark:border-neutral-850">
              <span>Start: {stat.base}</span>
              <span className="font-semibold text-emerald-500">{stat.diff}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* 2. Charts Section: Weight Trend & Waist Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Progression Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Body Weight Progression</CardTitle>
              <span className="text-xs font-semibold text-emerald-500 tabular-nums">
                Goal: {profile.targetWeightKg} kg
              </span>
            </div>
            <CardDescription>
              Gradual lean bulking trajectory. Aim for ~0.25 to 0.5 kg per month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData}>
                  <defs>
                    <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[54, 58]} stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit="kg" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      borderColor: '#262626',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#FFF',
                    }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="#10B981" strokeWidth={2.5} fill="url(#weightArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Waist Measurement Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Waist Circumference Retention</CardTitle>
              <Badge variant="success">Taper Indicator</Badge>
            </div>
            <CardDescription>
              A stable waist during weight gain confirms lean muscular hypertrophy over abdominal fat deposition.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waistChartData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[70, 75]} stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit="cm" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      borderColor: '#262626',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#FFF',
                    }}
                  />
                  <Line type="monotone" dataKey="waist" stroke="#D4D4D4" strokeWidth={2} dot={{ r: 4, fill: '#FFFFFF' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Strength Overload Progression */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Strength Progression by Exercise</CardTitle>
            <CardDescription>
              Progressive overload tracked via top working weight and total session volume.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Exercise:</span>
            <select
              value={selectedExerciseName}
              onChange={(e) => setSelectedExerciseName(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none"
            >
              <option value="Incline Dumbbell Press">Incline Dumbbell Press</option>
              <option value="Flat Barbell">Flat Bench Press</option>
              <option value="Pull-ups">Pull-ups / Lat Pulldown</option>
              <option value="One-arm Dumbbell Row">One-arm DB Row</option>
              <option value="Squat">Barbell Back Squat</option>
              <option value="Lateral Raise">Dumbbell Lateral Raise</option>
              <option value="Shrugs">Dumbbell Shrugs</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {strengthData.length > 0 ? (
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit="kg" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121212',
                      borderColor: '#262626',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#FFF',
                    }}
                  />
                  <Line type="monotone" dataKey="topWeight" stroke="#10B981" strokeWidth={2.5} name="Top Weight (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-neutral-500">
              Log more sessions for {selectedExerciseName} to visualize strength trajectory.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Private Progress Photographs Gallery */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Private Progress Gallery</CardTitle>
            <CardDescription>
              Stored strictly on your local device. Compare baseline vs current physique silhouette.
            </CardDescription>
          </div>
          <Button variant="subtle" size="sm" onClick={() => setShowAddModal(true)}>
            <Camera className="w-3.5 h-3.5" /> Upload Photo
          </Button>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sortedMeasurements.filter((m) => m.photoUrl).length > 0 ? (
              sortedMeasurements
                .filter((m) => m.photoUrl)
                .map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex flex-col"
                  >
                    <div className="h-48 bg-neutral-950 flex items-center justify-center relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.photoUrl}
                        alt={`Progress ${m.date}`}
                        className="w-full h-full object-cover"
                      />
                      <Badge variant="neutral" className="absolute top-2 right-2 text-[10px] uppercase">
                        {m.photoPose || 'front'}
                      </Badge>
                    </div>
                    <div className="p-3 text-xs flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {m.weightKg} kg
                      </span>
                      <span>{m.date}</span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="col-span-full py-10 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Camera className="w-8 h-8 text-neutral-400" />
                <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  No Progress Photos Yet
                </div>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Photos remain private in your browser. Record a front or back posture photo to compare physique definition across the 30-day challenge.
                </p>
                <Button variant="subtle" size="sm" onClick={() => setShowAddModal(true)}>
                  Take or Upload Photo
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* MODAL: LOG NEW MEASUREMENT                                     */}
      {/* ============================================================== */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Log Physique Measurement"
          description="Update body weight, circumference landmarks, and optional photo"
          maxWidth="md"
        >
          <form onSubmit={handleSaveMeasurement} className="space-y-4 text-xs md:text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Body Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Waist Circumference (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newWaist}
                  onChange={(e) => setNewWaist(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Upper Chest (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newChest}
                  onChange={(e) => setNewChest(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Shoulders / Delts (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newShoulders}
                  onChange={(e) => setNewShoulders(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Arms / Biceps (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newArms}
                  onChange={(e) => setNewArms(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Thighs (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newThighs}
                  onChange={(e) => setNewThighs(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Photo upload input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Progress Photo (Stored Privately on Device)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:dark:bg-neutral-800 file:text-neutral-700 file:dark:text-neutral-300 hover:file:bg-neutral-200 cursor-pointer"
                />
                <select
                  value={photoPose}
                  onChange={(e) => setPhotoPose(e.target.value as 'front' | 'side' | 'back')}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                >
                  <option value="front">Front</option>
                  <option value="side">Side</option>
                  <option value="back">Back</option>
                </select>
              </div>
              {photoDataUri && (
                <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoDataUri} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Morning weigh-in after hydration..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <Button variant="ghost" size="md" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                Save Measurement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
