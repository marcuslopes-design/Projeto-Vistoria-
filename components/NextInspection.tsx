import React from 'react';

interface NextInspectionProps {
  date: string;
  time: string;
  onReschedule: () => void;
}

const NextInspection: React.FC<NextInspectionProps> = ({ date, time, onReschedule }) => {
  return (
    <div className="px-4">
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl bg-primary/10 dark:bg-primary-dark/20 p-4 @container @[320px]:flex-row @[320px]:items-center">
        <div className="flex flex-col gap-1">
          <p className="text-primary dark:text-primary-dark text-base font-bold">Próxima Vistoria</p>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-base">{date} às {time}</p>
        </div>
        <button 
          onClick={onReschedule}
          className="flex-shrink-0 cursor-pointer rounded-lg h-10 px-4 bg-primary dark:bg-primary-dark text-white text-sm font-semibold shadow-sm">
          <span>Reagendar</span>
        </button>
      </div>
    </div>
  );
};

export default NextInspection;