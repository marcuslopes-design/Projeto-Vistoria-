import React, { useState, useRef, useCallback } from 'react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  title: string;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSave, title }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setPreview(null);
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, []);

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Não foi possível obter o contexto do canvas'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // 85% de qualidade
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(new Error('Falha ao carregar a imagem para processamento.'));
            img.src = event.target?.result as string;
        };
        reader.onerror = (err) => reject(new Error('Falha ao ler o arquivo.'));
        reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPreview(null);
    const file = event.target.files?.[0];

    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      setIsProcessing(true);
      try {
        const optimizedDataUrl = await processImage(file);
        setPreview(optimizedDataUrl);
      } catch (err: any) {
        console.error("Falha no processamento da imagem:", err);
        setError(err.message || 'Falha ao processar a imagem.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSave = () => {
    if (preview && !error) {
      onSave(preview);
      resetState();
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg p-6 max-w-md w-full animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-text-light dark:text-text-dark">{title}</h3>
           <button onClick={handleClose} className="flex items-center justify-center size-8 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-border-light border-dashed rounded-lg cursor-pointer bg-background-light dark:bg-card-dark/50 hover:bg-gray-100 dark:border-border-dark dark:hover:bg-card-dark">
            {preview && !isProcessing && (
              <img src={preview} alt="Pré-visualização" className="w-full h-full object-contain rounded-lg p-2" />
            )}
            {isProcessing && (
                <div className="flex flex-col items-center justify-center text-center">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">Otimizando imagem...</p>
                </div>
            )}
            {!preview && !isProcessing && (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <span className="material-symbols-outlined text-4xl text-text-secondary-light dark:text-text-secondary-dark">cloud_upload</span>
                <p className="mb-2 text-sm text-text-secondary-light dark:text-text-secondary-dark"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">PNG, JPG (MAX. {MAX_FILE_SIZE_MB}MB)</p>
              </div>
            )}
            <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} ref={fileInputRef} disabled={isProcessing}/>
          </label>
          {error && <p className="text-sm text-danger text-center">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={handleClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-white/10 text-text-light dark:text-text-dark font-semibold">Cancelar</button>
          <button onClick={handleSave} disabled={!preview || !!error || isProcessing} className="px-4 py-2 rounded-lg bg-primary dark:bg-primary-dark text-white font-semibold disabled:opacity-50">Salvar</button>
        </div>
      </div>
    </div>
  );
};
export default UploadModal;