import type { FlashCard, FlashCardWithFSRS, FSRSCard, ReviewRecord, StudySettings, StudyStats } from '../types/flashcard';

// Default FSRS parameters optimized from research data
export const DEFAULT_FSRS_PARAMETERS = {
  // Learning parameters for initial reviews
  learningSteps: [1, 10], // minutes for Again, Good (Hard not used in learning)
  graduatingInterval: 1,   // days after Good on final learning step
  easyInterval: 4,         // days after Easy on final learning step

  // Review parameters
  maxInterval: 36500,      // maximum interval (100 years)

  // FSRS-5 parameters (19 parameters optimized from user data)
  w: [
    0.4872, 1.4003, 3.1145, 15.4896, 7.2180, 0.8975,
    0.9209, 0.0363, 1.629, 0.1342, 1.0166, 2.1174,
    0.0839, 0.3204, 1.4676, 0.219, 2.8237, 0.2975, 0.9508
  ]
};

export const DEFAULT_STUDY_SETTINGS: StudySettings = {
  fsrsEnabled: false,      // FSRS disabled by default - simple study mode
  desiredRetention: 0.87,  // 87% - optimal balance for 3-month goal
  newCardsPerDay: 20,      // allows ~1800 cards in 3 months
  maxReviewsPerDay: 150,   // sustainable review load
  timeboxMinutes: 30       // 30-minute study sessions
};

/**
 * Initialize a new FSRS card with default values
 */
export function initializeFSRSCard(cardId: string): FSRSCard {
  const now = new Date().toISOString();

  return {
    cardId,
    difficulty: 5,           // Initial difficulty (1-10 scale)
    stability: 0,           // Will be set after first review
    retrievability: 1,      // 100% for new cards
    lastReviewed: null,     // Never reviewed
    reviewCount: 0,
    nextReview: now,        // Available immediately
    reviewHistory: []
  };
}

/**
 * Legacy function for backward compatibility - now creates separate FSRS data
 * @deprecated Use initializeFSRSCard instead
 */
export function initializeNewCard(card: { id: string; front: string; back: string }): FlashCard & FSRSCard {
  const now = new Date().toISOString();

  return {
    ...card,
    cardId: card.id,         // Add cardId for FSRSCard compatibility
    difficulty: 5,
    stability: 0,
    retrievability: 1,
    lastReviewed: null,
    reviewCount: 0,
    nextReview: now,
    reviewHistory: []
  };
}

/**
 * Calculate retrievability based on stability and time elapsed
 */
function calculateRetrievability(stability: number, daysSinceReview: number): number {
  if (daysSinceReview <= 0) return 1;
  return Math.pow(0.9, daysSinceReview / stability);
}

/**
 * Calculate new difficulty after review
 */
function calculateNewDifficulty(currentDifficulty: number, rating: 'again' | 'hard' | 'good'): number {
  const w = DEFAULT_FSRS_PARAMETERS.w;
  let newDifficulty = currentDifficulty;

  switch (rating) {
    case 'again':
      newDifficulty = currentDifficulty + w[6];
      break;
    case 'hard':
      newDifficulty = currentDifficulty + w[7];
      break;
    case 'good':
      newDifficulty = currentDifficulty - w[8];
      break;
  }

  // Clamp between 1 and 10
  return Math.max(1, Math.min(10, newDifficulty));
}

/**
 * Calculate new stability after review
 */
function calculateNewStability(
  currentStability: number,
  currentDifficulty: number,
  retrievability: number,
  rating: 'again' | 'hard' | 'good',
  isNewCard: boolean
): number {
  const w = DEFAULT_FSRS_PARAMETERS.w;

  if (isNewCard) {
    // Initial stability calculation for new cards
    switch (rating) {
      case 'again':
        return w[0];
      case 'hard':
        return w[1];
      case 'good':
        return w[2];
    }
  }

  // Stability calculation for review cards
  let newStability: number;

  if (rating === 'again') {
    // Failed review - reset stability
    newStability = w[11] * Math.pow(currentDifficulty, -w[12]) *
                   (Math.pow(currentStability + 1, w[13]) - 1) *
                   Math.exp(w[14] * (1 - retrievability));
  } else {
    // Successful review - increase stability
    const stabilityFactor = rating === 'hard' ? w[15] : rating === 'good' ? w[16] : w[17];

    newStability = currentStability * (
      1 + Math.exp(w[8]) *
      (11 - currentDifficulty) *
      Math.pow(currentStability, -w[9]) *
      (Math.exp((1 - retrievability) * w[10]) - 1) *
      stabilityFactor
    );
  }

  return Math.max(0.01, Math.min(DEFAULT_FSRS_PARAMETERS.maxInterval, newStability));
}

/**
 * Calculate the next review interval based on stability and desired retention
 */
function calculateInterval(stability: number, desiredRetention: number): number {
  if (stability <= 0) return 1;
  const interval = stability * Math.log(desiredRetention) / Math.log(0.9);
  return Math.max(1, Math.round(interval));
}

/**
 * Process a card review and update FSRS values
 */
export function reviewCard(
  card: FlashCardWithFSRS,
  rating: 'again' | 'hard' | 'good',
  settings: StudySettings = DEFAULT_STUDY_SETTINGS
): FSRSCard {
  const now = new Date();
  const reviewDate = now.toISOString();
  const fsrs = card.fsrs || initializeFSRSCard(card.id);
  const isNewCard = fsrs.reviewCount === 0;

  console.log(`Reviewing card ${card.id} with rating ${rating}`, { isNewCard, currentStability: fsrs.stability });

  // Calculate days since last review
  const daysSinceReview = fsrs.lastReviewed
    ? (now.getTime() - new Date(fsrs.lastReviewed).getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  // Calculate current retrievability
  const currentRetrievability = isNewCard ? 1 :
    calculateRetrievability(fsrs.stability, daysSinceReview);

  // Calculate new difficulty and stability
  const newDifficulty = calculateNewDifficulty(fsrs.difficulty, rating);
  const newStability = calculateNewStability(
    fsrs.stability,
    fsrs.difficulty,
    currentRetrievability,
    rating,
    isNewCard
  );

  // Calculate next review interval
  const interval = calculateInterval(newStability, settings.desiredRetention);
  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  // Create review record
  const reviewRecord: ReviewRecord = {
    date: reviewDate,
    rating,
    previousInterval: Math.round(daysSinceReview),
    newStability: newStability,
    newDifficulty: newDifficulty
  };

  const result = {
    cardId: card.id,
    difficulty: newDifficulty,
    stability: newStability,
    retrievability: currentRetrievability,
    lastReviewed: reviewDate,
    reviewCount: fsrs.reviewCount + 1,
    nextReview: nextReview.toISOString(),
    reviewHistory: [...fsrs.reviewHistory, reviewRecord]
  };

  console.log(`Card ${card.id} review result:`, {
    newStability: result.stability,
    newDifficulty: result.difficulty,
    nextReview: result.nextReview,
    reviewCount: result.reviewCount
  });

  return result;
}

/**
 * Check if a card is due for review
 */
export function isCardDue(fsrs: FSRSCard): boolean {
  const now = new Date();
  const nextReview = new Date(fsrs.nextReview);
  return now >= nextReview;
}

/**
 * Check if a card is new (never reviewed)
 */
export function isNewCard(fsrs: FSRSCard): boolean {
  return fsrs.reviewCount === 0;
}

/**
 * Check if a card is mature (stability > 21 days)
 */
export function isMatureCard(fsrs: FSRSCard): boolean {
  return fsrs.stability > 21;
}

/**
 * Get cards that should be studied today
 */
export function getStudyCards(
  cards: FlashCardWithFSRS[],
  settings: StudySettings = DEFAULT_STUDY_SETTINGS
): {
  newCards: FlashCardWithFSRS[];
  reviewCards: FlashCardWithFSRS[];
  totalDue: number;
} {
  if (!settings.fsrsEnabled) {
    // If FSRS is disabled, return all cards as "new" for simple study mode
    return {
      newCards: cards,
      reviewCards: [],
      totalDue: cards.length
    };
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Count cards already studied today
  const studiedToday = cards.filter(card => {
    const fsrs = card.fsrs;
    return fsrs && fsrs.lastReviewed && fsrs.lastReviewed.startsWith(today);
  });

  const newCardsToday = studiedToday.filter(card =>
    card.fsrs && card.fsrs.reviewHistory.length === 1
  ).length;

  const reviewsToday = studiedToday.filter(card =>
    card.fsrs && card.fsrs.reviewHistory.length > 1
  ).length;

  // Get available new cards
  const availableNewCards = cards
    .filter(card => !card.fsrs || isNewCard(card.fsrs))
    .slice(0, Math.max(0, settings.newCardsPerDay - newCardsToday));

  // Get due review cards
  const dueReviewCards = cards
    .filter(card => card.fsrs && !isNewCard(card.fsrs) && isCardDue(card.fsrs))
    .slice(0, Math.max(0, settings.maxReviewsPerDay - reviewsToday));

  return {
    newCards: availableNewCards,
    reviewCards: dueReviewCards,
    totalDue: availableNewCards.length + dueReviewCards.length
  };
}

/**
 * Calculate study statistics - works for both simple and FSRS modes
 */
export function calculateStudyStats(cards: FlashCardWithFSRS[], fsrsEnabled: boolean = false): StudyStats {
  if (!fsrsEnabled) {
    // Simple mode statistics
    return {
      cardsStudiedToday: 0, // Could be enhanced with localStorage
      newCardsToday: 0,
      reviewsToday: 0,
      averageRetention: 0,
      streakDays: 0,
      totalCardsLearned: cards.length, // All cards are "learned" in simple mode
      matureCards: 0,
      youngCards: 0
    };
  }

  // FSRS mode statistics (advanced)
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Today's activity
  const studiedToday = cards.filter(card => {
    const fsrs = card.fsrs;
    return fsrs && fsrs.lastReviewed && fsrs.lastReviewed.startsWith(today);
  });

  const newCardsToday = studiedToday.filter(card =>
    card.fsrs && card.fsrs.reviewHistory.length === 1
  ).length;

  const reviewsToday = studiedToday.filter(card =>
    card.fsrs && card.fsrs.reviewHistory.length > 1
  ).length;

  // Overall statistics
  const totalReviews = cards.reduce((sum, card) => sum + (card.fsrs?.reviewCount || 0), 0);
  const correctReviews = cards.reduce((sum, card) =>
    sum + (card.fsrs?.reviewHistory || []).filter(review => review.rating !== 'again').length, 0
  );

  const averageRetention = totalReviews > 0 ? correctReviews / totalReviews : 0;

  const matureCards = cards.filter(card => card.fsrs && isMatureCard(card.fsrs)).length;
  const youngCards = cards.filter(card =>
    card.fsrs && !isNewCard(card.fsrs) && !isMatureCard(card.fsrs)
  ).length;

  // Calculate streak (simplified - could be enhanced with localStorage)
  const streakDays = studiedToday.length > 0 ? 1 : 0;

  return {
    cardsStudiedToday: studiedToday.length,
    newCardsToday,
    reviewsToday,
    averageRetention,
    streakDays,
    totalCardsLearned: cards.filter(card => card.fsrs && card.fsrs.reviewCount > 0).length,
    matureCards,
    youngCards
  };
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days < 1) {
    return '< 1 day';
  } else if (days === 1) {
    return '1 day';
  } else if (days < 30) {
    return `${Math.round(days)} days`;
  } else if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.round(days / 365);
    return `${years} year${years > 1 ? 's' : ''}`;
  }
}