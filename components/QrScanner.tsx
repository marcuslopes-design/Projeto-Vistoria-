import React, { useEffect, useRef } from 'react';

declare const Html5Qrcode: any;

interface QrScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        const qrCodeScanner = new Html5Qrcode("qr-reader");
        scannerRef.current = qrCodeScanner;
        
        const qrCodeSuccessCallback = (decodedText: string) => {
            onScanSuccess(decodedText);
            qrCodeScanner.stop().catch((err: any) => console.error("Failed to stop scanner", err));
        };
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        qrCodeScanner.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined)
            .catch((err: any) => console.error("Unable to start scanning.", err));

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop()
                    .catch((err: any) => console.error("Failed to stop scanner on cleanup", err));
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
            <div id="qr-reader" className="w-full max-w-md bg-white rounded-lg overflow-hidden"></div>
            <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-danger text-white font-semibold rounded-lg"
            >
                Cancelar
            </button>
        </div>
    );
};

export default QrScanner;