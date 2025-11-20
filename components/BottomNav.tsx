import React from 'react';
import type { NavItem as NavItemType } from '../types';
import NavItem from './NavItem';

interface BottomNavProps {
  items: NavItemType[];
  activeItem: string;
  onNavigate: (page: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ items, activeItem, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex h-20 justify-around border-t border-neutral-border-light bg-background-light dark:border-neutral-border-dark dark:bg-neutral-card-dark shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      {items.map((item) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          isActive={item.label === activeItem}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
};

export default BottomNav;