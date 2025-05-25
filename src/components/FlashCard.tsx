'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from './ThemeProvider';
import type { FlashCard as FlashCardType } from '../types/flashcard';

interface FlashCardProps {
  card: FlashCardType;
  onEdit: (card: FlashCardType) => void;
  onDelete: (cardId: string) => void;
  isFlipped?: boolean;
  onFlip?: () => void;
  showReviewButtons?: boolean;
  onReview?: (rating: 'again' | 'hard' | 'good') => void;
}

function FlashCard({ card, onEdit, onDelete, isFlipped, onFlip, showReviewButtons, onReview }: FlashCardProps) {
  const [localFlipped, setLocalFlipped] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Use controlled flip state if provided, otherwise use local state
  const cardIsFlipped = isFlipped !== undefined ? isFlipped : localFlipped;

  const handleFlip = () => {
    if (onFlip) {
      onFlip();
    } else {
      setLocalFlipped(!localFlipped);
    }
  };

  useEffect(() => {
    const updateHeight = () => {
      const flashcardInner = frontRef.current?.parentElement;
      if (flashcardInner) {
        if (cardIsFlipped && backRef.current) {
          const height = Math.max(backRef.current.scrollHeight, 380);
          flashcardInner.style.height = `${height}px`;
        } else {
          flashcardInner.style.height = '100%';
        }
      }
    };

    setTimeout(updateHeight, 100);
  }, [card.front, card.back, cardIsFlipped]);

  const markdownComponents = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          className="rounded-lg"
          style={theme === 'dark' ? vscDarkPlus : vs}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} px-1 py-0.5 bg-gray-100 rounded text-sm font-mono`} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div
      className="w-full min-h-96 max-w-[500px] m-4 transition-[height] duration-300 ease-out"
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full text-center transition-transform duration-[600ms] ease-out cursor-pointer ${
          cardIsFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card */}
        <div
          className="absolute w-full min-h-full bg-card-front border-2 border-card-border rounded-xl flex flex-col justify-start p-2 sm:p-5 shadow-md"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={handleFlip}
          ref={frontRef}
        >
          <div className="flex-1 flex flex-col items-center justify-center text-center overflow-visible py-2.5">
            <div className="markdown-content w-full">
              <ReactMarkdown components={markdownComponents}>
                {card.front}
              </ReactMarkdown>
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2.5">Click to flip</div>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full min-h-full bg-card-back border-2 border-card-border rounded-xl flex flex-col justify-start p-2 sm:p-5 shadow-md overflow-x-auto rotate-y-180"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={handleFlip}
          ref={backRef}
        >
          <div className="flex-1 flex flex-col items-start justify-start text-left overflow-visible py-2.5">
            <div className="markdown-content w-full text-left">
              <ReactMarkdown components={markdownComponents}>
                {card.back}
              </ReactMarkdown>
            </div>
          </div>
          <div className="flex gap-2.5 mt-2.5">
            {showReviewButtons && onReview ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onReview('again'); }}
                  className="px-4 py-2 bg-red-500 text-white border-none rounded cursor-pointer text-sm hover:bg-red-600 flex-1"
                >
                  Again (&lt;1m)
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReview('hard'); }}
                  className="px-4 py-2 bg-orange-500 text-white border-none rounded cursor-pointer text-sm hover:bg-orange-600 flex-1"
                >
                  Hard (&lt;10m)
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReview('good'); }}
                  className="px-4 py-2 bg-green-500 text-white border-none rounded cursor-pointer text-sm hover:bg-green-600 flex-1"
                >
                  Good
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(card); }}
                  className="px-4 py-2 bg-primary text-white border-none rounded cursor-pointer text-sm hover:opacity-80"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                  className="px-4 py-2 bg-danger text-white border-none rounded cursor-pointer text-sm hover:opacity-80"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashCard;