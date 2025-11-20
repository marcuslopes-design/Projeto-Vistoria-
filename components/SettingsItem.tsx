import React from 'react';
import type { SettingsItemType } from '../types';

interface SettingsItemProps {
  item: SettingsItemType;
  isChecked?: boolean;
  onToggle?: () => void;
}

const ToggleSwitch: React.FC<{ isChecked: boolean, onChange: () => void }> = ({ isChecked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={isChecked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
    </label>
);

const SettingsItem: React.FC<SettingsItemProps> = ({ item, isChecked = false, onToggle }) => {
    
  const content = (
    <div className="flex items-center gap-4 p-4 min-h-14 justify-between w-full">
        <div className="flex items-center gap-4">
            {item.icon && (
                <div className="text-text-dark flex items-center justify-center rounded-lg bg-primary/80 dark:bg-primary shrink-0 size-10">
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
            )}
            <p className="text-base font-medium text-text-light dark:text-text-dark flex-1 truncate">{item.label}</p>
        </div>

        <div className="shrink-0 text-text-secondary-light dark:text-text-secondary-dark">
            {item.type === 'link' && <span className="material-symbols-outlined text-2xl">chevron_right</span>}
            {item.type === 'toggle' && onToggle && <ToggleSwitch isChecked={isChecked} onChange={onToggle} />}
        </div>
    </div>
  );

  const containerClasses = "flex hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full";

  if (item.type === 'link') {
    return (
        <button 
            onClick={() => alert(`Funcionalidade '${item.label}' em desenvolvimento.`)} 
            className={containerClasses}
        >
            {content}
        </button>
    );
  }
  
  return <div className={containerClasses}>{content}</div>;
};

export default SettingsItem;