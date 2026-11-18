import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'interactive';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default:
      'bg-neutral-50/60 dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-850 shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
    subtle:
      'bg-neutral-100/50 dark:bg-[#121212] border border-neutral-200/60 dark:border-neutral-800/60',
    interactive:
      'bg-neutral-50/60 dark:bg-[#0A0A0A] border border-neutral-200 dark:border-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-150 cursor-pointer',
  };

  return (
    <div
      className={clsx('rounded-2xl p-5 md:p-6 backdrop-blur-sm', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('flex flex-col space-y-1 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx('text-base md:text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx('text-xs md:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('space-y-4', className)} {...props}>
      {children}
    </div>
  );
}
