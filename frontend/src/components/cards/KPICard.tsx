import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  format?: 'number' | 'percent' | 'decimal';
  icon: LucideIcon;
  trend?: number; // positive = up, negative = down
  color?: string;
  delay?: number;
}

export default function KPICard({ title, value, format = 'number', icon: Icon, trend, color = '#3b82f6', delay = 0 }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const duration = 1200;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(value * eased * 100) / 100);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  const formattedValue = () => {
    switch (format) {
      case 'percent': return `${(displayValue * 100).toFixed(1)}%`;
      case 'decimal': return displayValue.toFixed(2);
      default:
        if (displayValue >= 1000) return `${(displayValue / 1000).toFixed(1)}K`;
        return Math.round(displayValue).toString();
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className="glass-card-hover p-5 relative overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-medium text-gbrc-text-dim uppercase tracking-wider mb-2">{title}</p>
          <p className="kpi-value">{formattedValue()}</p>
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-gbrc-trusted' : 'text-gbrc-slashed'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}
