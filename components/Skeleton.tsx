import React from 'react';

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="skeleton skeleton-avatar" />
      <div className="flex-1">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text-sm" />
      </div>
    </div>
    <div className="skeleton skeleton-text" />
    <div className="skeleton skeleton-text" />
    <div className="skeleton skeleton-text-sm" style={{ width: '50%' }} />
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <div className="skeleton skeleton-title" style={{ width: '40%' }} />
    <div className="skeleton skeleton-chart" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-title" style={{ width: '35%' }} />
    <div className="space-y-3 mt-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="skeleton skeleton-text" style={{ width: '20%' }} />
          <div className="skeleton skeleton-text" style={{ width: '25%' }} />
          <div className="skeleton skeleton-text" style={{ width: '30%' }} />
          <div className="skeleton skeleton-text" style={{ width: '15%' }} />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton skeleton-text-sm" style={{ width: '60%' }} />
        <div className="skeleton" style={{ height: '28px', width: '50%', marginTop: '8px' }} />
      </div>
    ))}
  </div>
);

export const SkeletonGraph: React.FC = () => (
  <div className="skeleton-card h-[350px] flex items-center justify-center">
    <div className="text-center">
      <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 12px' }} />
      <div className="skeleton skeleton-text" style={{ width: '120px', margin: '0 auto' }} />
    </div>
  </div>
);

export const SkeletonPrediction: React.FC = () => (
  <div className="space-y-4">
    <SkeletonGraph />
    <div className="skeleton-card">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ width: '60px', height: '24px', borderRadius: '6px' }} />
        ))}
      </div>
    </div>
  </div>
);
