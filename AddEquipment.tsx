import React, { useState, useEffect, useRef } from 'react';
import type { NewEquipment } from './types';
import QrScanner from './components/QrScanner';

declare const QRCode: any;

interface AddEquipmentProps {
  existingCategories: string[];
  onSave: (equipment: NewEquipment) => void;
  onCancel: () => void;
  onAddNewCategory: () => void;
  newlyAddedCategory: string | null;
}

const AddEquipment: React.FC<AddEquipmentProps> = ({ existingCategories, onSave, onCancel, onAddNewCategory, newlyAddedCategory }) => {
    const [equipmentId, setEquipmentId] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState(newlyAddedCategory || existingCategories[0] || '');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const qrCodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (equipmentId.trim() && qrCodeRef.current && typeof QRCode !== 'undefined') {
            qrCodeRef.current.innerHTML = '';
             new QRCode(qrCodeRef.current, {
                text: equipmentId.trim().toUpperCase(),
                width: 160,
                height: 160,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else if (qrCodeRef.current) {
            qrCodeRef.current.innerHTML = '';
        }
    }, [equipmentId]);

    useEffect(() => {
        if (newlyAddedCategory) {
            setCategory(newlyAddedCategory);
        }
    }, [newlyAddedCategory]);

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitizedValue = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        setEquipmentId(sanitizedValue);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === 'add_new_category') {
            onAddNewCategory();
        } else {
            setCategory(e.target.value);
        }
    };

    const handleSave = () => {
        const trimmedId = equipmentId.trim();
        const trimmedLocation = location.trim();
        if(trimmedId && trimmedLocation && category) {
            onSave({
                id: trimmedId,
                location: trimmedLocation,
                category: category,
            });
        } else {
            alert("Por favor, preencha todos os campos.");
        }
    };

    const handleScanSuccess = (decodedText: string) => {
        setEquipmentId(decodedText);
        setIsScannerOpen(false);
    };

    return (
        <div className="fixed inset-0 bg-background-light dark:bg-background-dark z-30 flex flex-col">
          {isScannerOpen && <QrScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />}
          <header className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 border-b border-border-light dark:border-border-dark">
              <button onClick={onCancel} className="flex size-10 items-center justify-center -ml-2">
                <span className="material-symbols-outlined text-2xl">arrow_back</span>
              </button>
              <h2 className="text-lg font-bold flex-1 text-center">Adicionar Equipamento</h2>
              <div className="w-10"></div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                  <div>
                      <label className="mb-2 block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark" htmlFor="equipment-id">ID do Equipamento</label>
                      <div className="relative">
                          <input value={equipmentId} onChange={handleIdChange} className="w-full rounded-lg border-border-light bg-card-light py-3 pl-4 pr-12 text-base text-text-light placeholder:text-text-secondary-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark dark:placeholder:text-text-secondary-dark" id="equipment-id" placeholder="Ex: EXT-PRD1-AND2-006" type="text" />
                          <button onClick={() => setIsScannerOpen(true)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary dark:text-primary-dark">
                              <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                          </button>
                      </div>
                  </div>
                  {equipmentId.trim() ? (
                    <div className="flex flex-col items-center justify-center rounded-xl bg-card-light dark:bg-card-dark p-6 text-center">
                        <div className="bg-white p-2 rounded-lg">
                            <div ref={qrCodeRef} className="h-40 w-40" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-text-light dark:text-text-dark">{equipmentId.toUpperCase()}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-light dark:border-border-dark bg-card-light/50 dark:bg-card-dark/50 p-6 text-center h-[236px]">
                        <span className="material-symbols-outlined text-6xl text-text-secondary-light dark:text-text-secondary-dark">qr_code</span>
                        <p className="mt-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">Digite um ID para gerar o QR code.</p>
                    </div>
                  )}

                  <div>
                      <label className="mb-2 block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark" htmlFor="location">Localização</label>
                      <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg border-border-light bg-card-light py-3 px-4 text-base text-text-light placeholder:text-text-secondary-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark dark:placeholder:text-text-secondary-dark" id="location" placeholder="Prédio, Andar, Sala" type="text" />
                  </div>
                  <div>
                      <label className="mb-2 block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark" htmlFor="category">Categoria</label>
                      <div className="relative">
                          <select value={category} onChange={handleCategoryChange} className="w-full appearance-none rounded-lg border-border-light bg-card-light py-3 pl-4 pr-10 text-base text-text-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark" id="category">
                              {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              <option className="font-medium text-primary" value="add_new_category">Adicionar Nova Categoria...</option>
                          </select>
                          <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">expand_more</span>
                      </div>
                  </div>
              </div>
          </main>
          
          <footer className="sticky bottom-0 z-10 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 border-t border-border-light dark:border-border-dark">
              <button onClick={handleSave} className="w-full flex items-center justify-center rounded-xl h-12 bg-primary dark:bg-primary-dark text-white text-base font-bold">Salvar Equipamento</button>
          </footer>
        </div>
    );
};

export default AddEquipment;