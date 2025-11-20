import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { ChecklistItem, ChecklistEquipment, ScannedEquipment, EquipmentCategory, InspectionRecord } from './types';
import QrScanner from './components/QrScanner';

declare const QRCode: any;

interface ChecklistProps {
  initialEquipment: ChecklistEquipment;
  checklistData: ChecklistItem[];
  navigateTo: (page: string) => void;
  equipmentData: EquipmentCategory[];
  offline: boolean;
  onSaveInspection: (inspectionData: Omit<InspectionRecord, 'id' | 'inspectionDate' | 'technicianId'>) => Promise<boolean>;
}

type Status = 'OK' | 'Falha' | 'Pendente';

const CameraModal = ({ isOpen, onClose, onCapture }: { isOpen: boolean, onClose: () => void, onCapture: (image: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Erro ao acessar a câmera:", err);
          alert("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
          onClose();
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, onClose]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-lg p-4">
        <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
        <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
          <button onClick={handleCapture} className="p-4 bg-primary rounded-full text-white">
            <span className="material-symbols-outlined">photo_camera</span>
          </button>
          <button onClick={onClose} className="p-4 bg-danger rounded-full text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    </div>
  );
};


const Checklist: React.FC<ChecklistProps> = ({ initialEquipment, checklistData, navigateTo, equipmentData, offline, onSaveInspection }) => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(checklistData);
  const [status, setStatus] = useState<Status>('Pendente');
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [generalObservations, setGeneralObservations] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState<ChecklistEquipment | null>(initialEquipment);
  const [searchInput, setSearchInput] = useState('');
  type SearchStatus = 'idle' | 'loading' | 'success' | 'error';
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);


  const handleCheckChange = (id: string) => {
    setChecklistItems(
      checklistItems.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };
  
  const completedCount = useMemo(() => checklistItems.filter(item => item.checked).length, [checklistItems]);
  const progress = (completedCount / checklistItems.length) * 100;
  
  const handlePhotoCapture = (image: string) => {
    setEvidencePhoto(image);
    setIsCameraOpen(false);
  };
  
  const processScannedData = (data: ScannedEquipment) => {
      const [building, floor, room] = data.item.location.split(',').map(s => s.trim());
      setCurrentEquipment({
          id: data.item.id,
          name: `${data.categoryName}`,
          building: building || 'N/A',
          floor: floor || 'N/A',
          room: room || 'N/A',
          lastInspected: data.item.lastInspected,
          lastInspector: "J. Doe", // Placeholder
          lastStatus: data.item.status === 'ok' ? 'OK' : data.item.status === 'fail' ? 'Falha' : 'Pendente'
      });
      setSearchStatus('success');
  }

  const findEquipment = async (equipmentId: string) => {
    if (!equipmentId) {
        setCurrentEquipment(initialEquipment);
        setSearchStatus('idle');
        return;
    }
    setSearchStatus('loading');
    setCurrentEquipment(null);

    try {
        if (offline) {
            let found: ScannedEquipment | null = null;
            for (const category of equipmentData) {
                const item = category.items.find(i => i.id === equipmentId);
                if (item) {
                    found = {
                        categoryName: category.name,
                        categoryIcon: category.icon,
                        item: item
                    };
                    break;
                }
            }
            if (found) {
                processScannedData(found);
            } else {
                throw new Error("Equipamento não encontrado nos dados locais.");
            }
        } else {
            const response = await fetch(`/api/equipment/${equipmentId}`);
            if(!response.ok) {
                throw new Error("Equipamento não encontrado no servidor.");
            }
            const data: ScannedEquipment = await response.json();
            processScannedData(data);
        }
    } catch (error: any) {
        console.error(error);
        setSearchStatus('error');
        setCurrentEquipment(null);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        findEquipment(searchInput.trim().toUpperCase());
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, equipmentData, offline, initialEquipment]);

  useEffect(() => {
    if ((searchStatus === 'idle' || searchStatus === 'success') && currentEquipment && qrCodeRef.current && typeof QRCode !== 'undefined') {
        qrCodeRef.current.innerHTML = '';
        new QRCode(qrCodeRef.current, {
            text: currentEquipment.id,
            width: 96,
            height: 96,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
  }, [currentEquipment, searchStatus]);

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    setSearchInput(decodedText);
  };
  
  const handleSaveChecklist = async () => {
    if (!currentEquipment || isSaving) return;
    if (status === 'Falha' && !evidencePhoto) {
      alert('É obrigatório adicionar uma foto de evidência para o status "Falha".');
      return;
    }
    
    setIsSaving(true);
    
    const inspectionData = {
      equipmentId: currentEquipment.id,
      status: status,
      checklistItems: checklistItems,
      evidencePhoto: evidencePhoto,
      observations: observations,
      generalObservations: generalObservations,
    };
    
    const success = await onSaveInspection(inspectionData);

    setIsSaving(false);

    if (success) {
      alert('Vistoria salva com sucesso!');
      navigateTo('Início');
    }
  };

  const statusStyles: { [key in Status]: { base: string, active: string } } = {
    OK: { base: 'bg-success/10 text-success dark:bg-success/20 dark:text-success', active: 'bg-success text-white border-success' },
    Falha: { base: 'bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger', active: 'bg-danger text-white border-danger' },
    Pendente: { base: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning', active: 'bg-warning text-black border-warning' },
  };

  return (
    <div className="flex-1 flex flex-col">
      {isScannerOpen && <QrScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />}
      <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handlePhotoCapture} />
      
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 border-b border-border-light dark:border-border-dark">
        <button onClick={() => navigateTo('Início')} className="flex size-10 items-center justify-center -ml-2">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold flex-1 text-center">Checklist de Vistoria</h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">search</span>
          <input 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={searchStatus === 'loading'}
            className="w-full rounded-lg border-border-light bg-card-light py-3 pl-10 pr-12 text-base text-text-light placeholder:text-text-secondary-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark dark:placeholder:text-text-secondary-dark" 
            placeholder={searchStatus === 'loading' ? 'Buscando...' : 'Buscar por ID do equipamento'}
          />
          <button onClick={() => setIsScannerOpen(true)} disabled={searchStatus === 'loading'} className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
            <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
          </button>
        </div>
        
        {searchStatus === 'loading' && <p className="text-center py-4 text-text-secondary-light">Buscando equipamento...</p>}
        {searchStatus === 'error' && <p className="text-center py-4 text-danger">Equipamento não encontrado.</p>}

        {(searchStatus === 'idle' || searchStatus === 'success') && currentEquipment && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Equipment Info Card */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <h2 className="font-bold text-lg text-text-light dark:text-text-dark">{currentEquipment.name}</h2>
                        <p className="font-semibold text-primary dark:text-primary-dark">{currentEquipment.id}</p>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">{currentEquipment.building}, {currentEquipment.floor}, {currentEquipment.room}</p>
                    </div>
                    <div className="bg-white p-1 rounded-md shadow-sm">
                        <div ref={qrCodeRef} className="size-24" />
                    </div>
                </div>
            </div>

            {/* Checklist Items Card */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-text-light dark:text-text-dark">Itens de Verificação</h3>
                <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{completedCount}/{checklistItems.length}</p>
              </div>
              <div className="w-full bg-background-light dark:bg-background-dark rounded-full h-2 mb-4">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="space-y-2">
                {checklistItems.map(item => (
                  <label key={item.id} htmlFor={item.id} className="flex items-center justify-between bg-background-light dark:bg-background-dark p-3 rounded-lg">
                    <span className="text-text-light dark:text-text-dark flex-1 pr-4">{item.label}</span>
                    <input checked={item.checked} onChange={() => handleCheckChange(item.id)} className="form-checkbox size-6 rounded-md text-primary bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-primary" id={item.id} type="checkbox"/>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Final Status Card */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm p-4">
              <h3 className="font-bold text-text-light dark:text-text-dark mb-4">Situação Final da Vistoria</h3>
              <div className="grid grid-cols-3 gap-2">
                  {(['OK', 'Falha', 'Pendente'] as Status[]).map(s => (
                      <button key={s} onClick={() => setStatus(s)} className={`flex items-center justify-center rounded-lg h-12 px-2 text-sm font-bold border-2 transition-colors ${status === s ? statusStyles[s].active : `${statusStyles[s].base} border-transparent`}`}>
                          {s}
                      </button>
                  ))}
              </div>
            </div>

            {/* Failure Details Card */}
            {status === 'Falha' && (
              <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm p-4 border border-danger/50 animate-fade-in-up">
                <h3 className="font-bold text-danger mb-4">Detalhes da Falha</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Foto de Evidência (Obrigatória)</label>
                    <div className="flex items-center gap-4">
                       <button onClick={() => setIsCameraOpen(true)} className="flex flex-col items-center justify-center size-24 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                          <span className="text-xs font-medium">{evidencePhoto ? 'Alterar' : 'Tirar Foto'}</span>
                        </button>
                      {evidencePhoto && <img src={evidencePhoto} alt="Evidência" className="size-24 rounded-lg object-cover" />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Observações da Falha</label>
                    <textarea value={observations} onChange={(e) => setObservations(e.target.value)} className="w-full h-24 rounded-lg p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-primary focus:border-primary" placeholder="Descreva o problema..."></textarea>
                  </div>
                </div>
              </div>
            )}
            
            {/* General Observations Card */}
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-sm p-4">
              <h3 className="font-bold text-text-light dark:text-text-dark mb-2">Observações Gerais</h3>
              <textarea value={generalObservations} onChange={(e) => setGeneralObservations(e.target.value)} className="w-full h-28 rounded-lg p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-primary focus:border-primary" placeholder="Adicione notas adicionais aqui..."></textarea>
            </div>

            <div className="pt-4">
              <button onClick={handleSaveChecklist} disabled={isSaving || !currentEquipment} className="w-full flex items-center justify-center rounded-xl h-14 px-5 bg-primary dark:bg-primary-dark text-white text-base font-bold shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-wait">
                {isSaving ? 'Salvando...' : 'Concluir e Salvar Vistoria'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Checklist;