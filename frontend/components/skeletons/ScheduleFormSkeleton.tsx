import React from 'react';
import { Skeleton } from './Skeleton';

export function ScheduleFormSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
        <Skeleton className="w-48 h-6" />
        <Skeleton className="w-full h-4" />
      </div>
      <div className="bg-slate-900/40 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="space-y-2">
          <Skeleton className="w-36 h-4" />
          <Skeleton className="w-full h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-full h-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="w-full h-10 rounded-xl" />
          <Skeleton className="w-full h-10 rounded-xl" />
          <Skeleton className="w-full h-10 rounded-xl" />
          <Skeleton className="w-full h-10 rounded-xl" />
        </div>
        <Skeleton className="w-full h-12 rounded-xl" />
        <div className="flex items-center space-x-3">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="w-32 h-4" />
        </div>
        <Skeleton className="w-full h-12 rounded-xl" />
      </div>
    </div>
  );
}
