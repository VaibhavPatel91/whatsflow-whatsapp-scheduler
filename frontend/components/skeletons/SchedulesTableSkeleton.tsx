import React from 'react';
import { Skeleton } from './Skeleton';

export function SchedulesTableSkeleton() {
  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-24 h-4" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-slate-800/50">
            <div className="flex items-center space-x-3 w-1/4">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <Skeleton className="w-32 h-4" />
            </div>
            <Skeleton className="w-1/3 h-4" />
            <Skeleton className="w-24 h-6 rounded-full" />
            <Skeleton className="w-20 h-4" />
            <div className="flex space-x-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
