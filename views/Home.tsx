import React, { useState } from 'react';
import { Session, ITEMS_PER_PAGE } from '../types';
import { Button } from '../components/Button';
import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface HomeProps {
  sessions: Session[];
  onCreateSession: () => void;
  onSelectSession: (sessionId: number) => void;
}

export const Home: React.FC<HomeProps> = ({ sessions, onCreateSession, onSelectSession }) => {
  const [page, setPage] = useState(1);
  const [jumpPageInput, setJumpPageInput] = useState('');

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

  // Generate placeholders if page is not full to maintain grid structure (optional, but looks nice)
  const placeholders = Array.from({ length: Math.max(0, ITEMS_PER_PAGE - currentSessions.length) });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dictation Challenge</h1>
          <p className="text-slate-500 mt-2">Select a daily challenge or start a new one.</p>
        </div>
        <Button onClick={onCreateSession} size="lg" className="shadow-lg shadow-indigo-200">
          <Plus className="w-5 h-5 mr-2" />
          New Dictation
        </Button>
      </div>

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
          
          {/* Empty Slots for visual consistency */}
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