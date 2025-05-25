import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from './ThemeProvider';
import type { FlashCard } from '../types/flashcard';

interface CardEditorProps {
  card?: FlashCard | null;
  onSave: (card: Omit<FlashCard, 'id'> | FlashCard) => void;
  onCancel: () => void;
}

function CardEditor({ card, onSave, onCancel }: CardEditorProps) {
  const [front, setFront] = useState(card?.front || '');
  const [back, setBack] = useState(card?.back || '');
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const { theme } = useTheme();

  useEffect(() => {
    if (card) {
      setFront(card.front);
      setBack(card.back);
    }
  }, [card]);

  const handleSave = () => {
    if (!front.trim() || !back.trim()) {
      alert('Both front and back content are required');
      return;
    }

    if (card) {
      // Editing existing card - preserve all FSRS properties
      onSave({
        ...card,
        front: front.trim(),
        back: back.trim()
      });
    } else {
      // Creating new card - only provide basic properties
      onSave({
        front: front.trim(),
        back: back.trim()
      });
    }
  };

  const markdownComponents = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={theme === 'dark' ? vscDarkPlus : vs}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono`} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5 mx-auto my-5 max-w-7xl w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="m-0 text-gray-800 dark:text-white text-xl font-semibold">
          {card ? 'Edit Card' : 'Create New Card'}
        </h3>
        <div className="flex gap-2.5">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-success text-white border-none rounded cursor-pointer text-sm hover:opacity-90"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-secondary text-white border-none rounded cursor-pointer text-sm hover:opacity-90"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="grid grid-cols-2 grid-rows-[auto_auto_auto] gap-5 w-full">
        {/* Front Editor */}
        <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden w-full">
          <div className="flex justify-between items-center px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
            <h4 className="m-0 text-gray-700 dark:text-gray-300 font-medium">Front</h4>
            <button
              className={`px-3 py-1 border border-primary rounded cursor-pointer text-xs ${
                previewSide === 'front'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-600 text-primary dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-500'
              }`}
              onClick={() => setPreviewSide('front')}
            >
              Preview
            </button>
          </div>
          <Editor
            height="300px"
            width="100%"
            defaultLanguage="markdown"
            value={front}
            onChange={(value) => setFront(value || '')}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              fontSize: 14,
              automaticLayout: true
            }}
          />
        </div>

        {/* Back Editor */}
        <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden w-full">
          <div className="flex justify-between items-center px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
            <h4 className="m-0 text-gray-700 dark:text-gray-300 font-medium">Back</h4>
            <button
              className={`px-3 py-1 border border-primary rounded cursor-pointer text-xs ${
                previewSide === 'back'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-600 text-primary dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-500'
              }`}
              onClick={() => setPreviewSide('back')}
            >
              Preview
            </button>
          </div>
          <Editor
            height="300px"
            width="100%"
            defaultLanguage="markdown"
            value={back}
            onChange={(value) => setBack(value || '')}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              fontSize: 14,
              automaticLayout: true
            }}
          />
        </div>

        {/* Preview Section */}
        <div className="col-span-2 border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
          <h4 className="m-0 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium">
            Preview - {previewSide}
          </h4>
          <div className="p-4 min-h-[200px] max-h-96 bg-white dark:bg-gray-800 overflow-y-auto">
            <div className="markdown-content">
              <ReactMarkdown components={markdownComponents}>
                {previewSide === 'front' ? front : back}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardEditor;