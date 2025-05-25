export interface FlashCard {
  id: string;
  front: string;
  back: string;
}

export interface FSRSCard {
  cardId: string;
  difficulty: number;           // 1-10 scale, starts at 5
  stability: number;            // Days until 90% recall probability
  retrievability: number;       // Current recall probability (0-1)
  lastReviewed: string | null;  // ISO date string, null for new cards
  reviewCount: number;          // Number of times reviewed
  nextReview: string;           // ISO date string for next scheduled review
  reviewHistory: ReviewRecord[]; // Array of past reviews
}

export interface FlashCardWithFSRS extends FlashCard {
  fsrs?: FSRSCard;
}

export interface ReviewRecord {
  date: string;              // ISO date string
  rating: 'again' | 'hard' | 'good'; // 3-button system
  previousInterval: number;   // Days since last review
  newStability: number;      // Stability after this review
  newDifficulty: number;     // Difficulty after this review
}

export interface StudySettings {
  fsrsEnabled: boolean;       // NEW: Toggle for FSRS mode
  desiredRetention: number;   // 0.70 - 0.97 (70% - 97%)
  newCardsPerDay: number;     // Default: 20
  maxReviewsPerDay: number;   // Default: 150
  timeboxMinutes: number;     // Session time limit, default: 30
}

export interface StudyStats {
  cardsStudiedToday: number;
  newCardsToday: number;
  reviewsToday: number;
  averageRetention: number;
  streakDays: number;
  totalCardsLearned: number;
  matureCards: number;        // Cards with stability > 21 days
  youngCards: number;         // Cards with stability <= 21 days
}

export interface FlashCardSet {
  fileName: string;
  name: string;
  description?: string;
  cards: FlashCard[];
}

export interface FlashCardManifest {
  files: string[];
}

export interface UseFlashCardsReturn {
  flashCardSets: FlashCardSet[];
  activeSetName: string | null;
  setActiveSetName: (name: string) => void;
  loading: boolean;
  getActiveSet: () => FlashCardSet | undefined;
  addCard: (card: Omit<FlashCard, 'id'>) => void;
  updateCard: (card: FlashCard) => void;
  deleteCard: (cardId: string) => void;
  reloadSets: () => Promise<void>;
  // FSRS functionality (only when enabled)
  reviewCard: (cardId: string, rating: 'again' | 'hard' | 'good') => void;
  getStudyCards: () => { newCards: FlashCardWithFSRS[]; reviewCards: FlashCardWithFSRS[]; totalDue: number; };
  getStudyStats: () => StudyStats;
  studySettings: StudySettings;
  updateStudySettings: (settings: Partial<StudySettings>) => void;
  // FSRS data management
  fsrsData: Map<string, FSRSCard>; // Map of cardId -> FSRSCard
}