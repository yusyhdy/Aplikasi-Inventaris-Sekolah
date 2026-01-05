
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 text-${color.split('-')[1]}-600 dark:text-${color.split('-')[1]}-400 shadow-inner`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
