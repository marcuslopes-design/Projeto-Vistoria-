import React from 'react';
import SettingsSection from './components/SettingsSection';
import SettingsItem from './components/SettingsItem';
import type { UserProfile, SettingsSectionType } from './types';

interface SettingsProps {
  user: UserProfile;
  settings: SettingsSectionType[];
  navigateTo: (page: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const Settings: React.FC<SettingsProps> = ({ user, settings, navigateTo, theme, setTheme }) => {
  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 border-b border-border-light dark:border-border-dark">
        <div className="size-10"></div>
        <h1 className="text-lg font-bold flex-1 text-center">Configurações</h1>
        <div className="size-10"></div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-card-light dark:bg-card-dark p-4 rounded-xl">
            <img className="h-16 w-16 rounded-full object-cover" alt="Foto de perfil do usuário" src={user.avatarUrl} />
            <div className="flex flex-col">
              <p className="text-lg font-semibold text-text-light dark:text-text-dark">{user.name}</p>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">ID: {user.technicianId} | {user.company}</p>
            </div>
          </div>
          
          {settings.map(section => (
            <SettingsSection key={section.title} title={section.title}>
              {section.items.map((item) => (
                  <SettingsItem
                    key={item.id}
                    item={item}
                    onToggle={item.id === 'dark-mode' ? handleThemeToggle : undefined}
                    isChecked={item.id === 'dark-mode' ? theme === 'dark' : false}
                  />
              ))}
            </SettingsSection>
          ))}
          
          <SettingsSection title="Dados e Sincronização">
             <div className="bg-card-light dark:bg-card-dark rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">Última sinc:</p>
                    <p className="font-medium text-text-light dark:text-text-dark">Hoje, 10:45</p>
                </div>
                <button onClick={() => alert('Sincronizando dados...')} className="w-full flex items-center justify-center gap-2 bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark font-semibold py-3 rounded-lg hover:bg-primary/20 dark:hover:bg-primary-dark/30 transition-colors">
                    <span className="material-symbols-outlined text-xl">sync</span>
                    Sincronizar Agora
                </button>
            </div>
          </SettingsSection>

          <section>
            <button onClick={() => alert('Você foi desconectado.')} className="w-full bg-card-light dark:bg-card-dark text-danger font-bold py-3 px-4 rounded-lg hover:bg-danger/5 dark:hover:bg-danger/10 transition-colors">Sair</button>
          </section>
          
          <footer className="text-center py-4">
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Versão do App 1.3.0</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Settings;