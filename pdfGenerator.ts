import type { Client, EquipmentCategory, UserProfile } from './types';

// Helper to format date
const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
};

const getStatusClassAndText = (status: 'ok' | 'fail' | 'maintenance') => {
    switch (status) {
        case 'ok': return { class: 'status-ok', text: 'OK' };
        case 'fail': return { class: 'status-fail', text: 'Falha' };
        case 'maintenance': return { class: 'status-pending', text: 'Manutenção' };
        default: return { class: '', text: '' };
    }
}

// Helper to convert image URL to Base64
const imageToBase64 = async (url: string) => {
    try {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
           throw new Error(`Failed to fetch image via proxy from ${url}`);
        }
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Falha ao converter imagem para Base64", error);
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    }
};

const loadCompanyLogoAsBase64 = async () => {
    // A simple SVG placeholder to make it clear where the logo should go.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
        <rect width="120" height="40" fill="#E5E7EB"/>
        <text x="60" y="25" font-family="sans-serif" font-size="12" fill="#9CA3AF" text-anchor="middle">Seu Logo Aqui</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const generatePdfReport = async (
    client: Client, 
    equipmentData: EquipmentCategory[], 
    user: UserProfile
) => {
    const jspdfModule = (window as any).jspdf;
    const html2canvas = (window as any).html2canvas;
    
    if (!jspdfModule || !html2canvas) {
        alert('Bibliotecas de geração de PDF não foram carregadas.');
        return;
    }
    const { jsPDF } = jspdfModule;

    try {
        const response = await fetch('./ReportTemplate.html');
        const template = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(template, 'text/html');

        // --- Data Calculation ---
        const allItems = equipmentData.flatMap(cat => cat.items);
        const totalItems = allItems.length;
        const failItems = allItems.filter(item => item.status === 'fail').length;
        const pendingItems = allItems.filter(item => item.status === 'maintenance').length;
        
        let overallStatusClass: 'approved' | 'approved-issues' | 'failed' = 'approved';
        let statusText = "Aprovado";
        let statusDesc = "Todos os equipamentos estão em conformidade.";

        if (failItems > 0) {
            overallStatusClass = 'failed';
            statusText = "Reprovado";
            statusDesc = "Falhas críticas encontradas. Ação imediata é necessária.";
        } else if (pendingItems > 0) {
            overallStatusClass = 'approved-issues';
            statusText = "Aprovado com Ressalvas";
            statusDesc = "Ações de manutenção são necessárias para conformidade total.";
        }

        // --- Populate Template ---
        const logoBase64 = await loadCompanyLogoAsBase64();
        (doc.getElementById('company-logo') as HTMLImageElement).src = logoBase64;

        // Summary
        const summaryStatusDiv = doc.querySelector('.summary-overall-status')!;
        summaryStatusDiv.classList.remove('approved', 'approved-issues', 'failed');
        summaryStatusDiv.classList.add(overallStatusClass);
        doc.getElementById('overall-status-text')!.textContent = statusText;
        doc.getElementById('overall-status-desc')!.textContent = statusDesc;
        doc.getElementById('total-items')!.textContent = totalItems.toString();
        doc.getElementById('fail-items')!.textContent = failItems.toString();
        doc.getElementById('pending-items')!.textContent = pendingItems.toString();
        
        // Client/Tech Info
        doc.getElementById('client-name')!.textContent = client.name;
        doc.getElementById('client-address')!.textContent = client.address;
        doc.getElementById('tech-name')!.textContent = user.name;
        doc.getElementById('tech-id')!.textContent = user.technicianId;
        doc.getElementById('report-date')!.textContent = formatDate(new Date());

        // Equipment List
        const equipmentListSection = doc.getElementById('equipment-list')!;
        equipmentListSection.innerHTML = '<h2>Detalhamento dos Equipamentos</h2>'; // Clear template data

        equipmentData.forEach(category => {
            if (category.items.length === 0) return;
            
            const h3 = doc.createElement('h3');
            h3.className = 'category-title';
            h3.textContent = category.name;
            equipmentListSection.appendChild(h3);

            const table = doc.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Localização</th>
                        <th>Status</th>
                    </tr>
                </thead>
            `;
            const tbody = doc.createElement('tbody');
            category.items.forEach(item => {
                const statusInfo = getStatusClassAndText(item.status);
                const tr = doc.createElement('tr');
                tr.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.location}</td>
                    <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            equipmentListSection.appendChild(table);
        });

        // Non-conformities
        const nonConformitiesSection = doc.getElementById('non-conformities')!;
        const failuresAndMaintenance = allItems.filter(item => item.status === 'fail' || item.status === 'maintenance');
        
        if (failuresAndMaintenance.length > 0) {
            nonConformitiesSection.style.display = 'block';
            nonConformitiesSection.innerHTML = '<h2>Não Conformidades e Ações Recomendadas</h2>';
            
            failuresAndMaintenance.forEach(item => {
                 const failureItem = doc.createElement('div');
                 failureItem.className = 'failure-item';
                 const statusInfo = getStatusClassAndText(item.status);
                 failureItem.innerHTML = `
                    <p><strong>ID:</strong> ${item.id} | <strong>Localização:</strong> ${item.location}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></p>
                    <p><strong>Recomendação:</strong> ${item.status === 'fail' ? 'Ação corretiva imediata é necessária.' : 'Manutenção preventiva recomendada.'}</p>
                 `;
                 nonConformitiesSection.appendChild(failureItem);
            });
        } else {
            nonConformitiesSection.style.display = 'none';
        }

        // Signatures
        doc.getElementById('signature-tech-name')!.textContent = user.name;
        doc.getElementById('signature-client-name')!.textContent = client.contactPerson;
        
        // --- Render to PDF ---
        const content = doc.body.querySelector('.container') as HTMLElement;
        if (!content) throw new Error('Container do template de PDF não encontrado');

        const tempContainer = doc.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '800px'; 
        tempContainer.appendChild(content);
        document.body.appendChild(tempContainer);

        const canvas = await html2canvas(content, { scale: 2, useCORS: true, windowWidth: 800 });
        document.body.removeChild(tempContainer);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Relatorio_${client.name.replace(/\s/g, '_')}_${formatDate(new Date())}.pdf`);

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Falha ao gerar o relatório em PDF.');
    }
};