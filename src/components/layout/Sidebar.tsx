'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  Flame,
  Apple,
  TrendingUp,
  History,
  Settings,
  Trophy,
} from 'lucide-react';
import clsx from 'clsx';
import { StorageService } from '@/lib/storage';

export const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Workout', href: '/workout', icon: Dumbbell },
  { name: 'Exercise Library', href: '/exercises', icon: BookOpen },
  { name: 'Cardio', href: '/cardio', icon: Flame },
  { name: 'Nutrition', href: '/nutrition', icon: Apple },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Challenge', href: '/challenge', icon: Trophy },
  { name: 'History', href: '/history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const profile = StorageService.getProfile();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-neutral-200 dark:border-neutral-850 bg-white dark:bg-black h-screen sticky top-0 px-4 py-6 justify-between select-none">
      <div className="space-y-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 px-3">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-base shadow-sm">
            Æ
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
              AestheticOS
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium">
              Fitness Architecture
            </span>
          </div>
        </Link>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-850 text-neutral-950 dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                )}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4',
                    isActive ? 'text-neutral-950 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile capsule */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-850 px-2">
        <Link
          href="/settings"
          className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
        >
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-200">
              {profile.name}
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums">
              {profile.currentWeightKg} kg → {profile.targetWeightKg} kg
            </span>
          </div>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Active Plan" />
        </Link>
      </div>
    </aside>
  );
}
