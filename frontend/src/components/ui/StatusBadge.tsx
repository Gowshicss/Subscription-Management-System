import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let styles = 'bg-gray-50 text-gray-700 border-gray-200';

  switch (normalized) {
    case 'ACTIVE':
    case 'PAID':
    case 'ACCEPTED':
    case 'PRESENT':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      break;
    case 'CONFIRMED':
    case 'SENT':
      styles = 'bg-blue-50 text-blue-700 border-blue-200/80';
      break;
    case 'PAUSED':
    case 'PARTIALLY_PAID':
    case 'LATE':
      styles = 'bg-amber-50 text-amber-700 border-amber-200/80';
      break;
    case 'OVERDUE':
    case 'CLOSED':
    case 'CANCELLED':
    case 'REJECTED':
    case 'EXPIRED':
      styles = 'bg-red-50 text-red-700 border-red-200/80';
      break;
    case 'DRAFT':
    case 'QUOTATION':
    default:
      styles = 'bg-purple-50 text-plum border-purple-200/80';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider rounded-full border uppercase ${sizeClass} ${styles}`}
    >
      {normalized}
    </span>
  );
};
