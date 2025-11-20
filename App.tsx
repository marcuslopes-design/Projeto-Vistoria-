import React, { useState, useEffect, useCallback } from 'react';
import BottomNav from './components/BottomNav';
import { NAV_ITEMS } from './constants';
import Dashboard from './Dashboard';
import Checklist from './Checklist';
import History from './History';
import Settings from './Settings';
import type { AppData, NewEquipment, Client, InspectionRecord, Inspection } from './types';

const API_URL = '/api';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('Início');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  const fetchData = useCallback(async () => {
    // This check helps guide users who open the HTML file directly.
    if (window.location.protocol === 'file:') {
      setError("Este aplicativo deve ser executado a partir de um servidor. Por favor, inicie o servidor e acesse o endereço correto.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/app-data`);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados do servidor. Tentando modo offline.');
      }
      const data: AppData = await response.json();
      setAppData(data);
      setOffline(false);
      setError(null);
    } catch (err: any) {
      console.warn(err.message);
      try {
        const response = await fetch('/data.json');
        if (!response.ok) {
          throw new Error('Falha ao carregar dados locais.');
        }
        const data: AppData = await response.json();
        setAppData(data);
        setOffline(true);
        setError('Modo offline: Apenas visualização.');
      } catch (localErr: any) {
         setError(localErr.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateTo = (page: string) => {
    if (NAV_ITEMS.find(item => item.label === page)) {
      setCurrentPage(page);
    }
  };

  const handleAddEquipment = useCallback(async (newEquipment: NewEquipment): Promise<boolean> => {
    if (offline) {
      alert("Modo offline: Não é possível salvar novos equipamentos.");
      return false;
    }
    try {
        const response = await fetch(`${API_URL}/equipment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEquipment),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao salvar o equipamento.');
        }

        const savedEquipment = await response.json();

        setAppData(prevData => {
            if (!prevData) return null;
            const updatedEquipmentData = [...prevData.equipmentData];
            const categoryIndex = updatedEquipmentData.findIndex(c => c.name === savedEquipment.category);

            if (categoryIndex > -1) {
                updatedEquipmentData[categoryIndex].items.push(savedEquipment.item);
            } else {
                 updatedEquipmentData.push({
                    name: savedEquipment.category,
                    icon: 'new_label',
                    items: [savedEquipment.item]
                });
            }
            return { ...prevData, equipmentData: updatedEquipmentData };
        });
        return true;
    } catch (err: any) {
        alert(`Erro: ${err.message}`);
        console.error(err);
        return false;
    }
  }, [offline]);

  const handleSaveCategory = useCallback(async (categoryName: string) => {
    if (offline) {
      alert("Modo offline: Não é possível salvar novas categorias.");
      return null;
    }
    try {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: categoryName }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao salvar a categoria.');
        }
        
        const newCategory = await response.json();

        setAppData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                equipmentData: [...prevData.equipmentData, newCategory]
            };
        });
        return newCategory;
    } catch (err: any) {
        alert(`Erro: ${err.message}`);
        console.error(err);
        return null;
    }
  }, [offline]);

  const handleDeleteEquipment = useCallback(async (equipmentId: string) => {
    if (offline) {
      alert(`Modo offline: A exclusão de ${equipmentId} será sincronizada quando houver conexão.`);
      setAppData(prevData => {
        if (!prevData) return null;
        const updatedEquipmentData = prevData.equipmentData.map(category => ({
          ...category,
          items: category.items.filter(item => item.id !== equipmentId)
        }));
        return { ...prevData, equipmentData: updatedEquipmentData };
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/equipment/${equipmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao excluir o equipamento.');
      }

      setAppData(prevData => {
        if (!prevData) return null;
        const updatedEquipmentData = prevData.equipmentData.map(category => ({
          ...category,
          items: category.items.filter(item => item.id !== equipmentId)
        }));
        return { ...prevData, equipmentData: updatedEquipmentData };
      });

    } catch (err: any) {
      alert(`Erro: ${err.message}`);
      console.error(err);
    }
  }, [offline]);

  const handleUpdateClientInfo = useCallback(async (updateData: Partial<Pick<Client, 'floorPlanUrl' | 'coverImageUrl'>>) => {
    if (offline) {
      alert("Modo offline: Não é possível salvar alterações.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/client`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao atualizar informações do cliente.');
      }

      const updatedClient = await response.json();
      setAppData(prevData => {
        if (!prevData) return null;
        return { ...prevData, client: updatedClient };
      });
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
      console.error(err);
    }
  }, [offline]);

  const handleUpdateFloorPlan = useCallback((url: string) => {
    handleUpdateClientInfo({ floorPlanUrl: url });
  }, [handleUpdateClientInfo]);
  
  const handleUpdateClientCoverImage = useCallback((url: string) => {
    handleUpdateClientInfo({ coverImageUrl: url });
  }, [handleUpdateClientInfo]);

  const handleScheduleInspection = useCallback(async (date: string, time: string): Promise<boolean> => {
    if (offline) {
      alert("Modo offline: Não é possível reagendar vistorias.");
      return false;
    }
    try {
      const response = await fetch(`${API_URL}/inspection`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao reagendar a vistoria.');
      }

      const updatedInspection: Inspection = await response.json();
      setAppData(prevData => {
        if (!prevData) return null;
        return { ...prevData, inspection: updatedInspection };
      });
      return true;
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
      console.error(err);
      return false;
    }
  }, [offline]);

  const handleSaveInspection = useCallback(async (inspectionData: Omit<InspectionRecord, 'id' | 'inspectionDate' | 'technicianId'>): Promise<boolean> => {
    if (offline || !appData) {
      alert("Modo offline: Não é possível salvar vistorias.");
      return false;
    }
    try {
      const payload = { ...inspectionData, technicianId: appData.userProfile.technicianId };
      const response = await fetch(`${API_URL}/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
       if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao salvar a vistoria.');
      }
      
      const { savedInspection, updatedEquipment } = await response.json();

      setAppData(prevData => {
        if (!prevData) return null;
        
        const newEquipmentData = prevData.equipmentData.map(category => ({
          ...category,
          items: category.items.map(item => item.id === updatedEquipment.id ? updatedEquipment : item)
        }));

        const newInspectionHistory = [...prevData.inspectionHistory, savedInspection];

        return {
          ...prevData,
          equipmentData: newEquipmentData,
          inspectionHistory: newInspectionHistory
        };
      });

      return true;
    } catch(err: any) {
       alert(`Erro ao salvar vistoria: ${err.message}`);
       console.error(err);
       return false;
    }
  }, [offline, appData]);


  const renderPage = () => {
    if (loading) return <div className="flex-1 flex items-center justify-center text-text-light dark:text-text-dark">Carregando...</div>;
    if (error && !appData) {
      // Show a more helpful error message when running from file://
      if (window.location.protocol === 'file:') {
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-danger/10 border border-danger/20 text-danger-dark dark:text-danger rounded-xl p-6 max-w-lg text-center shadow-lg">
              <h2 className="font-bold text-xl mb-2">Erro de Acesso Direto</h2>
              <p className="text-sm">Este aplicativo precisa ser executado por um servidor para funcionar corretamente.</p>
              <div className="text-left mt-4 bg-black/20 p-4 rounded-lg text-sm">
                <p className="font-semibold">Para iniciar o aplicativo:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Abra um terminal na pasta do projeto.</li>
                  <li>Execute o comando: <code className="bg-black/30 px-1.5 py-0.5 rounded-md font-mono">npm start</code></li>
                  <li>Abra seu navegador e acesse: <a href="http://localhost:8080" className="font-semibold underline">http://localhost:8080</a></li>
                </ol>
              </div>
            </div>
          </div>
        );
      }
      return <div className="flex-1 flex items-center justify-center text-danger p-4 text-center">{error}</div>;
    }
    if (!appData) return <div className="flex-1 flex items-center justify-center text-text-light dark:text-text-dark">Nenhum dado encontrado.</div>;
    
    const offlineBanner = error && appData ? <div className="bg-warning text-center text-black p-1 text-sm font-medium">{error}</div> : null;

    const pageContent = () => {
        switch (currentPage) {
          case 'Início':
            return <Dashboard 
                      appData={appData}
                      navigateTo={navigateTo}
                      onUpdateFloorPlan={handleUpdateFloorPlan}
                      onUpdateClientCoverImage={handleUpdateClientCoverImage}
                      onScheduleInspection={handleScheduleInspection}
                      onAddEquipment={handleAddEquipment}
                      onSaveCategory={handleSaveCategory}
                      onDeleteEquipment={handleDeleteEquipment}
                      offline={offline}
                    />;
          case 'Checklist':
            return <Checklist 
                     initialEquipment={appData.checklistEquipment}
                     checklistData={appData.checklistData}
                     navigateTo={navigateTo}
                     equipmentData={appData.equipmentData}
                     offline={offline}
                     onSaveInspection={handleSaveInspection}
                   />;
          case 'Histórico':
            return <History
                      inspectionHistory={appData.inspectionHistory}
                      equipmentData={appData.equipmentData}
                      navigateTo={navigateTo} 
                    />;
          case 'Configurações':
            return <Settings 
                      user={appData.userProfile} 
                      settings={appData.settings}
                      navigateTo={navigateTo} 
                      theme={theme} 
                      setTheme={setTheme} 
                    />;
          default:
            return <div>Página não encontrada</div>;
        }
    };
    
    return <div className="flex-1 flex flex-col"> {offlineBanner} {pageContent()} </div>;
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col mx-auto max-w-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="flex-1 flex flex-col pb-20">{renderPage()}</div>
      <BottomNav items={NAV_ITEMS} activeItem={currentPage} onNavigate={navigateTo} />
    </div>
  );
};

export default App;
