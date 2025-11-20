import React, { useRef, useEffect } from 'react';

declare const QRCode: any;

interface QrCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipmentId: string | null;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, equipmentId }) => {
    const qrCodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && qrCodeRef.current && equipmentId && typeof QRCode !== 'undefined') {
            qrCodeRef.current.innerHTML = '';
            new QRCode(qrCodeRef.current, {
                text: equipmentId,
                width: 192,
                height: 192,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, [isOpen, equipmentId]);

    if (!isOpen || !equipmentId) return null;

    const handleShare = async () => {
        if (!equipmentId) return;
        const canvas = qrCodeRef.current?.querySelector('canvas');
        if (navigator.share && canvas) {
            try {
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                if (blob) {
                    const file = new File([blob], `${equipmentId}.png`, { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file], title: `QR Code: ${equipmentId}` });
                        return;
                    }
                }
            } catch (error) { console.warn('Falha ao compartilhar imagem.', error); }
        }
        if (navigator.share) {
            await navigator.share({ title: `QR Code: ${equipmentId}`, text: `ID: ${equipmentId}` });
        } else {
            navigator.clipboard.writeText(equipmentId).then(() => alert('ID copiado!'));
        }
    };

    const handlePrint = () => {
        if (!equipmentId || !qrCodeRef.current) return;
        const canvas = qrCodeRef.current.querySelector('canvas');
        if (!canvas) return;
        const qrCodeDataUrl = canvas.toDataURL('image/png');
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Imprimir QR Code - ${equipmentId}</title>
                <style>body { font-family: sans-serif; text-align: center; margin-top: 50px; }</style></head><body>
                <h1>Equipamento: ${equipmentId}</h1><img src="${qrCodeDataUrl}" alt="QR Code" />
                <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
            </body></html>`);
            printWindow.document.close();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg p-6 max-w-sm w-full animate-fade-in-up relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-2 flex items-center justify-center size-9 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-bold text-text-light dark:text-text-dark text-center">QR Code do Equipamento</h3>
                    <p className="text-xl font-semibold text-primary dark:text-primary-dark mt-1 mb-4">{equipmentId}</p>
                    <div className="bg-white p-2 rounded-lg shadow-md">
                       <div ref={qrCodeRef} className="size-48 flex items-center justify-center text-xs text-gray-500">
                           {typeof QRCode === 'undefined' && 'Carregando...'}
                       </div>
                    </div>
                    <div className="flex w-full gap-3 mt-6">
                        <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-lg bg-gray-100 dark:bg-white/10 text-text-light dark:text-text-dark font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-white/20">
                            <span className="material-symbols-outlined">share</span>
                            Compartilhar
                        </button>
                        <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-lg bg-gray-100 dark:bg-white/10 text-text-light dark:text-text-dark font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-white/20">
                            <span className="material-symbols-outlined">print</span>
                            Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QrCodeModal;