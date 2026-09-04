import React from 'react';
import { Skeleton } from './Skeleton';

export function WhatsAppStateSkeleton() {
  return (
    <div className="space-y-6">
      {/* WhatsApp Web State Card Skeleton */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-5 h-5 rounded-md" />
            <Skeleton className="w-36 h-4" />
          </div>
          <Skeleton className="w-7 h-7 rounded-lg" />
        </div>
        <div className="space-y-3">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-32 h-7 rounded-full" />
          <Skeleton className="w-full h-14 rounded-xl" />
        </div>
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <Skeleton className="w-full h-10 rounded-xl" />
          <div className="flex justify-between items-center">
            <Skeleton className="w-28 h-3" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>
      </div>

      {/* System Web State Card Skeleton */}
      <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-5 h-5 rounded-md" />
            <Skeleton className="w-32 h-4" />
          </div>
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
        <Skeleton className="w-full h-14 rounded-xl" />
      </div>
    </div>
  );
}
