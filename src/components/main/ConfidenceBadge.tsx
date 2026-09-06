// src/components/main/ConfidenceBadge.tsx

import React from 'react';

interface ConfidenceBadgeProps {
  score: number | undefined | null;
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score }) => {
  if (score === undefined || score === null) {
    return <span className='italic text-gray-400 font-sans'>Not available</span>;
  }

  const percentage = Math.round(score * 100);
  let textColor = 'text-green-700';
  let bgColor = 'bg-green-100';
  let ringColor = 'ring-green-200';

  if (percentage < 90) {
    textColor = 'text-yellow-700';
    bgColor = 'bg-yellow-100';
    ringColor = 'ring-yellow-300';
  }
  if (percentage < 80) {
    textColor = 'text-red-700';
    bgColor = 'bg-red-100';
    ringColor = 'ring-red-300';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 text-sm rounded-full ${textColor} ${bgColor} ring-1 ring-inset ${ringColor}`}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {percentage}% Confidence
    </div>
  );
};

export default ConfidenceBadge;