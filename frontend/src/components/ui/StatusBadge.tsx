import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let styles = 'bg-gray-100 text-gray-800 border-gray-200';

  switch (normalized) {
    case 'ACTIVE':
    case 'PAID':
    case 'ACCEPTED':
      styles = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      break;
    case 'CONFIRMED':
    case 'SENT':
      styles = 'bg-blue-50 text-blue-800 border-blue-200';
      break;
    case 'PAUSED':
    case 'PARTIALLY_PAID':
      styles = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'OVERDUE':
    case 'CLOSED':
    case 'CANCELLED':
    case 'REJECTED':
    case 'EXPIRED':
      styles = 'bg-red-50 text-red-800 border-red-300';
      break;
    case 'DRAFT':
    case 'QUOTATION':
    default:
      styles = 'bg-purple-50 text-purple-800 border-purple-200';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center font-semibold rounded border ${sizeClass} ${styles}`}>
      {normalized}
    </span>
  );
};

