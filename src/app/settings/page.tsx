'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Sliders,
  Moon,
  Sun,
  Laptop,
  RotateCcw,
  Check,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { UserProfile } from '@/types';
import { useTheme } from '@/lib/theme';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>(StorageService.getProfile());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    setProfile(StorageService.getProfile());
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveProfile(profile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = StorageService.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AestheticOS-Backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Workouts CSV
  const handleExportWorkoutsCSV = () => {
    const csvStr = StorageService.exportWorkoutsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AestheticOS-Workouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Measurements CSV
  const handleExportMeasurementsCSV = () => {
    const csvStr = StorageService.exportMeasurementsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AestheticOS-Measurements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON File
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = StorageService.importAllDataJSON(content);
      if (res.success) {
        setImportStatus('Data imported successfully! Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setImportStatus(`Import failed: ${res.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Reset Application Data
  const handleResetData = () => {
    if (
      confirm(
        'Warning: This will reset all workout logs, measurements, and habits back to the initial starting template. Are you sure?'
      )
    ) {
      StorageService.resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-850">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            System Configuration
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 mt-1">
            Settings & Preferences
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your personal profile, targets, appearance, and local data export/import.
          </p>
        </div>

        {saveSuccess && (
          <Badge variant="success" className="px-3 py-1 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" /> Changes Saved
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Target Settings (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Editor */}
          <form onSubmit={handleSaveProfile}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  <CardTitle className="text-base">Personal Profile & Physique Goals</CardTitle>
                </div>
                <CardDescription>
                  All initial measurements and targets can be modified at any time.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs md:text-sm">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={profile.heightCm}
                      onChange={(e) =>
                        setProfile({ ...profile, heightCm: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.currentWeightKg}
                      onChange={(e) =>
                        setProfile({ ...profile, currentWeightKg: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Target Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={profile.targetWeightKg}
                      onChange={(e) =>
                        setProfile({ ...profile, targetWeightKg: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Primary Goal
                  </label>
                  <input
                    type="text"
                    value={profile.primaryGoal}
                    onChange={(e) => setProfile({ ...profile, primaryGoal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Training Experience
                  </label>
                  <input
                    type="text"
                    value={profile.trainingExperience}
                    onChange={(e) => setProfile({ ...profile, trainingExperience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>

                {/* Secondary Goals Checklist */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Secondary Goals & Focus Areas
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {profile.secondaryGoals.map((goal, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-neutral-100/60 dark:bg-neutral-850/60 flex items-center justify-between"
                      >
                        <span className="text-neutral-800 dark:text-neutral-200">{goal}</span>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="primary" size="md" type="submit">
                    Save Profile Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Daily & Nutrition Targets */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <CardTitle className="text-base">Daily Targets & Schedules</CardTitle>
              </div>
              <CardDescription>Caloric surplus, protein thresholds, and cardio targets</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Daily Calorie Target (kcal)
                  </label>
                  <input
                    type="number"
                    value={profile.dailyCalorieTarget}
                    onChange={(e) =>
                      setProfile({ ...profile, dailyCalorieTarget: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 tabular-nums focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Daily Protein Target (g)
                  </label>
                  <input
                    type="number"
                    value={profile.dailyProteinTargetGrams}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        dailyProteinTargetGrams: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Daily Walking Target (Minutes)
                  </label>
                  <input
                    type="number"
                    value={profile.dailyWalkingTargetMinutes}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        dailyWalkingTargetMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 tabular-nums focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Weekly Running Sessions
                  </label>
                  <input
                    type="number"
                    value={profile.weeklyRunningSessionsTarget}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        weeklyRunningSessionsTarget: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  type="button"
                  onClick={() => {
                    StorageService.saveProfile(profile);
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2500);
                  }}
                >
                  Save Targets
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Theme, Units & Data Management */}
        <div className="space-y-6">
          {/* Theme Selector */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Appearance & Theme</CardTitle>
              <CardDescription>Apple monochromatic light and dark system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setTheme(item.id as 'dark' | 'light' | 'system')}
                      className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Unit System */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Unit System</CardTitle>
              <CardDescription>Measurement standards for weights and heights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'metric', label: 'Metric (kg, cm)' },
                  { id: 'imperial', label: 'Imperial (lb, in)' },
                ].map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      const updated = { ...profile, unitSystem: u.id as 'metric' | 'imperial' };
                      setProfile(updated);
                      StorageService.saveProfile(updated);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      profile.unitSystem === u.id
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Export & Backup */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Data Backup & Export</CardTitle>
              <CardDescription>Download your fitness logs anytime</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="subtle"
                size="sm"
                onClick={handleExportJSON}
                className="w-full justify-start text-xs"
              >
                <FileCode className="w-4 h-4 text-emerald-500" /> Export All Data (JSON)
              </Button>

              <Button
                variant="subtle"
                size="sm"
                onClick={handleExportWorkoutsCSV}
                className="w-full justify-start text-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Workouts (CSV)
              </Button>

              <Button
                variant="subtle"
                size="sm"
                onClick={handleExportMeasurementsCSV}
                className="w-full justify-start text-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Measurements (CSV)
              </Button>
            </CardContent>
          </Card>

          {/* Data Import & Reset */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Import & Reset</CardTitle>
              <CardDescription>Restore from JSON backup or reset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  Restore from JSON Backup
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="w-full text-xs text-neutral-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-neutral-100 file:dark:bg-neutral-800 file:text-neutral-800 file:dark:text-neutral-200 cursor-pointer"
                />
                {importStatus && (
                  <p className="text-[11px] text-emerald-500 mt-1 font-semibold">{importStatus}</p>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-850">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleResetData}
                  className="w-full text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset All Data to Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
