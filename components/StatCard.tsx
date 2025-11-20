import React from 'react';
import type { Stat } from '../types';

interface StatCardProps {
  stat: Stat;
}

const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const variants = {
    success: {
      value: "text-success",
      icon: "text-success",
    },
    critical: {
      value: "text-danger",
      icon: "text-danger",
    },
    warning: {
      value: "text-warning",
      icon: "text-warning",
    },
  };

  const currentVariant = variants[stat.variant];

  return (
    <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-4 bg-card-light dark:bg-card-dark shadow-sm">
      <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-medium flex items-center gap-2">
        <span className={`material-symbols-outlined ${currentVariant.icon} text-xl`}>{stat.icon}</span>
        {stat.label}
      </p>
      <p className={`${currentVariant.value} text-3xl font-bold`}>{stat.value}</p>
    </div>
  );
};

export default StatCard;