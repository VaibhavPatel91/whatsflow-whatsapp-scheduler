import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={`animate-pulse bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 rounded-xl ${className}`}
    />
  );
}
