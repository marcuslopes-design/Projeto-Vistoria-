
import React from 'react';
import type { Stat } from '../types';
import StatCard from './StatCard';

interface StatsGridProps {
  stats: Stat[];
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <div className="flex flex-wrap gap-4 p-4 pt-0">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
};

export default StatsGrid;
