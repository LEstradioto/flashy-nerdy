import { useState, useEffect } from 'react';
import type { FlashCard, FlashCardWithFSRS, FSRSCard, FlashCardSet, FlashCardManifest, UseFlashCardsReturn, StudySettings, StudyStats } from '../types/flashcard';
import {
  reviewCard as fsrsReviewCard,
  getStudyCards as fsrsGetStudyCards,
  calculateStudyStats,
  DEFAULT_STUDY_SETTINGS
} from '../utils/fsrs';

export function useFlashCards(enabled: boolean = true): UseFlashCardsReturn {
  const [flashCardSets, setFlashCardSets] = useState<FlashCardSet[]>([]);
  const [activeSetName, setActiveSetName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [studySettings, setStudySettings] = useState<StudySettings>(() => {
    // Load all FSRS settings from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('fsrsSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          return {
            ...DEFAULT_STUDY_SETTINGS,
            ...parsed
          };
        }
      } catch (error) {
        console.error('Error loading FSRS settings from localStorage:', error);
      }
    }
    return DEFAULT_STUDY_SETTINGS;
  });
  const [fsrsData, setFsrsData] = useState<Map<string, FSRSCard>>(new Map());

  const loadFlashCardSets = async (): Promise<void> => {
    setLoading(true);
    try {
      // Load the manifest file to get list of available flashcard sets
      const manifestResponse = await fetch('/flashcards/manifest.json');
      let fileNames: string[] = [];

      if (manifestResponse.ok) {
        const manifest: FlashCardManifest = await manifestResponse.json();
        fileNames = manifest.files || [];
      } else {
        console.warn('Manifest file not found');
      }

      // Load all flashcard sets and their FSRS data
      const sets: FlashCardSet[] = [];
      for (const fileName of fileNames) {
        try {
          const setResponse = await fetch(`/flashcards/${fileName}.json`);
          if (setResponse.ok) {
            const setData = await setResponse.json();

            // Clean the cards to only include basic properties
            const cleanCards: FlashCard[] = setData.cards.map((card: { id: string; front: string; back: string; [key: string]: unknown }) => ({
              id: card.id,
              front: card.front,
              back: card.back
            }));

            sets.push({
              fileName,
              name: setData.name,
              description: setData.description,
              cards: cleanCards
            });
          }
        } catch (error) {
          console.error(`Error loading ${fileName}:`, error);
        }
      }

      setFlashCardSets(sets);
      if (sets.length > 0 && !activeSetName) {
        setActiveSetName(sets[0].fileName);
      }

      // Load FSRS data for all sets
      await loadFSRSData(fileNames);
    } catch (error) {
      console.error('Error loading flash card sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFSRSData = async (fileNames: string[]): Promise<void> => {
    const newFsrsData = new Map<string, FSRSCard>();

    for (const fileName of fileNames) {
      try {
        const fsrsResponse = await fetch(`/flashcards/${fileName}-fsrs.json`);
        if (fsrsResponse.ok) {
          const fsrsSetData = await fsrsResponse.json();
          // Add all FSRS cards to the map
          Object.entries(fsrsSetData.cards || {}).forEach(([cardId, fsrsCard]) => {
            newFsrsData.set(cardId, fsrsCard as FSRSCard);
          });
        }
        // Silently ignore 404s - FSRS files are optional
      } catch {
        // FSRS file doesn't exist yet - that's normal for new sets
        // No need to log this as it's expected behavior
      }
    }

    setFsrsData(newFsrsData);
  };

  const getActiveSet = (): FlashCardSet | undefined => {
    return flashCardSets.find((set: FlashCardSet) => set.fileName === activeSetName);
  };

  const saveSetToFile = async (set: FlashCardSet): Promise<void> => {
    try {
      const response = await fetch('/api/save-flashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: set.fileName,
          data: {
            name: set.name,
            description: set.description,
            cards: set.cards
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save file');
      }
    } catch (error) {
      console.error('Error saving flashcard set:', error);
    }
  };

  const saveFSRSData = async (setName: string): Promise<void> => {
    try {
      // Get all FSRS cards for this set
      const activeSet = getActiveSet();
      if (!activeSet) return;

      const setFsrsData: { [cardId: string]: FSRSCard } = {};
      activeSet.cards.forEach(card => {
        const fsrsCard = fsrsData.get(card.id);
        if (fsrsCard) {
          setFsrsData[card.id] = fsrsCard;
        }
      });

      const response = await fetch('/api/save-flashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: `${setName}-fsrs`,
          data: {
            cards: setFsrsData
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save FSRS data');
      }
    } catch (error) {
      console.error('Error saving FSRS data:', error);
    }
  };

  const addCard = (card: Omit<FlashCard, 'id'>): void => {
    if (!activeSetName) return;

    const newCard: FlashCard = {
      ...card,
      id: `${activeSetName}-${Date.now()}`
    };

    setFlashCardSets((sets: FlashCardSet[]) => {
      const updatedSets = sets.map((set: FlashCardSet) =>
        set.fileName === activeSetName
          ? { ...set, cards: [...set.cards, newCard] }
          : set
      );

      // Auto-save the updated set
      const updatedSet = updatedSets.find((set: FlashCardSet) => set.fileName === activeSetName);
      if (updatedSet) {
        saveSetToFile(updatedSet);
      }

      return updatedSets;
    });
  };

  const updateCard = (updatedCard: FlashCard): void => {
    setFlashCardSets((sets: FlashCardSet[]) => {
      const updatedSets = sets.map((set: FlashCardSet) =>
        set.fileName === activeSetName
          ? {
              ...set,
              cards: set.cards.map((card: FlashCard) =>
                card.id === updatedCard.id ? updatedCard : card
              )
            }
          : set
      );

      // Auto-save the updated set
      const updatedSet = updatedSets.find((set: FlashCardSet) => set.fileName === activeSetName);
      if (updatedSet) {
        saveSetToFile(updatedSet);
      }

      return updatedSets;
    });
  };

  const deleteCard = (cardId: string): void => {
    setFlashCardSets((sets: FlashCardSet[]) => {
      const updatedSets = sets.map((set: FlashCardSet) =>
        set.fileName === activeSetName
          ? { ...set, cards: set.cards.filter((card: FlashCard) => card.id !== cardId) }
          : set
      );

      // Auto-save the updated set
      const updatedSet = updatedSets.find((set: FlashCardSet) => set.fileName === activeSetName);
      if (updatedSet) {
        saveSetToFile(updatedSet);
      }

      return updatedSets;
    });

    // Also remove from FSRS data
    setFsrsData(prev => {
      const newMap = new Map(prev);
      newMap.delete(cardId);
      return newMap;
    });

    // Save FSRS data
    if (activeSetName) {
      saveFSRSData(activeSetName);
    }
  };

  // Only attempt to load data when the hook is enabled (i.e. user authenticated)
  useEffect(() => {
    if (!enabled) return;
    loadFlashCardSets();
  }, [enabled]);

  // FSRS-specific functions
  const reviewCard = (cardId: string, rating: 'again' | 'hard' | 'good'): void => {
    const activeSet = getActiveSet();
    if (!activeSet || !studySettings.fsrsEnabled) return;

    const card = activeSet.cards.find(c => c.id === cardId);
    if (!card) return;

    const cardWithFsrs: FlashCardWithFSRS = {
      ...card,
      fsrs: fsrsData.get(cardId)
    };

    const updatedFsrs = fsrsReviewCard(cardWithFsrs, rating, studySettings);

    // Update FSRS data immediately
    setFsrsData(prev => {
      const newMap = new Map(prev);
      newMap.set(cardId, updatedFsrs);
      return newMap;
    });

    // Save FSRS data immediately (don't wait for state update)
    if (activeSetName) {
      // Create the updated FSRS data object immediately
      const currentActiveSet = getActiveSet();
      if (currentActiveSet) {
        const setFsrsData: { [cardId: string]: FSRSCard } = {};

        // Add all existing FSRS cards
        currentActiveSet.cards.forEach(c => {
          const existingFsrs = fsrsData.get(c.id);
          if (existingFsrs) {
            setFsrsData[c.id] = existingFsrs;
          }
        });

        // Add/update the current card
        setFsrsData[cardId] = updatedFsrs;

        // Save immediately
        saveFSRSDataImmediate(activeSetName, setFsrsData);
      }
    }
  };

  const saveFSRSDataImmediate = async (setName: string, fsrsCardData: { [cardId: string]: FSRSCard }): Promise<void> => {
    try {
      console.log(`Saving FSRS data for set: ${setName}`, { cardCount: Object.keys(fsrsCardData).length });

      const response = await fetch('/api/save-flashcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: `${setName}-fsrs`,
          data: {
            cards: fsrsCardData
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save FSRS data: ${response.status} - ${errorText}`);
      }

      console.log(`✅ FSRS data saved successfully for set: ${setName}`);
    } catch (error) {
      console.error('❌ Error saving FSRS data immediately:', error);
    }
  };

  const getStudyCards = () => {
    const activeSet = getActiveSet();
    if (!activeSet) {
      return { newCards: [], reviewCards: [], totalDue: 0 };
    }

    // Convert cards to FlashCardWithFSRS
    const cardsWithFsrs: FlashCardWithFSRS[] = activeSet.cards.map(card => ({
      ...card,
      fsrs: fsrsData.get(card.id)
    }));

    return fsrsGetStudyCards(cardsWithFsrs, studySettings);
  };

  const getStudyStats = (): StudyStats => {
    const activeSet = getActiveSet();
    if (!activeSet) {
      return {
        cardsStudiedToday: 0,
        newCardsToday: 0,
        reviewsToday: 0,
        averageRetention: 0,
        streakDays: 0,
        totalCardsLearned: 0,
        matureCards: 0,
        youngCards: 0
      };
    }

    // Convert cards to FlashCardWithFSRS
    const cardsWithFsrs: FlashCardWithFSRS[] = activeSet.cards.map(card => ({
      ...card,
      fsrs: fsrsData.get(card.id)
    }));

    return calculateStudyStats(cardsWithFsrs, studySettings.fsrsEnabled);
  };

  const updateStudySettings = (newSettings: Partial<StudySettings>): void => {
    setStudySettings(prev => {
      const updated = { ...prev, ...newSettings };

      // Save all FSRS settings to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('fsrsSettings', JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving FSRS settings to localStorage:', error);
        }
      }

      return updated;
    });
  };

  return {
    flashCardSets,
    activeSetName,
    setActiveSetName,
    loading,
    getActiveSet,
    addCard,
    updateCard,
    deleteCard,
    reloadSets: loadFlashCardSets,
    // FSRS functionality
    reviewCard,
    getStudyCards,
    getStudyStats,
    studySettings,
    updateStudySettings,
    fsrsData
  };
}