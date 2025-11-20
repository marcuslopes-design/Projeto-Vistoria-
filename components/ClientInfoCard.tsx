import React, { useState } from 'react';
import type { Client } from '../types';
import UploadModal from './UploadModal';

interface ClientInfoCardProps {
  client: Client;
  onUpdateFloorPlan: (url: string) => void;
  navigateTo: (page: string) => void;
}

const ClientInfoCard: React.FC<ClientInfoCardProps> = ({ client, onUpdateFloorPlan, navigateTo }) => {
  const [isFloorPlanModalOpen, setIsFloorPlanModalOpen] = useState(false);

  const handleSaveFloorPlan = (dataUrl: string) => {
    onUpdateFloorPlan(dataUrl);
    setIsFloorPlanModalOpen(false);
  };
  
  const handleShare = async () => {
    if (!client.floorPlanUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Planta Baixa - ${client.name}`, url: client.floorPlanUrl });
      } catch (error) { console.error('Erro ao compartilhar:', error); }
    } else {
      try {
        await navigator.clipboard.writeText(client.floorPlanUrl);
        alert('URL da planta baixa copiada!');
      } catch (err) { alert('Não foi possível copiar o link.'); }
    }
  };

  return (
    <>
      <UploadModal isOpen={isFloorPlanModalOpen} onClose={() => setIsFloorPlanModalOpen(false)} onSave={handleSaveFloorPlan} title="Upload da Planta Baixa" />
      
      <div className="p-4 @container">
        <div className="rounded-xl shadow-sm bg-card-light dark:bg-card-dark overflow-hidden">
          <div className="p-4">
            <h2 className="text-xl font-bold text-text-light dark:text-text-dark">{client.name}</h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{client.address}</p>
            <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
                <button 
                    onClick={() => navigateTo('Checklist')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 dark:bg-primary-dark/20 h-10 text-primary dark:text-primary-dark font-semibold text-sm transition-colors hover:bg-primary/20 dark:hover:bg-primary-dark/30">
                    <span className="material-symbols-outlined text-lg">fact_check</span>
                    <span>Iniciar Checklist</span>
                </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientInfoCard;