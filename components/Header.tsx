
import React from 'react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-neutral-border-light dark:border-neutral-border-dark">
      <button className="text-neutral-text-light dark:text-neutral-text-dark flex size-12 shrink-0 items-center justify-center -ml-3">
        <span className="material-symbols-outlined text-2xl">arrow_back</span>
      </button>
      <h1 className="text-neutral-text-light dark:text-neutral-text-dark text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">{title}</h1>
      <div className="size-12 shrink-0"></div>
    </header>
  );
};

export default Header;
