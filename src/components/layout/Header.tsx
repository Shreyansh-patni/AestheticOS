'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, Dumbbell, Trophy } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { StorageService } from '@/lib/storage';
import { ActiveWorkoutSession } from '@/types';

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const [activeSession, setActiveSession] = useState<ActiveWorkoutSession | null>(null);
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const updateSession = () => {
      setActiveSession(StorageService.getActiveSession());
    };
    updateSession();

    // Format current date: "Wednesday, Nov 18"
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    setCurrentDateStr(now.toLocaleDateString('en-US', options));

    window.addEventListener('aesthetic-storage-update', updateSession);
    return () => window.removeEventListener('aesthetic-storage-update', updateSession);
  }, []);

  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-850 px-4 md:px-8 py-3.5 flex items-center justify-between select-none">
      {/* Date & Subtitle */}
      <div className="flex items-center gap-3">
        <Link href="/" className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-xs">
            Æ
          </div>
        </Link>
        <div>
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {currentDateStr || 'Today'}
          </div>
          <h1 className="text-sm md:text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            AestheticOS
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Active workout banner button */}
        {activeSession && activeSession.status === 'active' && (
          <Link
            href="/workout"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold animate-pulse hover:bg-emerald-500/20 transition-all"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Workout in Progress</span>
            <span className="sm:hidden">Active</span>
          </Link>
        )}

        {/* 30-Day challenge quick pill */}
        <Link
          href="/challenge"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-medium transition-colors"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>30-Day Challenge</span>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme appearance"
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-neutral-400 hover:text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-neutral-600 hover:text-indigo-600" />
          )}
        </button>
      </div>
    </header>
  );
}
