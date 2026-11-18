'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { Exercise, MuscleGroup, EquipmentType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // New Exercise Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState<MuscleGroup>('Chest');
  const [newExTarget, setNewExTarget] = useState('');
  const [newExEquipment, setNewExEquipment] = useState<EquipmentType>('Dumbbell');
  const [newExInstructions, setNewExInstructions] = useState('');
  const [newExMistakes, setNewExMistakes] = useState('');
  const [newExTips, setNewExTips] = useState('');

  useEffect(() => {
    const load = () => {
      setExercises(StorageService.getExercises());
    };
    load();
    window.addEventListener('aesthetic-storage-update', load);
    return () => window.removeEventListener('aesthetic-storage-update', load);
  }, []);

  const categories = [
    'All',
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Forearms',
    'Legs',
    'Abs',
    'Cardio',
    'Mobility',
  ];

  const equipments = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

  // Filtered exercises
  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.targetMuscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.secondaryMuscles.some((sm) => sm.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
    const matchesEquipment = selectedEquipment === 'All' || ex.equipment === selectedEquipment;

    return matchesSearch && matchesCategory && matchesEquipment;
  });

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName || !newExTarget) return;

    const newExercise: Exercise = {
      id: `custom-ex-${Date.now()}`,
      name: newExName,
      category: newExCategory,
      targetMuscle: newExTarget,
      secondaryMuscles: [],
      equipment: newExEquipment,
      instructions: newExInstructions ? newExInstructions.split('\n').filter(Boolean) : ['Maintain strict form and control.'],
      commonMistakes: newExMistakes ? newExMistakes.split('\n').filter(Boolean) : ['Rushing the eccentric tempo.'],
      defaultSets: 3,
      defaultReps: '8–12',
      substitutes: [],
      tips: newExTips || 'Focus on mind-muscle connection and controlled range of motion.',
    };

    StorageService.addExercise(newExercise);
    setShowAddModal(false);
    setNewExName('');
    setNewExTarget('');
    setNewExInstructions('');
    setNewExMistakes('');
    setNewExTips('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-850">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Movement Directory
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 mt-1">
            Exercise Library
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Verified technique guides, target biomechanics, common errors, and exercise substitutions.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Add Custom Exercise
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exercises by name, target muscle, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-850 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-transparent shadow-sm'
                  : 'bg-neutral-50/60 dark:bg-neutral-900/60 border-neutral-200/60 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Equipment Filter Pills */}
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="font-medium text-neutral-400">Equipment:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {equipments.map((eq) => (
              <button
                key={eq}
                onClick={() => setSelectedEquipment(eq)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedEquipment === eq
                    ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {filteredExercises.map((ex) => (
          <div
            key={ex.id}
            onClick={() => setSelectedExercise(ex)}
            className="p-4 rounded-2xl bg-neutral-50/60 dark:bg-[#0A0A0A] border border-neutral-200/70 dark:border-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-all duration-150 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="neutral">{ex.category}</Badge>
                <span className="text-[11px] text-neutral-400">{ex.equipment}</span>
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base group-hover:text-emerald-500 transition-colors">
                {ex.name}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                Target: {ex.targetMuscle}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-850/60 flex items-center justify-between text-xs text-neutral-400">
              <span>{ex.defaultSets} sets × {ex.defaultReps}</span>
              <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                View Guide <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}

        {filteredExercises.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-neutral-500">
            No exercises match your search filters.
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: EXERCISE DETAIL                                         */}
      {/* ============================================================== */}
      {selectedExercise && (
        <Modal
          isOpen={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          title={selectedExercise.name}
          description={`${selectedExercise.category} • ${selectedExercise.equipment}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs md:text-sm">
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                Targeted Biomechanics:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="success">Primary: {selectedExercise.targetMuscle}</Badge>
                {selectedExercise.secondaryMuscles.map((sm, i) => (
                  <Badge key={i} variant="neutral">
                    {sm}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                Execution Instructions:
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-neutral-600 dark:text-neutral-300">
                {selectedExercise.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div>
              <div className="font-semibold text-amber-600 dark:text-amber-400 mb-1.5">
                Common Form Mistakes:
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-300">
                {selectedExercise.commonMistakes.map((mistake, i) => (
                  <li key={i}>{mistake}</li>
                ))}
              </ul>
            </div>

            {selectedExercise.substitutes.length > 0 && (
              <div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">
                  Viable Substitutions:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedExercise.substitutes.map((sub, i) => (
                    <Badge key={i} variant="outline">
                      {sub}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-neutral-100/60 dark:bg-neutral-850/60 text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">Coaching Cue: </span>
              {selectedExercise.tips}
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD CUSTOM EXERCISE                                     */}
      {/* ============================================================== */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Custom Exercise"
          description="Create a new movement to track across your workouts"
          maxWidth="md"
        >
          <form onSubmit={handleCreateExercise} className="space-y-3 text-xs md:text-sm">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Exercise Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Incline Machine Chest Press"
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Category
                </label>
                <select
                  value={newExCategory}
                  onChange={(e) => setNewExCategory(e.target.value as MuscleGroup)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                >
                  {categories.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Equipment
                </label>
                <select
                  value={newExEquipment}
                  onChange={(e) => setNewExEquipment(e.target.value as EquipmentType)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                >
                  {equipments.filter((e) => e !== 'All').map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Primary Target Muscle *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Clavicular Pectoralis (Upper Chest)"
                value={newExTarget}
                onChange={(e) => setNewExTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Step-by-step Instructions (one per line)
              </label>
              <textarea
                rows={2}
                placeholder="Line 1&#10;Line 2"
                value={newExInstructions}
                onChange={(e) => setNewExInstructions(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Coaching Tip / Cues
              </label>
              <input
                type="text"
                placeholder="e.g. Squeeze at peak contraction"
                value={newExTips}
                onChange={(e) => setNewExTips(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button variant="ghost" size="md" type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                Save Exercise
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
