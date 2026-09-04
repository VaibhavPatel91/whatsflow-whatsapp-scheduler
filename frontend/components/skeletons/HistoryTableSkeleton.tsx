import React from 'react';
import { Skeleton } from './Skeleton';

export function HistoryTableSkeleton() {
  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 bg-slate-950/80 border-b border-slate-800">
        <Skeleton className="w-48 h-4" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-slate-800/50">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-20 h-6 rounded-full" />
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-28 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
