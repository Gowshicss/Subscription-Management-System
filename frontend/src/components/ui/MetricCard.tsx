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
    <div className="bg-white border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
          {title}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-[#FAF9F7] text-plum flex items-center justify-center shrink-0 border border-border-subtle">
            <Icon className="w-4 h-4 text-plum" />
          </div>
        )}
      </div>

      <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-charcoal">
        {value}
      </div>

      {(subtitle || badge || trend) && (
        <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center gap-2 text-xs text-muted">
          {badge && (
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
                badgeType === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : badgeType === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                  : badgeType === 'danger'
                  ? 'bg-red-50 text-red-700 border-red-200/60'
                  : 'bg-purple-50 text-plum border-purple-200/60'
              }`}
            >
              {badge}
            </span>
          )}
          {subtitle && <span className="text-[11px] font-medium text-muted truncate">{subtitle}</span>}
          {trend && <span className="font-semibold text-emerald-600 text-[11px]">{trend}</span>}
        </div>
      )}
    </div>
  );
};
