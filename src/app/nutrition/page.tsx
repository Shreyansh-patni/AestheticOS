'use client';

import React, { useState, useEffect } from 'react';
import {
  Apple,
  Plus,
  Trash2,
  Droplets,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { StorageService } from '@/lib/storage';
import {
  NutritionLogItem,
  FoodDatabaseItem,
  UserProfile,
} from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';

export default function NutritionPage() {
  const [profile, setProfile] = useState<UserProfile>(StorageService.getProfile());
  const [foodDb, setFoodDb] = useState<FoodDatabaseItem[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLogItem[]>([]);
  const [waterLoggedLiters, setWaterLoggedLiters] = useState(2.5);
  const [creatineTaken, setCreatineTaken] = useState(true);

  // Quick Log Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodDatabaseItem | null>(null);
  const [foodPortionMultiplier, setFoodPortionMultiplier] = useState(1);

  // Custom Food Item Form
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customServing, setCustomServing] = useState('1 serving');
  const [customCalories, setCustomCalories] = useState(200);
  const [customProtein, setCustomProtein] = useState(15);
  const [customCarbs, setCustomCarbs] = useState(20);
  const [customFat, setCustomFat] = useState(5);

  const todayDateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = () => {
      setProfile(StorageService.getProfile());
      setFoodDb(StorageService.getFoodDatabase());
      setNutritionLogs(StorageService.getNutritionLogs());

      // Check today's habit for creatine
      const habit = StorageService.getHabitForDate(todayDateStr);
      setCreatineTaken(habit.supplementsTaken);
    };
    load();
    window.addEventListener('aesthetic-storage-update', load);
    return () => window.removeEventListener('aesthetic-storage-update', load);
  }, [todayDateStr]);

  // Filter logs for today
  const todayLogs = nutritionLogs.filter((n) => n.date === todayDateStr);

  // Macro Totals
  const totalCalories = todayLogs.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProtein = todayLogs.reduce((acc, curr) => acc + curr.protein, 0);
  const totalCarbs = todayLogs.reduce((acc, curr) => acc + curr.carbs, 0);
  const totalFat = todayLogs.reduce((acc, curr) => acc + curr.fat, 0);

  // Check if protein target met
  const proteinTargetMet = totalProtein >= profile.dailyProteinTargetGrams;

  // Add water
  const addWater = (amountLiters: number) => {
    setWaterLoggedLiters((prev) => Number((prev + amountLiters).toFixed(2)));
    if (waterLoggedLiters + amountLiters >= profile.dailyWaterTargetLiters) {
      StorageService.updateHabitForDate(todayDateStr, { hydrated: true });
    }
  };

  // Toggle creatine
  const toggleCreatine = () => {
    const nextVal = !creatineTaken;
    setCreatineTaken(nextVal);
    StorageService.updateHabitForDate(todayDateStr, { supplementsTaken: nextVal });
  };

  // Log food item
  const handleLogFood = () => {
    if (isCustomMode) {
      if (!customFoodName) return;
      const newItem: NutritionLogItem = {
        id: `nl-${Date.now()}`,
        date: todayDateStr,
        mealType: selectedMealType,
        foodName: customFoodName,
        quantity: customServing,
        calories: customCalories,
        protein: customProtein,
        carbs: customCarbs,
        fat: customFat,
      };
      StorageService.addNutritionLog(newItem);
    } else {
      if (!selectedFoodItem) return;
      const mult = foodPortionMultiplier || 1;
      const newItem: NutritionLogItem = {
        id: `nl-${Date.now()}`,
        date: todayDateStr,
        mealType: selectedMealType,
        foodName: selectedFoodItem.name,
        quantity: mult === 1 ? selectedFoodItem.servingSize : `${mult} × ${selectedFoodItem.servingSize}`,
        calories: Math.round(selectedFoodItem.calories * mult),
        protein: Number((selectedFoodItem.protein * mult).toFixed(1)),
        carbs: Number((selectedFoodItem.carbs * mult).toFixed(1)),
        fat: Number((selectedFoodItem.fat * mult).toFixed(1)),
      };
      StorageService.addNutritionLog(newItem);
    }

    // Update habit if protein reached
    if (totalProtein + (isCustomMode ? customProtein : (selectedFoodItem?.protein || 0)) >= profile.dailyProteinTargetGrams) {
      StorageService.updateHabitForDate(todayDateStr, { proteinMet: true });
    }

    setShowLogModal(false);
    setSelectedFoodItem(null);
    setFoodPortionMultiplier(1);
    setIsCustomMode(false);
    setCustomFoodName('');
  };

  // Filter food database
  const filteredFoodDb = foodDb.filter((f) =>
    f.name.toLowerCase().includes(foodSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-100 dark:border-neutral-850">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Energy & Macronutrient Fuel
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 mt-1">
            Nutrition Architecture
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Lean caloric surplus for 55 kg → 65 kg hypertrophy. High-quality vegetarian and egg-based protein.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setShowLogModal(true)}>
          <Plus className="w-4 h-4" /> Log Meal / Food
        </Button>
      </div>

      {/* 1. Macro Summary Rings & Top Targets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Ring */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Calories</span>
              <div className="text-2xl font-extrabold tracking-tight tabular-nums mt-1 text-neutral-950 dark:text-neutral-50">
                {totalCalories}{' '}
                <span className="text-xs font-normal text-neutral-400">/ {profile.dailyCalorieTarget}</span>
              </div>
            </div>
            <ProgressRing
              progress={Math.min((totalCalories / profile.dailyCalorieTarget) * 100, 100)}
              size={48}
              strokeWidth={5}
              color="#10B981"
            />
          </div>
          <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-850 text-xs text-neutral-500 flex justify-between">
            <span>Surplus strategy:</span>
            <span className="font-semibold text-emerald-500">+250 kcal lean buffer</span>
          </div>
        </Card>

        {/* Protein Ring */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Protein (Key)</span>
              <div className="text-2xl font-extrabold tracking-tight tabular-nums mt-1 text-neutral-950 dark:text-neutral-50">
                {Math.round(totalProtein)}{' '}
                <span className="text-xs font-normal text-neutral-400">/ {profile.dailyProteinTargetGrams}g</span>
              </div>
            </div>
            <ProgressRing
              progress={Math.min((totalProtein / profile.dailyProteinTargetGrams) * 100, 100)}
              size={48}
              strokeWidth={5}
              color="#10B981"
            />
          </div>
          <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-850 text-xs text-neutral-500 flex justify-between">
            <span>Target Status:</span>
            <span className={`font-semibold ${proteinTargetMet ? 'text-emerald-500' : 'text-amber-500'}`}>
              {proteinTargetMet ? 'Goal Met' : `${Math.round(profile.dailyProteinTargetGrams - totalProtein)}g remaining`}
            </span>
          </div>
        </Card>

        {/* Carbohydrates & Fats */}
        <Card className="flex flex-col justify-between">
          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Carbs & Healthy Fats</span>
            <div className="flex items-baseline gap-3 mt-1 tabular-nums">
              <div>
                <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{Math.round(totalCarbs)}g</span>
                <span className="text-[11px] text-neutral-400 block">Carbs</span>
              </div>
              <span className="text-neutral-300 dark:text-neutral-700">|</span>
              <div>
                <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{Math.round(totalFat)}g</span>
                <span className="text-[11px] text-neutral-400 block">Fat</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-850 text-xs text-neutral-500">
            Balanced fuel for gym output and hormonal balance.
          </div>
        </Card>

        {/* Water & Creatine */}
        <Card className="flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-500 font-medium">Hydration</span>
                <div className="text-lg font-bold tabular-nums">
                  {waterLoggedLiters} <span className="text-xs font-normal text-neutral-400">/ {profile.dailyWaterTargetLiters} L</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => addWater(0.25)}
                  className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-850 text-xs font-semibold hover:bg-neutral-200"
                >
                  +250ml
                </button>
                <button
                  onClick={() => addWater(0.5)}
                  className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-850 text-xs font-semibold hover:bg-neutral-200"
                >
                  +500ml
                </button>
              </div>
            </div>

            {/* Creatine Switch */}
            <div
              onClick={toggleCreatine}
              className="flex items-center justify-between p-2 rounded-xl bg-neutral-100/60 dark:bg-neutral-850/60 cursor-pointer text-xs"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Daily Creatine (5g)</span>
              </div>
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                  creatineTaken ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-neutral-400'
                }`}
              >
                {creatineTaken && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Today's Meals by Group */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Today&apos;s Food Log</CardTitle>
                <CardDescription>
                  {todayLogs.length} items logged today ({Math.round(totalCalories)} kcal, {Math.round(totalProtein)}g protein)
                </CardDescription>
              </div>
              <Button variant="subtle" size="sm" onClick={() => setShowLogModal(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Food
              </Button>
            </CardHeader>

            <CardContent>
              {todayLogs.length > 0 ? (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
                  {todayLogs.map((log) => (
                    <div
                      key={log.id}
                      className="py-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 px-2 rounded-xl text-xs md:text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="neutral" className="uppercase text-[10px]">
                            {log.mealType}
                          </Badge>
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {log.foodName}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          Portion: {log.quantity}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right tabular-nums">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {log.calories} kcal
                          </div>
                          <div className="text-[11px] text-emerald-500 font-medium">
                            {log.protein}g protein • {log.carbs}g C • {log.fat}g F
                          </div>
                        </div>

                        <button
                          onClick={() => StorageService.deleteNutritionLog(log.id)}
                          className="p-1 rounded text-neutral-400 hover:text-red-500 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No foods logged yet today. Click &apos;Log Meal / Food&apos; to add breakfast, lunch, or snacks.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Educational Callout on Hypertrophy Nutrition */}
          <div className="p-4 rounded-2xl bg-neutral-100/50 dark:bg-[#0A0A0A] border border-neutral-200/60 dark:border-neutral-850 flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                Lean Muscle Gaining Principles (No Aggressive Deficits)
              </span>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                At 55 kg with a goal of 65 kg, muscle protein synthesis requires positive energy balance and sufficient amino acids (90–100g protein daily). Crash deficits or excessive cardio burn away hard-earned muscle tissue. A controlled surplus of ~200–300 kcal over maintenance ensures steady hypertrophy while minimizing unwanted visceral adipose storage.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Verified Vegetarian & Egg Food Directory */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vegetarian & Egg Food Bank</CardTitle>
              <CardDescription>Verified protein-dense food database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {foodDb.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedFoodItem(item);
                      setShowLogModal(true);
                    }}
                    className="p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer transition-colors text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {item.servingSize}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-bold text-emerald-500">{item.protein}g P</div>
                      <div className="text-[10px] text-neutral-400">{item.calories} kcal</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: LOG MEAL OR CUSTOM FOOD                                 */}
      {/* ============================================================== */}
      {showLogModal && (
        <Modal
          isOpen={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            setSelectedFoodItem(null);
            setIsCustomMode(false);
          }}
          title={isCustomMode ? 'Add Custom Food' : 'Log Food to Today'}
          description="Select from verified database or enter custom meal values"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs md:text-sm">
            {/* Meal Type Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMealType(m)}
                  className={`py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    selectedMealType === m
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Toggle Custom vs Database */}
            <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-semibold text-neutral-500">
                {isCustomMode ? 'Custom Entry Mode' : 'Database Selection'}
              </span>
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-xs font-semibold text-emerald-500 hover:underline"
              >
                {isCustomMode ? 'Pick from Database' : '+ Create Custom Food'}
              </button>
            </div>

            {isCustomMode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Food Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Protein Shake with Milk & Oats"
                    value={customFoodName}
                    onChange={(e) => setCustomFoodName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Calories (kcal)
                    </label>
                    <input
                      type="number"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      value={customFat}
                      onChange={(e) => setCustomFat(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none tabular-nums"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search in Food DB */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search eggs, paneer, soya, dal, rice..."
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none"
                  />
                </div>

                {/* Selected Food Item Preview */}
                {selectedFoodItem && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedFoodItem.name}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {selectedFoodItem.servingSize}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/20">
                      <span>Portion Servings:</span>
                      <div className="flex items-center gap-2">
                        {[0.5, 1, 1.5, 2].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setFoodPortionMultiplier(m)}
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              foodPortionMultiplier === m
                                ? 'bg-emerald-500 text-white'
                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {m}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 pt-1">
                      Total: {Math.round(selectedFoodItem.calories * foodPortionMultiplier)} kcal •{' '}
                      {(selectedFoodItem.protein * foodPortionMultiplier).toFixed(1)}g protein
                    </div>
                  </div>
                )}

                {/* List of food items */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {filteredFoodDb.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedFoodItem(item)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        selectedFoodItem?.id === item.id
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-neutral-200/60 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-neutral-400">{item.servingSize}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-500">{item.protein}g P</span>
                        <span className="text-[10px] text-neutral-400 block">{item.calories} kcal</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setShowLogModal(false);
                  setSelectedFoodItem(null);
                  setIsCustomMode(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!isCustomMode && !selectedFoodItem}
                onClick={handleLogFood}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              >
                Add to Daily Log
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
