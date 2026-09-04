import React from 'react';
import { Skeleton } from './Skeleton';

export function TimelineSkeleton() {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <Skeleton className="w-5 h-5 rounded-md" />
          <Skeleton className="w-44 h-5" />
        </div>
        <Skeleton className="w-32 h-4" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="w-36 h-4" />
                <Skeleton className="w-24 h-3" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="w-20 h-6 rounded-full" />
              <Skeleton className="w-28 h-3 hidden sm:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
