import React from 'react';
import type { Equipment, EquipmentStatus } from '../types';

interface EquipmentItemProps {
  item: Equipment;
  onShowQrCode: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

const StatusBadge: React.FC<{ status: EquipmentStatus }> = ({ status }) => {
    const statusInfo = {
        ok: { text: 'OK', classes: 'bg-success/10 text-success' },
        fail: { text: 'Falha', classes: 'bg-danger/10 text-danger' },
        maintenance: { text: 'Manutenção', classes: 'bg-warning/10 text-warning' },
    };
    const currentStatus = statusInfo[status];
    return <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${currentStatus.classes}`}>{currentStatus.text}</div>;
};

const EquipmentItem: React.FC<EquipmentItemProps> = ({ item, onShowQrCode, onDeleteItem }) => {
  return (
    <div className="flex gap-4 p-4 items-center">
        <div className="flex-1 flex flex-col justify-center">
            <p className="text-text-light dark:text-text-dark text-base font-bold leading-normal">{item.id}</p>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">{item.location}</p>
            <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={item.status} />
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs">Vistoria: {item.lastInspected}</p>
            </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
             <button 
              onClick={() => onShowQrCode(item.id)} 
              className="flex items-center justify-center size-10 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label={`Mostrar QR Code para ${item.id}`}
            >
                <span className="material-symbols-outlined text-2xl">qr_code_2</span>
            </button>
            <button 
              onClick={() => onDeleteItem(item.id)} 
              className="flex items-center justify-center size-10 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-danger/10 hover:text-danger transition-colors"
              aria-label={`Excluir equipamento ${item.id}`}
            >
                <span className="material-symbols-outlined text-2xl">delete</span>
            </button>
        </div>
    </div>
  );
};

export default EquipmentItem;
