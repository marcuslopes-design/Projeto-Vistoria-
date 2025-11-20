import React, { useState, useMemo } from 'react';
import ClientInfoCard from './components/ClientInfoCard';
import StatsGrid from './components/StatsGrid';
import NextInspection from './components/NextInspection';
import ActionButtons from './components/ActionButtons';
import ScheduleInspectionModal from './components/ScheduleInspectionModal';
import EquipmentCategory from './components/EquipmentCategory';
import AddEquipment from './AddEquipment';
import AddCategory from './AddCategory';
import QrCodeModal from './components/QrCodeModal';
import type { AppData, NewEquipment } from './types';

type FilterType = 'Todos' | 'Falhas' | 'Manutenção' | 'OK';
type ViewType = 'list' | 'add' | 'add-category';

interface DashboardProps {
  appData: AppData;
  navigateTo: (page: string) => void;
  onUpdateFloorPlan: (url: string) => void;
  onScheduleInspection: (date: string, time: string) => Promise<boolean>;
  onAddEquipment: (equipment: NewEquipment) => Promise<boolean>;
  onSaveCategory: (categoryName: string) => Promise<{ name: string; icon: string; items: [] } | null>;
  onDeleteEquipment: (equipmentId: string) => Promise<void>;
  offline: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  appData,
  navigateTo,
  onUpdateFloorPlan,
  onScheduleInspection,
  onAddEquipment,
  onSaveCategory,
  onDeleteEquipment,
  offline,
}) => {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [view, setView] = useState<ViewType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [newlyAddedCategory, setNewlyAddedCategory] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const calculatedStats = useMemo(() => {
    const statsCopy = [...appData.stats];
    const failures = appData.equipmentData.flatMap(cat => cat.items.filter(item => item.status === 'fail')).length;
    const failureStat = statsCopy.find(s => s.label === "Falha de Equipamento");
    if (failureStat) {
      failureStat.value = failures;
    }
    return statsCopy;
  }, [appData.stats, appData.equipmentData]);

  const handleSaveSchedule = async (date: string, time: string) => {
    const success = await onScheduleInspection(date, time);
    if (success) {
      setIsScheduleModalOpen(false);
      alert('Vistoria reagendada com sucesso!');
    }
  };

  const filters: FilterType[] = ['Todos', 'Falhas', 'Manutenção', 'OK'];

  const filteredData = useMemo(() => {
    return appData.equipmentData.map(category => {
      const filteredItems = category.items.filter(item => {
        const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) || item.location.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = () => {
          switch(activeFilter) {
            case 'Falhas': return item.status === 'fail';
            case 'Manutenção': return item.status === 'maintenance';
            case 'OK': return item.status === 'ok';
            default: return true;
          }
        };

        return matchesSearch && matchesFilter();
      });

      return { ...category, items: filteredItems };
    }).filter(category => category.items.length > 0);
  }, [searchTerm, activeFilter, appData.equipmentData]);
  
  const handleShowQrCode = (id: string) => {
    setSelectedEquipmentId(id);
    setIsQrModalOpen(true);
  };
  
  const handleAddEquipmentSubmit = async (newEquipment: NewEquipment) => {
    const success = await onAddEquipment(newEquipment);
    if (success) {
      alert('Equipamento salvo com sucesso!');
      setNewlyAddedCategory(null);
      setView('list');
    }
  };
  
  const handleSaveCategorySubmit = async (categoryName: string) => {
    const newCategory = await onSaveCategory(categoryName);
    if(newCategory) {
      setNewlyAddedCategory(newCategory.name);
    }
    setView('add');
  };

  const handleDeleteRequest = (id: string) => {
    setItemToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await onDeleteEquipment(itemToDelete);
      setItemToDelete(null);
    }
  };
  
  if (view === 'add-category') {
    return <AddCategory onSave={handleSaveCategorySubmit} onCancel={() => setView('add')} />;
  }

  if (view === 'add') {
    const existingCategories = [...new Set(appData.equipmentData.map(c => c.name))];
    return <AddEquipment 
      existingCategories={existingCategories}
      onSave={handleAddEquipmentSubmit}
      onCancel={() => setView('list')}
      onAddNewCategory={() => setView('add-category')}
      newlyAddedCategory={newlyAddedCategory}
    />;
  }
  
  return (
    <div className="relative flex-1 flex flex-col">
      <QrCodeModal 
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        equipmentId={selectedEquipmentId}
      />
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg p-6 max-w-sm w-full animate-fade-in-up">
                <h3 className="text-lg font-bold text-text-light dark:text-text-dark">Confirmar Exclusão</h3>
                <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Tem certeza que deseja excluir o equipamento <strong>{itemToDelete}</strong>?</p>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => setItemToDelete(null)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark font-semibold">Cancelar</button>
                    <button onClick={handleConfirmDelete} className="px-4 py-2 rounded-lg bg-danger text-white font-semibold">Excluir</button>
                </div>
            </div>
        </div>
      )}
      <header className="sticky top-0 z-20 flex flex-col bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm pt-4">
        <h1 className="text-text-light dark:text-text-dark text-2xl font-bold leading-tight px-4 pb-4">Início</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        <ClientInfoCard 
            client={appData.client} 
            onUpdateFloorPlan={onUpdateFloorPlan} 
            navigateTo={navigateTo}
        />
        <StatsGrid stats={calculatedStats} />
        <NextInspection 
          date={appData.inspection.date} 
          time={appData.inspection.time}
          onReschedule={() => setIsScheduleModalOpen(true)}
        />
        <ActionButtons 
          onNavigate={navigateTo}
          client={appData.client}
          equipmentData={appData.equipmentData}
          user={appData.userProfile}
        />
        
        {/* Equipment List Section */}
        <div className="px-4 pt-8">
            <h2 className="text-text-light dark:text-text-dark text-xl font-bold leading-tight pb-4">Inventário de Equipamentos</h2>
            <div className="sticky top-[76px] z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm py-2 -mx-4 px-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">search</span>
                <input 
                  className="w-full rounded-lg border-border-light bg-card-light py-3 pl-10 pr-4 text-base text-text-light placeholder:text-text-secondary-light focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-card-dark dark:text-text-dark dark:placeholder:text-text-secondary-dark" 
                  placeholder="Buscar por ID ou localização..." 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto whitespace-nowrap pt-3 pb-1 -mx-4 px-4">
                  {filters.map(filter => (
                      <button key={filter} onClick={() => setActiveFilter(filter)} className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 text-sm font-semibold transition-colors ${activeFilter === filter ? 'bg-primary text-white dark:bg-primary-dark' : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark'}`}>
                          {filter}
                      </button>
                  ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
                {filteredData.length > 0 ? filteredData.map(category => (
                    <EquipmentCategory key={category.name} category={category} onShowQrCode={handleShowQrCode} onDeleteItem={handleDeleteRequest} />
                )) : (
                    <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-8">Nenhum equipamento encontrado.</p>
                )}
            </div>
        </div>
      </main>
      
      {!offline && (
        <button 
          onClick={() => setView('add')}
          className="fixed bottom-24 right-4 z-20 flex items-center justify-center size-14 bg-primary dark:bg-primary-dark text-white rounded-full shadow-lg hover:bg-primary/90 dark:hover:bg-primary-dark/90 transition-transform active:scale-95"
          aria-label="Adicionar Equipamento"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      )}

      <ScheduleInspectionModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSave={handleSaveSchedule}
        currentInspection={appData.inspection}
      />
    </div>
  );
};

export default Dashboard;