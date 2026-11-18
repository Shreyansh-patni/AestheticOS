'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';
import { StorageService } from '@/lib/storage';
import { ActiveWorkoutSession } from '@/types';
import { Dumbbell, ArrowRight } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveWorkoutSession | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleUpdate = () => {
      setActiveSession(StorageService.getActiveSession());
    };
    handleUpdate();
    window.addEventListener('aesthetic-storage-update', handleUpdate);
    return () => window.removeEventListener('aesthetic-storage-update', handleUpdate);
  }, []);

  // Format elapsed time if session active
  const isWorkoutPage = pathname === '/workout';

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Header />

        {/* Global floating bar if session active and NOT on /workout page */}
        {activeSession && activeSession.status === 'active' && !isWorkoutPage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <Dumbbell className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Active Session: {activeSession.title}
              </span>
            </div>
            <Link
              href="/workout"
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Resume Workout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
