import React, { useMemo } from 'react';
import { DiffPart } from '../types';
import { calculateDiff, calculateAccuracy } from '../utils';

interface DiffViewerProps {
  userText: string;
  originalText: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ userText, originalText }) => {
  const diffs: DiffPart[] = useMemo(() => {
    if (!userText || !originalText) return [];
    return calculateDiff(userText, originalText);
  }, [userText, originalText]);

  const accuracy = useMemo(() => calculateAccuracy(diffs), [diffs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-lg">
        <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Comparison Result</span>
        <span className={`text-sm font-bold ${accuracy === 100 ? 'text-green-600' : accuracy > 80 ? 'text-indigo-600' : 'text-orange-600'}`}>
          Match Accuracy: {accuracy}%
        </span>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm leading-8 text-lg">
        {diffs.map((part, index) => {
          if (part.type === 'match') {
            return (
              <span key={index} className="text-slate-700 mr-1.5">
                {part.value}
              </span>
            );
          }
          if (part.type === 'add') {
            // User typed something extra (Red strikethrough)
            return (
              <span key={index} className="bg-red-100 text-red-600 line-through decoration-red-400 decoration-2 mr-1.5 px-0.5 rounded">
                {part.value}
              </span>
            );
          }
          if (part.type === 'remove') {
            // User missed this word (Green text showing what was missing)
            // Or typically in a dictation correction, this is "What should have been there" (Red text)
            // Requirement says: "red mark for differences". 
            // Let's style missing words as Bold Red to indicate "You missed this/Got this wrong".
            return (
              <span key={index} className="text-red-600 font-bold border-b-2 border-red-200 mr-1.5">
                {part.value}
              </span>
            );
          }
          return null;
        })}
      </div>
      
      <div className="flex gap-4 text-xs text-slate-500 mt-2">
         <div className="flex items-center">
            <span className="w-3 h-3 bg-red-100 border border-red-200 mr-2 rounded"></span>
            <span className="line-through">Strikethrough</span> = Extra word you typed
         </div>
         <div className="flex items-center">
            <span className="text-red-600 font-bold border-b border-red-200 mr-2">Bold Red</span> = Word you missed or typed wrong
         </div>
         <div className="flex items-center">
            <span className="text-slate-700 mr-2">Black</span> = Correct
         </div>
      </div>
    </div>
  );
};