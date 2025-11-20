import React from 'react';
import type { EquipmentCategory as EquipmentCategoryType } from '../types';
import EquipmentItem from './EquipmentItem';

interface EquipmentCategoryProps {
  category: EquipmentCategoryType;
  onShowQrCode: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

const EquipmentCategory: React.FC<EquipmentCategoryProps> = ({ category, onShowQrCode, onDeleteItem }) => {
  return (
    <div className="flex flex-col bg-card-light dark:bg-card-dark rounded-xl shadow-sm overflow-hidden">
        <details className="group" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-4 py-3">
                <p className="text-text-light dark:text-text-dark text-base font-semibold">{`${category.name} (${category.items.length})`}</p>
                <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark group-open:rotate-180 transition-transform duration-200">expand_more</span>
            </summary>
            <div className="flex flex-col divide-y divide-border-light dark:divide-border-dark">
                {category.items.map(item => (
                    <EquipmentItem key={item.id} item={item} onShowQrCode={onShowQrCode} onDeleteItem={onDeleteItem} />
                ))}
            </div>
        </details>
    </div>
  );
};

export default EquipmentCategory;
