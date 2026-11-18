'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  Flame,
  Apple,
  TrendingUp,
  MoreHorizontal,
  BookOpen,
  History,
  Settings,
  Trophy,
  X,
} from 'lucide-react';
import clsx from 'clsx';

export function MobileNav() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const primaryTabs = [
    { name: 'Today', href: '/', icon: LayoutDashboard },
    { name: 'Workout', href: '/workout', icon: Dumbbell },
    { name: 'Cardio', href: '/cardio', icon: Flame },
    { name: 'Nutrition', href: '/nutrition', icon: Apple },
    { name: 'Progress', href: '/progress', icon: TrendingUp },
  ];

  const secondaryTabs = [
    { name: 'Exercise Library', href: '/exercises', icon: BookOpen, desc: 'Technique guides & substitutes' },
    { name: '30-Day Challenge', href: '/challenge', icon: Trophy, desc: 'Milestones & consistency track' },
    { name: 'Workout History', href: '/history', icon: History, desc: 'Past logs & personal records' },
    { name: 'Settings & Data', href: '/settings', icon: Settings, desc: 'Profile, targets, export/import' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-neutral-200/80 dark:border-neutral-850 px-2 py-1 safe-bottom select-none">
        <div className="flex items-center justify-around">
          {primaryTabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  'flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 relative min-w-[56px]',
                  isActive
                    ? 'text-neutral-950 dark:text-white'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                )}
              >
                <Icon className={clsx('w-5 h-5 mb-0.5', isActive && 'stroke-[2.5]')} />
                <span className={clsx('text-[10px] tracking-tight', isActive ? 'font-semibold' : 'font-medium')}>
                  {tab.name}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-neutral-950 dark:bg-white" />
                )}
              </Link>
            );
          })}

          {/* More Sheet Trigger */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={clsx(
              'flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 min-w-[56px]',
              secondaryTabs.some((t) => pathname === t.href)
                ? 'text-neutral-950 dark:text-white font-semibold'
                : 'text-neutral-400 dark:text-neutral-500'
            )}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* More Sheet Modal */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="fixed inset-0"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="relative bg-white dark:bg-[#121212] rounded-t-3xl border-t border-neutral-200 dark:border-neutral-800 p-6 space-y-4 safe-bottom animate-in slide-in-from-bottom duration-200 z-10 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-850">
              <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                More Features
              </span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {secondaryTabs.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={clsx(
                      'flex items-center gap-3.5 p-3 rounded-2xl border transition-all',
                      isActive
                        ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
                        : 'border-neutral-200/60 dark:border-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {item.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
