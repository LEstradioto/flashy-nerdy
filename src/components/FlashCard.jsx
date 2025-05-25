import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './FlashCard.css';

function FlashCard({ card, onEdit, onDelete, isFlipped, onFlip }) {
  const [localFlipped, setLocalFlipped] = useState(false);
  const frontRef = useRef(null);
  const backRef = useRef(null);

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
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className={`flashcard ${cardIsFlipped ? 'flipped' : ''}`}>
      <div className="flashcard-inner">
        <div className="flashcard-front" onClick={handleFlip} ref={frontRef}>
          <div className="flashcard-content">
            <ReactMarkdown components={markdownComponents}>
              {card.front}
            </ReactMarkdown>
          </div>
          <div className="flashcard-hint">Click to flip</div>
        </div>

        <div className="flashcard-back" onClick={handleFlip} ref={backRef}>
          <div className="flashcard-content">
            <ReactMarkdown components={markdownComponents}>
              {card.back}
            </ReactMarkdown>
          </div>
          <div className="flashcard-actions">
            <button onClick={(e) => { e.stopPropagation(); onEdit(card); }}>
              Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashCard;