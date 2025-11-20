import React from 'react';

interface NavItemProps {
  icon: string;
  label: string;
  isActive: boolean;
  onNavigate: (page: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onNavigate }) => {
  const itemClasses = isActive
    ? "text-primary dark:text-primary"
    : "text-neutral-subtext-light dark:text-neutral-subtext-dark";
  
  const isFilled = isActive;

  return (
    <button onClick={() => onNavigate(label)} className={`flex flex-1 flex-col items-center justify-center gap-1 ${itemClasses}`}>
      <span className={`material-symbols-outlined ${isFilled ? 'fill' : ''}`}>{icon}</span>
      <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
  );
};

export default NavItem;