import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'danger';
  trend?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'info',
  trend,
}) => {
  return (
    <div className="brutalist-card p-5 bg-white border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">{title}</span>
        {Icon && (
          <div className="p-2 rounded bg-surface-secondary text-plum">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight text-charcoal">{value}</div>
      {(subtitle || badge || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          {badge && (
            <span
              className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                badgeType === 'success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : badgeType === 'warning'
                  ? 'bg-amber-100 text-amber-800'
                  : badgeType === 'danger'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-teal-soft text-teal-dark'
              }`}
            >
              {badge}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
          {trend && <span className="font-medium text-emerald-600">{trend}</span>}
        </div>
      )}
    </div>
  );
};
