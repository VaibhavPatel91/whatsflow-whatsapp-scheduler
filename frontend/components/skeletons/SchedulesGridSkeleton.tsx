import React from 'react';
import { Skeleton } from './Skeleton';

export function SchedulesGridSkeleton() {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Skeleton className="w-5 h-5 rounded-md" />
          <Skeleton className="w-48 h-5" />
          <Skeleton className="w-6 h-5 rounded-full" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-28 h-9 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-32 h-4" />
              </div>
              <Skeleton className="w-16 h-6 rounded-full" />
            </div>
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
              <Skeleton className="w-3/4 h-3.5" />
              <Skeleton className="w-full h-10 rounded-md" />
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex justify-between">
              <Skeleton className="w-14 h-4" />
              <Skeleton className="w-24 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
