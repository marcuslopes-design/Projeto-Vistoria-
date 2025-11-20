import React, { useState } from 'react';
import type { InspectionRecord, Equipment } from '../types';

interface InspectionDetailModalProps {
  inspection: InspectionRecord;
  equipment: Equipment | null;
  onClose: () => void;
}

const PhotoViewer = ({ src, onClose }: { src: string, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
        <img src={src} alt="Evidência em tela cheia" className="max-w-full max-h-full rounded-lg" />
        <button className="absolute top-4 right-4 text-white text-3xl">&times;</button>
    </div>
);


const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({ inspection, equipment, onClose }) => {
    const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);

    const StatusBadge: React.FC<{ status: 'OK' | 'Falha' | 'Pendente' }> = ({ status }) => {
        const styles = {
          'OK': 'bg-success/10 text-success',
          'Falha': 'bg-danger/10 text-danger',
          'Pendente': 'bg-warning/10 text-warning',
        };
        return (
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
            {status}
          </span>
        );
    };

    return (
        <>
        {isPhotoViewerOpen && inspection.evidencePhoto && <PhotoViewer src={inspection.evidencePhoto} onClose={() => setIsPhotoViewerOpen(false)} />}
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg max-w-lg w-full max-h-[90dvh] flex flex-col animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                    <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Detalhes da Vistoria</h3>
                    <button onClick={onClose} className="flex items-center justify-center size-8 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 space-y-6">
                    <section>
                        <h4 className="font-semibold text-text-secondary-light dark:text-text-secondary-dark text-sm mb-2">Equipamento</h4>
                        <div className="bg-background-light dark:bg-background-dark p-3 rounded-lg space-y-1 text-sm">
                            <p><strong>ID:</strong> {inspection.equipmentId}</p>
                            <p><strong>Localização:</strong> {equipment?.location || 'N/A'}</p>
                            <p><strong>Data da Vistoria:</strong> {new Date(inspection.inspectionDate).toLocaleString('pt-BR')}</p>
                            <p className="flex items-center gap-2"><strong>Status Final:</strong> <StatusBadge status={inspection.status} /></p>
                        </div>
                    </section>
                    
                    <section>
                         <h4 className="font-semibold text-text-secondary-light dark:text-text-secondary-dark text-sm mb-2">Itens Verificados</h4>
                         <ul className="space-y-2">
                            {inspection.checklistItems.map(item => (
                                <li key={item.id} className="flex items-center justify-between bg-background-light dark:bg-background-dark p-2 rounded-md text-sm">
                                    <span className="flex-1 pr-2">{item.label}</span>
                                    {item.checked ? (
                                        <span className="material-symbols-outlined text-success">check_circle</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-danger">cancel</span>
                                    )}
                                </li>
                            ))}
                         </ul>
                    </section>

                    <section>
                        <h4 className="font-semibold text-text-secondary-light dark:text-text-secondary-dark text-sm mb-2">Observações</h4>
                         <div className="bg-background-light dark:bg-background-dark p-3 rounded-lg text-sm space-y-3">
                            {inspection.observations && (
                                <div>
                                    <p className="font-medium">Específicas (Falha):</p>
                                    <p className="whitespace-pre-wrap text-text-secondary-light dark:text-text-secondary-dark">{inspection.observations}</p>
                                </div>
                            )}
                             {inspection.generalObservations && (
                                <div>
                                    <p className="font-medium">Gerais:</p>
                                    <p className="whitespace-pre-wrap text-text-secondary-light dark:text-text-secondary-dark">{inspection.generalObservations}</p>
                                </div>
                            )}
                            {!inspection.observations && !inspection.generalObservations && (
                                <p className="text-text-secondary-light dark:text-text-secondary-dark italic">Nenhuma observação registrada.</p>
                            )}
                         </div>
                    </section>
                    
                    {inspection.evidencePhoto && (
                        <section>
                            <h4 className="font-semibold text-text-secondary-light dark:text-text-secondary-dark text-sm mb-2">Foto de Evidência</h4>
                            <img 
                                src={inspection.evidencePhoto}
                                alt="Foto de evidência da vistoria"
                                className="w-32 h-32 object-cover rounded-lg cursor-pointer"
                                onClick={() => setIsPhotoViewerOpen(true)}
                            />
                        </section>
                    )}
                </main>
            </div>
        </div>
        </>
    );
};

export default InspectionDetailModal;