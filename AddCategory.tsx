import React, { useState, useEffect, useRef } from 'react';

interface AddCategoryProps {
    onSave: (categoryName: string) => void;
    onCancel: () => void;
}

const AddCategory: React.FC<AddCategoryProps> = ({ onSave, onCancel }) => {
    const [categoryName, setCategoryName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const isSaveDisabled = categoryName.trim() === '';

    const handleSave = () => {
        if (!isSaveDisabled) {
            onSave(categoryName.trim());
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark">
            <header className="flex shrink-0 items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-border-light dark:border-border-dark">
                <button onClick={onCancel} className="flex size-12 items-center justify-start -ml-3">
                    <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark">close</span>
                </button>
                <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-text-light dark:text-text-dark flex-1 text-center">Adicionar Nova Categoria</h2>
                <div className="flex w-12 items-center justify-end">
                     <button 
                        onClick={handleSave} 
                        disabled={isSaveDisabled}
                        className="text-base font-bold leading-normal tracking-[0.015em] text-primary shrink-0 disabled:text-primary/50 disabled:cursor-not-allowed"
                    >
                        Salvar
                    </button>
                </div>
            </header>

            <main className="flex flex-1 flex-col p-4">
                <div className="space-y-4">
                    <p className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark pt-1">Digite o nome da nova categoria de equipamento.</p>
                    <div className="flex max-w-full flex-wrap items-end gap-4 py-3">
                        <label className="flex w-full flex-col min-w-40 flex-1">
                            <p className="text-base font-medium leading-normal pb-2 text-text-light dark:text-text-dark">Nome da Categoria</p>
                            <input
                                ref={inputRef}
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-light bg-card-light focus:border-primary focus:ring-primary/20 focus:ring-2 dark:border-border-dark dark:bg-card-dark dark:text-text-dark dark:placeholder:text-text-secondary-dark h-14 p-[15px] text-base font-normal leading-normal"
                                placeholder="Ex: Sistemas de Supressão"
                            />
                        </label>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddCategory;
