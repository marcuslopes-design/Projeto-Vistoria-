import React, { useState, useMemo } from 'react';
import type { InspectionRecord, EquipmentCategory, Equipment } from './types';
import InspectionDetailModal from './components/InspectionDetailModal';

interface HistoryProps {
  inspectionHistory: InspectionRecord[];
  equipmentData: EquipmentCategory[];
  navigateTo: (page: string) => void;
}

const History: React.FC<HistoryProps> = ({ inspectionHistory, equipmentData, navigateTo }) => {
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);

  const equipmentMap = useMemo(() => {
    const map = new Map<string, Equipment>();
    equipmentData.forEach(category => {
      category.items.forEach(item => {
        map.set(item.id, item);
      });
    });
    return map;
  }, [equipmentData]);
  
  const sortedHistory = useMemo(() => {
    return [...inspectionHistory].sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime());
  }, [inspectionHistory]);

  const handleViewDetails = (inspection: InspectionRecord) => {
    setSelectedInspection(inspection);
  };

  const handleCloseModal = () => {
    setSelectedInspection(null);
  };

  const StatusBadge: React.FC<{ status: 'OK' | 'Falha' | 'Pendente' }> = ({ status }) => {
    const styles = {
      'OK': 'bg-success/10 text-success dark:text-success',
      'Falha': 'bg-danger/10 text-danger dark:text-danger',
      'Pendente': 'bg-warning/10 text-warning dark:text-warning',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  };
  
  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 border-b border-border-light dark:border-border-dark">
        <div className="size-10"></div>
        <h1 className="text-lg font-bold flex-1 text-center">Histórico de Vistorias</h1>
        <div className="size-10"></div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {sortedHistory.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center">
            <span className="material-symbols-outlined text-6xl text-text-secondary-light dark:text-text-secondary-dark">history_toggle_off</span>
            <p className="mt-4 text-text-light dark:text-text-dark">Nenhuma vistoria foi registrada ainda.</p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Complete um checklist para ver o registro aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedHistory.map(inspection => {
              const equipment = equipmentMap.get(inspection.equipmentId);
              return (
                <button 
                  key={inspection.id}
                  onClick={() => handleViewDetails(inspection)}
                  className="w-full bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-text-light dark:text-text-dark">{inspection.equipmentId}</p>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{equipment?.location || 'Localização desconhecida'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={inspection.status} />
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                            {new Date(inspection.inspectionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
      {selectedInspection && (
        <InspectionDetailModal 
          inspection={selectedInspection}
          equipment={equipmentMap.get(selectedInspection.equipmentId) || null}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default History;