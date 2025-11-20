import React, { useState, useEffect } from 'react';
import type { Inspection } from '../types';

interface ScheduleInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string, time: string) => void;
  currentInspection: Inspection;
}

const ptBrMonths: { [key: string]: number } = {
  'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
  'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
};

const parsePtBrDate = (dateStr: string): string => {
  try {
    const parts = dateStr.toLowerCase().split(' de ');
    if (parts.length !== 3) return '';
    const day = parseInt(parts[0], 10);
    const month = ptBrMonths[parts[1]];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    }
    return '';
  } catch {
    return '';
  }
};

const formatDateToPtBr = (dateInput: Date | string): string => {
    const date = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput;
    return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const ScheduleInspectionModal: React.FC<ScheduleInspectionModalProps> = ({ isOpen, onClose, onSave, currentInspection }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(parsePtBrDate(currentInspection.date));
      setTime(currentInspection.time);
    }
  }, [isOpen, currentInspection]);

  const handleSave = () => {
    if (date && time) {
      const formattedDate = formatDateToPtBr(date);
      onSave(formattedDate, time);
    } else {
      alert('Por favor, preencha a data e a hora.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg p-6 max-w-sm w-full animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Reagendar Vistoria</h3>
          <button onClick={onClose} className="flex items-center justify-center size-8 rounded-full text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="inspection-date" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Data</label>
            <input 
              type="date"
              id="inspection-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border-border-light bg-background-light py-2 px-3 text-base text-text-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-card-dark/50 dark:text-text-dark"
            />
          </div>
          <div>
            <label htmlFor="inspection-time" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Horário</label>
            <input 
              type="time"
              id="inspection-time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
               className="w-full rounded-lg border-border-light bg-background-light py-2 px-3 text-base text-text-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-card-dark/50 dark:text-text-dark"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-white/10 text-text-light dark:text-text-dark font-semibold">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary dark:bg-primary-dark text-white font-semibold">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInspectionModal;