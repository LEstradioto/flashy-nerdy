'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFlashCards } from '../hooks/useFlashCards';
import { useAuth } from '../contexts/AuthContext';
import FlashCard from '../components/FlashCard';
import CardEditor from '../components/CardEditor';
import SetSelector from '../components/SetSelector';
import ThemeToggle from '../components/ThemeToggle';
import LoginForm from '../components/LoginForm';
import type { FlashCard as FlashCardType } from '../types/flashcard';

const ITEMS_PER_PAGE = 20;

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();

  const {
    flashCardSets,
    activeSetName,
    setActiveSetName,
    loading,
    getActiveSet,
    addCard,
    updateCard,
    deleteCard,
    reviewCard,
    getStudyCards,
    getStudyStats,
    studySettings,
    updateStudySettings
  } = useFlashCards();

  const [editingCard, setEditingCard] = useState<FlashCardType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'browse' | 'study' | 'stats' | 'settings'>('study');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // FSRS study session state (only used when FSRS is enabled)
  const [studyCards, setStudyCards] = useState<FlashCardType[]>([]);
  const [studyMode, setStudyMode] = useState<'new' | 'review' | 'mixed'>('mixed');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeSet = getActiveSet();
  const cards = activeSet?.cards || [];

  // Get study data from FSRS (only when enabled)
  const studyData = studySettings.fsrsEnabled ? getStudyCards() : { newCards: [], reviewCards: [], totalDue: 0 };
  const stats = studySettings.fsrsEnabled ? getStudyStats() : {
    cardsStudiedToday: 0,
    newCardsToday: 0,
    reviewsToday: 0,
    averageRetention: 0,
    streakDays: 0,
    totalCardsLearned: cards.length,
    matureCards: 0,
    youngCards: 0
  };

  // Use study cards when in FSRS session mode, regular cards otherwise
  const cardsToShow = (studySettings.fsrsEnabled && sessionStarted) ? studyCards : cards;

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cardsToShow;

    const query = searchQuery.toLowerCase();
    return cardsToShow.filter(card =>
      card.front.toLowerCase().includes(query) ||
      card.back.toLowerCase().includes(query)
    );
  }, [cardsToShow, searchQuery]);

  // Study session functions (only for FSRS mode)
  const startStudySession = () => {
    if (!studySettings.fsrsEnabled) return;

    const { newCards, reviewCards } = studyData;
    let sessionCards: FlashCardType[] = [];

    switch (studyMode) {
      case 'new':
        sessionCards = newCards;
        break;
      case 'review':
        sessionCards = reviewCards;
        break;
      case 'mixed':
        sessionCards = [...reviewCards, ...newCards];
        break;
    }

    setStudyCards(sessionCards);
    setCurrentCardIndex(0);
    setSessionStarted(true);
    setIsCardFlipped(false);
  };

  const handleCardReview = async (rating: 'again' | 'hard' | 'good') => {
    if (!studySettings.fsrsEnabled || studyCards.length === 0) return;

    const currentCard = studyCards[currentCardIndex];

    try {
      // Show saving indicator
      setIsSaving(true);

      // Process the review first - this saves the FSRS data
      reviewCard(currentCard.id, rating);

      // Small delay to ensure save completes
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error('Error reviewing card:', error);
    } finally {
      setIsSaving(false);
    }

    // Then update the session state
    const remainingCards = studyCards.filter((_, index) => index !== currentCardIndex);
    setStudyCards(remainingCards);

    if (remainingCards.length === 0) {
      // Session complete
      setTimeout(() => {
        setSessionStarted(false);
        setCurrentCardIndex(0);
        setIsCardFlipped(false);
      }, 100);
    } else {
      // Move to next card, adjust index if needed
      if (currentCardIndex >= remainingCards.length) {
        setCurrentCardIndex(0);
      }
      setIsCardFlipped(false);
    }
  };

  const endStudySession = () => {
    setSessionStarted(false);
    setStudyCards([]);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
  };

  // Paginate filtered cards
  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);
  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCards.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCards, currentPage]);

  // Reset to first page when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleEditCard = (card: FlashCardType) => {
    setEditingCard(card);
    setIsCreating(false);
  };

  const handleCreateCard = () => {
    setEditingCard(null);
    setIsCreating(true);
  };

  const handleSaveCard = (card: Omit<FlashCardType, 'id'> | FlashCardType) => {
    if (isCreating) {
      addCard(card as Omit<FlashCardType, 'id'>);
    } else {
      updateCard(card as FlashCardType);
    }
    setEditingCard(null);
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setIsCreating(false);
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      deleteCard(cardId);
      if (currentCardIndex >= cards.length - 1) {
        setCurrentCardIndex(Math.max(0, cards.length - 2));
      }
    }
  };

  const nextCard = () => {
    if (isCardFlipped) {
      // First flip to front, then navigate after animation
      setIsCardFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex((prev: number) => (prev + 1) % cardsToShow.length);
      }, 600); // Match the flip animation duration
    } else {
      // Already on front, navigate immediately
      setCurrentCardIndex((prev: number) => (prev + 1) % cardsToShow.length);
    }
  };

  const prevCard = () => {
    if (isCardFlipped) {
      // First flip to front, then navigate after animation
      setIsCardFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex((prev: number) => (prev - 1 + cardsToShow.length) % cardsToShow.length);
      }, 600); // Match the flip animation duration
    } else {
      // Already on front, navigate immediately
      setCurrentCardIndex((prev: number) => (prev - 1 + cardsToShow.length) % cardsToShow.length);
    }
  };

  const handleCardFlip = () => {
    setIsCardFlipped(!isCardFlipped);
  };

  // Keyboard navigation for study mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close mobile menu on Escape
      if (event.code === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        return;
      }

      // Only handle keyboard shortcuts in study mode and when not editing
      if (viewMode !== 'study' || editingCard || isCreating || cardsToShow.length === 0) {
        return;
      }

      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handleCardFlip();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (cardsToShow.length > 1) {
            // In FSRS session mode, navigation is disabled
            if (!studySettings.fsrsEnabled || !sessionStarted) {
              prevCard();
            }
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (cardsToShow.length > 1) {
            // In FSRS session mode, navigation is disabled
            if (!studySettings.fsrsEnabled || !sessionStarted) {
              nextCard();
            }
          }
          break;
        // FSRS review shortcuts (only when FSRS enabled, card is flipped and in study session)
        case 'Digit1':
          if (studySettings.fsrsEnabled && sessionStarted && isCardFlipped) {
            event.preventDefault();
            handleCardReview('again');
          }
          break;
        case 'Digit2':
          if (studySettings.fsrsEnabled && sessionStarted && isCardFlipped) {
            event.preventDefault();
            handleCardReview('hard');
          }
          break;
        case 'Digit3':
          if (studySettings.fsrsEnabled && sessionStarted && isCardFlipped) {
            event.preventDefault();
            handleCardReview('good');
          }
          break;
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const header = document.querySelector('header');
      if (isMobileMenuOpen && header && !header.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [viewMode, editingCard, isCreating, cardsToShow.length, isCardFlipped, sessionStarted, studySettings.fsrsEnabled, isMobileMenuOpen]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading flash cards...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Main header row */}
          <div className="flex justify-between items-center py-4">
            {/* Title */}
            <h1 className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white cursor-pointer flex-shrink-0" onClick={() => setViewMode('study')}>
              Flashy Nerdy 🤓
            </h1>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    viewMode === 'study'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setViewMode('study')}
                >
                  Study
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    viewMode === 'browse'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setViewMode('browse')}
                >
                  Browse
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    viewMode === 'stats'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setViewMode('stats')}
                >
                  Stats
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    viewMode === 'settings'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setViewMode('settings')}
                >
                  Settings
                </button>
              </div>
              <ThemeToggle />
            </div>

            {/* Mobile Controls */}
            <div className="flex lg:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-3">
              <div className="flex flex-col space-y-2">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                    viewMode === 'study'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => {
                    setViewMode('study');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Study Mode
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                    viewMode === 'browse'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => {
                    setViewMode('browse');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Browse Cards
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                    viewMode === 'stats'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => {
                    setViewMode('stats');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Statistics
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                    viewMode === 'settings'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => {
                    setViewMode('settings');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Settings
                </button>
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <button
                    onClick={() => logout()}
                    className="px-4 py-2 bg-danger text-white hover:bg-danger-dark rounded-lg text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-0 sm:px-6 py-8">
        {viewMode !== 'settings' && (
          <SetSelector
            flashCardSets={flashCardSets}
            activeSetName={activeSetName}
            onSetChange={setActiveSetName}
          />
        )}

        {(editingCard || isCreating) ? (
          <CardEditor
            card={editingCard}
            onSave={handleSaveCard}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            {viewMode === 'browse' ? (
              <div className="space-y-6 px-2">
                {/* Browse Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {activeSet?.name || 'No cards available'}
                  </h2>
                  <button
                    onClick={handleCreateCard}
                    className="px-6 py-2 bg-success text-white rounded-lg hover:opacity-90 font-medium"
                  >
                    Create New Card
                  </button>
                </div>

                {activeSet?.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-lg">{activeSet.description}</p>
                )}

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search cards..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {filteredCards.length} of {cards.length} cards
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-4">
                  {paginatedCards.map((card: FlashCardType) => (
                    <div key={card.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Front */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Front</h4>
                              <div className="markdown-content text-sm">
                                <div className="line-clamp-3">
                                  {card.front.length > 100 ? `${card.front.substring(0, 100)}...` : card.front}
                                </div>
                              </div>
                            </div>
                            {/* Back */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Back</h4>
                              <div className="markdown-content text-sm">
                                <div className="line-clamp-3">
                                  {card.back.length > 100 ? `${card.back.substring(0, 100)}...` : card.back}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-6 flex-shrink-0 flex-col sm:flex-row">
                          <button
                            onClick={() => handleEditCard(card)}
                            className="px-3 py-1 bg-primary text-white rounded text-sm hover:opacity-80"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="px-3 py-1 bg-danger text-white rounded text-sm hover:opacity-80"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}

                {filteredCards.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                      {searchQuery ? 'No cards match your search.' : 'No cards in this set yet.'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={handleCreateCard}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 font-medium"
                      >
                        Create your first card
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : viewMode === 'stats' ? (
              <div className="space-y-6 px-2">
                {/* Statistics */}
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    Study Statistics
                  </h2>
                  {!studySettings.fsrsEnabled && (
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Enable FSRS in Study Mode for detailed learning analytics and performance tracking.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Basic Stats - Always Available */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cards</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{cards.length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">In this set</p>
                  </div>

                  {studySettings.fsrsEnabled ? (
                    <>
                      {/* FSRS Advanced Stats */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today&apos;s Study</h3>
                        <p className="text-2xl font-bold text-purple-600">{stats.cardsStudiedToday}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Cards reviewed</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">New Cards</h3>
                        <p className="text-2xl font-bold text-blue-600">{stats.newCardsToday}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Learned today</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Reviews</h3>
                        <p className="text-2xl font-bold text-green-600">{stats.reviewsToday}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Practiced today</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Retention</h3>
                        <p className="text-2xl font-bold text-purple-600">{Math.round(stats.averageRetention * 100)}%</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Success rate</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mature Cards</h3>
                        <p className="text-2xl font-bold text-green-700">{stats.matureCards}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Well learned</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Young Cards</h3>
                        <p className="text-2xl font-bold text-orange-600">{stats.youngCards}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Still learning</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Study Streak</h3>
                        <p className="text-2xl font-bold text-red-600">{stats.streakDays}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Days in a row</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Simple Mode Basic Stats */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Study Mode</h3>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Simple</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Manual navigation</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Available</h3>
                        <p className="text-2xl font-bold text-green-600">{cards.length}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Ready to study</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 opacity-50">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Advanced Analytics</h3>
                        <p className="text-lg font-bold text-gray-400">Disabled</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Enable FSRS</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : viewMode === 'settings' ? (
                <div className="space-y-6 px-2">
                <div className="hidden lg:flex justify-end -mb-4">
                  <button
                    onClick={() => logout()}
                    className="ml-auto px-2 py-1 bg-danger text-white hover:bg-danger-dark rounded text-sm font-medium max-w-20"
                  >
                    Logout
                  </button>
                </div>
                {/* Settings */}
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    FSRS Settings <span className="text-sm bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full">BETA</span>
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Configure your FSRS spaced repetition algorithm. Toggle FSRS on/off in Study Mode.
                  </p>
                </div>

                {/* FSRS Configuration */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Algorithm Settings
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Desired Retention ({Math.round(studySettings.desiredRetention * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="70"
                        max="97"
                        value={studySettings.desiredRetention * 100}
                        onChange={(e) => updateStudySettings({ desiredRetention: parseInt(e.target.value) / 100 })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>70% (Easier, More Reviews)</span>
                        <span>97% (Harder, Fewer Reviews)</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Higher retention means you&apos;ll remember more but review more often.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Cards per Day
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={studySettings.newCardsPerDay}
                          onChange={(e) => updateStudySettings({ newCardsPerDay: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Maximum new cards to learn each day
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Reviews per Day
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="500"
                          value={studySettings.maxReviewsPerDay}
                          onChange={(e) => updateStudySettings({ maxReviewsPerDay: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Maximum review sessions per day
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FSRS Information */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">About FSRS Algorithm</h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    <p>
                      • <strong>Free Spaced Repetition Scheduler</strong> - Uses machine learning to optimize review timing
                    </p>
                    <p>
                      • <strong>Adaptive Learning</strong> - Adjusts to your individual memory patterns over time
                    </p>
                    <p>
                      • <strong>Efficient Reviews</strong> - 20-30% fewer reviews than traditional algorithms for same retention
                    </p>
                    <p>
                      • <strong>Research-Based</strong> - Built on cognitive science and validated with millions of reviews
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Current Status: {studySettings.fsrsEnabled ?
                        <span className="font-medium text-green-600 dark:text-green-400">Active</span> :
                        <span className="font-medium text-gray-600 dark:text-gray-400">Disabled - Toggle in Study Mode</span>
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 px-2">
                {/* Study Mode - Different interface based on FSRS setting */}
                {!studySettings.fsrsEnabled ? (
                  <>
                    {/* Simple Study Mode (Original) */}
                    <div className="text-center">
                      <div className="flex justify-center items-center gap-4 mb-4">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                          Study Mode: {activeSet?.name}
                        </h2>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Simple</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={studySettings.fsrsEnabled}
                              onChange={(e) => updateStudySettings({ fsrsEnabled: e.target.checked })}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                          <span className="text-sm font-medium text-blue-600">FSRS <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded">BETA</span></span>
                        </div>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Card {currentCardIndex + 1} of {cardsToShow.length}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Use ← → to navigate • Space to flip
                      </div>
                    </div>

                    {cardsToShow.length > 0 ? (
                      <>
                        {/* Study Card Container */}
                        <div className="flex justify-center">
                          <FlashCard
                            card={cardsToShow[currentCardIndex]}
                            onEdit={handleEditCard}
                            onDelete={handleDeleteCard}
                            isFlipped={isCardFlipped}
                            onFlip={handleCardFlip}
                          />
                        </div>

                        {/* Simple Study Controls */}
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={prevCard}
                            disabled={cardsToShow.length <= 1}
                            className="px-6 py-2 bg-secondary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            Previous
                          </button>
                          <button
                            onClick={nextCard}
                            disabled={cardsToShow.length <= 1}
                            className="px-6 py-2 bg-secondary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            Next
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No cards available for study.</p>
                        <button
                          onClick={() => setViewMode('browse')}
                          className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 font-medium"
                        >
                          Go to Browse Mode
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* FSRS Study Mode (Advanced) */}
                    {!sessionStarted ? (
                      <>
                        {/* FSRS Study Dashboard */}
                        <div className="text-center">
                          <div className="flex justify-center items-center gap-4 mb-4">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                              FSRS Study Mode: {activeSet?.name}
                            </h2>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Simple</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={studySettings.fsrsEnabled}
                                  onChange={(e) => updateStudySettings({ fsrsEnabled: e.target.checked })}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                              <span className="text-sm font-medium text-blue-600">FSRS <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded">BETA</span></span>
                            </div>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {studyData.totalDue} cards due for review
                          </div>
                        </div>

                        {/* Due Cards Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">New Cards</h3>
                            <p className="text-2xl font-bold text-blue-600">{studyData.newCards.length}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Never studied</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Reviews</h3>
                            <p className="text-2xl font-bold text-green-600">{studyData.reviewCards.length}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Due for review</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Daily Limit</h3>
                            <p className="text-2xl font-bold text-purple-600">{studySettings.newCardsPerDay}/{studySettings.maxReviewsPerDay}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">New/Reviews</p>
                          </div>
                        </div>

                        {/* Study Mode Selection */}
                        <div className="flex justify-center gap-4">
                          <select
                            value={studyMode}
                            onChange={(e) => setStudyMode(e.target.value as 'new' | 'review' | 'mixed')}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <option value="mixed">Mixed (Reviews + New)</option>
                            <option value="review">Reviews Only</option>
                            <option value="new">New Cards Only</option>
                          </select>
                        </div>

                        {/* Start Study Button */}
                        {studyData.totalDue > 0 ? (
                          <div className="flex justify-center">
                            <button
                              onClick={startStudySession}
                              className="px-8 py-3 bg-primary text-white rounded-lg hover:opacity-90 font-medium text-lg"
                            >
                              Start FSRS Study Session
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                              All caught up! No cards due for review.
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">
                              Come back later or add new cards to study.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Active FSRS Study Session */}
                        <div className="text-center">
                          <div className="flex justify-center items-center gap-4 mb-4">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                              FSRS Study Session
                            </h2>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Simple</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={studySettings.fsrsEnabled}
                                  onChange={(e) => {
                                    updateStudySettings({ fsrsEnabled: e.target.checked });
                                    if (!e.target.checked) {
                                      endStudySession(); // End session when switching to simple mode
                                    }
                                  }}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                              <span className="text-sm font-medium text-blue-600">FSRS <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded">BETA</span></span>
                            </div>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            Card {currentCardIndex + 1} of {studyCards.length} • {studyCards.length - currentCardIndex - 1} remaining
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Space to flip • {isCardFlipped ? "1-2-3 to rate" : "Navigation disabled in FSRS session"}
                          </div>
                          {isSaving && (
                            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-blue-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              Saving review...
                            </div>
                          )}
                        </div>

                        {studyCards.length > 0 ? (
                          <>
                            {/* Study Card */}
                            <div className="flex justify-center">
                              <FlashCard
                                card={studyCards[currentCardIndex]}
                                onEdit={handleEditCard}
                                onDelete={handleDeleteCard}
                                isFlipped={isCardFlipped}
                                onFlip={handleCardFlip}
                                showReviewButtons={isCardFlipped}
                                onReview={handleCardReview}
                              />
                            </div>

                            {/* Session Controls */}
                            <div className="flex justify-center gap-4">
                              <button
                                onClick={endStudySession}
                                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:opacity-90 font-medium"
                              >
                                End Session
                              </button>
                              {!isCardFlipped && (
                                <button
                                  onClick={handleCardFlip}
                                  className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 font-medium"
                                >
                                  Show Answer
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                              FSRS Session Complete! 🎉
                            </p>
                            <button
                              onClick={endStudySession}
                              className="px-6 py-2 bg-success text-white rounded-lg hover:opacity-90 font-medium"
                            >
                              Back to Dashboard
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
