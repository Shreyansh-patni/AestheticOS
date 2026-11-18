'use client';

import React, { useState, useEffect } from 'react';
import { Timer, X, Play, Pause, RotateCcw, Plus, Volume2 } from 'lucide-react';
import { playRestCompleteChime } from '@/lib/audio';

interface RestTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
  autoStart?: boolean;
}

export function RestTimer({ initialSeconds = 90, isOpen, onClose, autoStart = true }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setTotalSeconds(initialSeconds);
    if (autoStart) setIsRunning(true);
  }, [initialSeconds, autoStart]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            playRestCompleteChime();
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const setPreset = (secs: number) => {
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setIsRunning(true);
  };

  const addTime = (delta: number) => {
    setSecondsLeft((prev) => Math.max(prev + delta, 0));
    setTotalSeconds((prev) => Math.max(prev + delta, 0));
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 bg-neutral-900/90 dark:bg-white text-white dark:text-neutral-950 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 cursor-pointer border border-neutral-700 dark:border-neutral-200 backdrop-blur-md active:scale-95 transition-all"
      >
        <Timer className="w-4 h-4 text-emerald-400 dark:text-emerald-600 animate-pulse" />
        <span className="font-semibold text-sm tabular-nums tracking-tight">
          Rest: {formatTime(secondsLeft)}
        </span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 w-[92vw] max-w-sm bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-4 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-850">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Rest Interval
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-xs px-2 py-0.5 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Minimize
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Countdown Display */}
      <div className="py-4 text-center">
        <div className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums text-neutral-950 dark:text-neutral-50">
          {formatTime(secondsLeft)}
        </div>
        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Preset options */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[60, 90, 120, 180].map((preset) => (
          <button
            key={preset}
            onClick={() => setPreset(preset)}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
              totalSeconds === preset
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            {preset}s
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-850">
        <button
          onClick={() => setPreset(totalSeconds)}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          title="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          onClick={() => addTime(15)}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+15s</span>
        </button>

        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white ${
            isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Resume
            </>
          )}
        </button>
      </div>
    </div>
  );
}
