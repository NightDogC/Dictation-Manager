import React, { useState, useEffect, useMemo } from 'react';
import { Session, ITEMS_PER_PAGE, Note } from '../types';
import { Button } from '../components/Button';
import { Plus, ChevronLeft, ChevronRight, Search, StickyNote, CheckCircle2, ArrowRight } from 'lucide-react';

interface HomeProps {
  sessions: Session[];
  notes: Note[];
  onCreateSession: () => void;
  onSelectSession: (sessionId: number) => void;
  onGoToNotes: () => void;
}

export const Home: React.FC<HomeProps> = ({ 
  sessions, 
  notes, 
  onCreateSession, 
  onSelectSession,
  onGoToNotes
}) => {
  const [page, setPage] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState('');

  // --- Notes Widget Logic ---
  
  // State to track which notes are currently shown
  const [displayedNotes, setDisplayedNotes] = useState<Note[]>([]);

  // Initialize random notes
  useEffect(() => {
    if (notes.length === 0) {
      setDisplayedNotes([]);
      return;
    }

    // Per requirement: If < 3 notes, show 1. Else show 3.
    const countToShow = notes.length < 3 ? 1 : 3;
    
    // Shuffle and pick
    const shuffled = [...notes].sort(() => 0.5 - Math.random());
    setDisplayedNotes(shuffled.slice(0, countToShow));
  }, [notes.length]); // Only re-init when count changes radically (add/delete), not on every render

  const handleGotIt = (noteToRemoveId: string) => {
    // Current displayed IDs
    const displayedIds = new Set(displayedNotes.map(n => n.id));
    
    // Find candidates: notes that are NOT currently displayed
    const candidates = notes.filter(n => !displayedIds.has(n.id));

    if (candidates.length === 0) {
      // If no other candidates (e.g., total notes = 3, showing 3), just shuffle the existing ones? 
      // Or maybe animate? For now, we just pick a random existing one other than the one removed if possible,
      // or just do nothing if strictly no other notes exist.
      // However, the prompt says: "displays random *other* note".
      // If we have exactly 3 notes and show 3, we can't show a 4th unique one.
      // So we fallback to just keeping it or rotating order.
      // But let's assume user has more notes for this feature to shine.
      // If strictly no candidates, we just don't update.
      return;
    }

    const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
    
    setDisplayedNotes(prev => prev.map(n => n.id === noteToRemoveId ? randomCandidate : n));
  };


  // --- Sessions Grid Logic ---

  // Sort sessions by ID descending (newest first) or ascending (classic level view)?
  // Game "Level Select" usually is ascending 1, 2, 3.
  const sortedSessions = [...sessions].sort((a, b) => a.id - b.id);
  
  const totalPages = Math.ceil(sortedSessions.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentSessions = sortedSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput);
    if (!isNaN(p)) {
      handlePageChange(p);
    }
    setJumpPageInput('');
  };

  const placeholders = Array.from({ length: Math.max(0, ITEMS_PER_PAGE - currentSessions.length) });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Section: Header & Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dictation Challenge</h1>
          <p className="text-slate-500 mt-2">Select a daily challenge or start a new one.</p>
        </div>
        <div className="flex gap-3">
            <Button onClick={onGoToNotes} variant="secondary" className="hidden sm:flex">
                <StickyNote className="w-4 h-4 mr-2" /> Notes Manager
            </Button>
            <Button onClick={onCreateSession} size="lg" className="shadow-lg shadow-indigo-200">
                <Plus className="w-5 h-5 mr-2" />
                New Dictation
            </Button>
        </div>
      </div>

      {/* Notes Widget Area */}
      {displayedNotes.length > 0 && (
        <section className="bg-yellow-50/50 border border-yellow-100 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-700 flex items-center">
                    <StickyNote className="w-5 h-5 mr-2 text-yellow-500" />
                    Random Notes Review
                </h2>
                <button 
                  onClick={onGoToNotes} 
                  className="text-sm font-medium text-yellow-600 hover:text-yellow-700 flex items-center"
                >
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayedNotes.map(note => (
                    <div key={note.id} className="bg-white p-4 rounded-xl shadow-sm border border-yellow-200 relative flex flex-col justify-between group h-32 md:h-40">
                        <div className="overflow-hidden">
                             <p className="text-slate-700 text-sm md:text-base font-medium leading-relaxed line-clamp-4 font-handwriting">
                                {note.content}
                             </p>
                        </div>
                        {/* Only show "Got it" if there are other notes to swap in, OR just always show it for interaction satisfaction even if it doesn't change anything (though logic above prevents change) */}
                        {notes.length > displayedNotes.length && (
                            <button 
                                onClick={() => handleGotIt(note.id)}
                                className="self-end mt-2 flex items-center text-xs font-bold text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Got it
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </section>
      )}

      {/* Main Grid Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        
        {/* Grid Container */}
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4 mb-8">
          {currentSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200
                ${session.originalText 
                  ? 'border-indigo-100 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:scale-105 hover:shadow-md' 
                  : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300'
                }
              `}
            >
              <span className="text-xl font-bold">{session.id}</span>
              {session.attempts.length > 0 && (
                 <span className="text-[10px] mt-1 font-medium bg-white px-1.5 py-0.5 rounded-full border border-indigo-100">
                    {session.attempts.length} tries
                 </span>
              )}
            </button>
          ))}
          
          {/* Empty Slots */}
          {placeholders.map((_, idx) => (
            <div key={`ph-${idx}`} className="aspect-square rounded-xl border border-dashed border-slate-200 bg-transparent opacity-50"></div>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100 pt-6 gap-4">
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handlePageChange(page - 1)} 
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-slate-600">
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handlePageChange(page + 1)} 
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleJumpToPage} className="flex items-center space-x-2">
            <span className="text-sm text-slate-500">Go to page:</span>
            <input 
              type="number" 
              min="1" 
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              className="w-16 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <Button type="submit" variant="secondary" size="sm">Go</Button>
          </form>

        </div>
      </div>
    </div>
  );
};