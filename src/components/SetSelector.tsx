import React from 'react';
import type { FlashCardSet } from '../types/flashcard';

interface SetSelectorProps {
  flashCardSets: FlashCardSet[];
  activeSetName: string | null;
  onSetChange: (setName: string) => void;
}

const SetSelector: React.FC<SetSelectorProps> = ({
  flashCardSets,
  activeSetName,
  onSetChange
}) => {
  if (flashCardSets.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center mb-6">
      <select
        value={activeSetName || ''}
        onChange={(e) => onSetChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-64"
      >
        {flashCardSets.map((set: FlashCardSet) => (
          <option key={set.fileName} value={set.fileName}>
            {set.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SetSelector;