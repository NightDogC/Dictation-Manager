import React, { useState, useEffect } from 'react';
import { Session, AppState } from './types';
import { loadSessions, saveSessions } from './utils';
import { Home } from './views/Home';
import { SessionDetail } from './views/SessionDetail';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentView, setCurrentView] = useState<'HOME' | 'SESSION'>('HOME');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // Initialize data
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
  }, []);

  // Persist on change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions]);

  const handleCreateSession = () => {
    // Find next ID
    const maxId = sessions.reduce((max, s) => Math.max(max, s.id), 0);
    const newSession: Session = {
      id: maxId + 1,
      createdAt: Date.now(),
      originalText: null,
      attempts: [],
    };
    
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
    setCurrentView('SESSION');
  };

  const handleSelectSession = (id: number) => {
    setActiveSessionId(id);
    setCurrentView('SESSION');
  };

  const handleUpdateSession = (updatedSession: Session) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const handleBackToHome = () => {
    setCurrentView('HOME');
    setActiveSessionId(null);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Global Header (Optional) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={handleBackToHome}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">D</div>
              <span className="font-bold text-xl tracking-tight text-slate-800">DictationMaster</span>
            </div>
            {currentView === 'SESSION' && activeSession && (
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    No. {activeSession.id}
                </span>
            )}
        </div>
      </header>

      <main>
        {currentView === 'HOME' && (
          <Home 
            sessions={sessions} 
            onCreateSession={handleCreateSession}
            onSelectSession={handleSelectSession}
          />
        )}

        {currentView === 'SESSION' && activeSession && (
          <SessionDetail 
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            onBack={handleBackToHome}
          />
        )}
      </main>
    </div>
  );
};

export default App;