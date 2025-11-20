import React from 'react';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
    return (
        <section>
            <h2 className="text-sm font-bold uppercase text-text-secondary-light dark:text-text-secondary-dark px-2 pb-2">{title}</h2>
            <div className="bg-card-light dark:bg-card-dark rounded-xl overflow-hidden">
                {children}
            </div>
        </section>
    );
};

export default SettingsSection;