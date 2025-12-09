import React, { useMemo } from 'react';
import { DiffPart } from '../types';
import { calculateDiff, calculateAccuracy } from '../utils';
import { PlusCircle } from 'lucide-react';

interface DiffViewerProps {
  userText: string;
  originalText: string;
  properNouns: string[];
  onAddProperNoun: (word: string) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ 
  userText, 
  originalText,
  properNouns,
  onAddProperNoun
}) => {
  const diffs: DiffPart[] = useMemo(() => {
    if (!userText || !originalText) return [];
    return calculateDiff(userText, originalText, properNouns);
  }, [userText, originalText, properNouns]);

  const accuracy = useMemo(() => calculateAccuracy(diffs), [diffs]);

  // Removes punctuation for clean storage
  const cleanWord = (word: string): string => {
    return word.replace(/[^\w]|_/g, '').toLowerCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-lg">
        <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Comparison Result</span>
        <span className={`text-sm font-bold ${accuracy === 100 ? 'text-green-600' : accuracy > 80 ? 'text-indigo-600' : 'text-orange-600'}`}>
          Match Accuracy: {accuracy}%
        </span>
      </div>

      {/* Added break-words to prevent text overflow */}
      <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm leading-8 text-lg break-words">
        {diffs.map((part, index) => {
          if (part.type === 'match') {
            return (
              <span key={index} className="text-slate-700 mr-1.5 inline-block">
                {part.value}
              </span>
            );
          }
          if (part.type === 'add') {
            // User typed something extra (Red strikethrough)
            return (
              <span key={index} className="bg-red-100 text-red-600 line-through decoration-red-400 decoration-2 mr-1.5 px-0.5 rounded inline-block">
                {part.value}
              </span>
            );
          }
          if (part.type === 'remove') {
            // User missed this word (Bold Red)
            // Hover logic added here using Tailwind 'group'
            const clean = cleanWord(part.value);
            const isKnownProper = properNouns.includes(clean);

            return (
              <span key={index} className="relative group mr-1.5 inline-block cursor-pointer">
                <span className="text-red-600 font-bold border-b-2 border-red-200">
                  {part.value}
                </span>
                
                {/* Tooltip / Action Button */}
                {!isKnownProper && clean.length > 1 && (
                  <button
                    onClick={() => onAddProperNoun(clean)}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap hover:bg-indigo-600 transition-colors z-20"
                    title="Mark as Proper Noun (ignore minor typos)"
                  >
                    <PlusCircle className="w-3 h-3 mr-1" />
                    It's a proper noun
                    {/* Tiny arrow */}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></span>
                  </button>
                )}
              </span>
            );
          }
          return null;
        })}
      </div>
      
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
         <div className="flex items-center">
            <span className="w-3 h-3 bg-red-100 border border-red-200 mr-2 rounded"></span>
            <span className="line-through">Strikethrough</span> = Extra word
         </div>
         <div className="flex items-center">
            <span className="text-red-600 font-bold border-b border-red-200 mr-2">Bold Red</span> = Missed/Wrong
         </div>
         <div className="flex items-center">
            <span className="text-slate-700 mr-2">Black</span> = Correct
         </div>
         <div className="flex items-center">
            <span className="text-slate-400 mr-2 italic">Hover over red text to mark proper nouns</span>
         </div>
      </div>
    </div>
  );
};