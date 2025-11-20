import React, { useState } from 'react';
import { generatePdfReport } from '../pdfGenerator';
import type { Client, EquipmentCategory, UserProfile } from '../types';

interface ActionButtonsProps {
  onNavigate: (page: string) => void;
  client: Client;
  equipmentData: EquipmentCategory[];
  user: UserProfile;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onNavigate, client, equipmentData, user }) => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isGeneratingCsv, setIsGeneratingCsv] = useState(false);

    const handleGeneratePdf = async () => {
        if (isGeneratingPdf) return;
        setIsGeneratingPdf(true);
        try {
            await generatePdfReport(client, equipmentData, user);
        } catch (e) {
            console.error("Falha na geração do PDF", e);
            alert("Desculpe, não foi possível gerar o relatório em PDF.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleGenerateCsv = () => {
      if (isGeneratingCsv) return;
      setIsGeneratingCsv(true);

      try {
        const allItems = equipmentData.flatMap(cat => cat.items);
        const totalItems = allItems.length;
        const okItems = allItems.filter(i => i.status === 'ok').length;
        const failItems = allItems.filter(i => i.status === 'fail').length;
        const maintenanceItems = allItems.filter(i => i.status === 'maintenance').length;

        const formatRow = (row: (string | number)[]) => row.map(value => {
            const strValue = String(value ?? '').replace(/"/g, '""');
            return `"${strValue}"`;
        }).join(',');

        const summaryRows = [
            ['Relatório de Vistoria de Equipamentos'], [],
            ['Cliente', client.name],
            ['Data do Relatório', new Date().toLocaleDateString('pt-BR')],
            ['Técnico Responsável', user.name], [],
            ['Resumo Geral'],
            ['Total de Itens Vistoriados', totalItems],
            ['Itens OK', okItems],
            ['Falhas Críticas', failItems],
            ['Necessita Manutenção', maintenanceItems], []
        ];
        
        const detailHeader = ['Categoria', 'ID do Equipamento', 'Localização', 'Status', 'Última Vistoria'];
        const statusMap: { [key: string]: string } = { ok: 'OK', fail: 'Falha', maintenance: 'Manutenção' };
        
        const detailRows = equipmentData.flatMap(category =>
          category.items.map(item => [
            category.name, item.id, item.location,
            statusMap[item.status] || item.status,
            item.lastInspected
          ])
        );

        const allRows = [...summaryRows, detailHeader, ...detailRows];
        const csvContent = allRows.map(formatRow).join('\n');
        
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_equipamentos_${client.name.replace(/\s/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

      } catch (e) {
        console.error("Falha na geração do CSV", e);
        alert("Desculpe, não foi possível gerar o arquivo CSV.");
      } finally {
        setIsGeneratingCsv(false);
      }
    };

  return (
    <div className="p-4">
      <div className="flex flex-col items-stretch gap-3">
        <button 
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="flex w-full items-center justify-center rounded-xl h-12 px-5 bg-card-light dark:bg-card-dark text-primary dark:text-primary-dark text-base font-semibold border border-border-light dark:border-border-dark disabled:opacity-50 disabled:cursor-wait">
          <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Gerar Relatório PDF'}</span>
        </button>
        <button
            onClick={handleGenerateCsv}
            disabled={isGeneratingCsv}
            className="flex w-full items-center justify-center rounded-xl h-12 px-5 bg-card-light dark:bg-card-dark text-primary dark:text-primary-dark text-base font-semibold border border-border-light dark:border-border-dark disabled:opacity-50 disabled:cursor-wait">
          <span>{isGeneratingCsv ? 'Exportando...' : 'Exportar para CSV'}</span>
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
