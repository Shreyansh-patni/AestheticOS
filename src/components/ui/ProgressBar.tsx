import React from 'react';
import clsx from 'clsx';

export interface ProgressBarProps {
  value: number; // current value
  max?: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, color = 'bg-emerald-500', className, showLabel }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={clsx('w-full', className)}>
      <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
        <div
          className={clsx('h-full transition-all duration-500 ease-out rounded-full', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
          <span>{Math.round(value)}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}
