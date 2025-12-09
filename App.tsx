import React, { useState, useEffect, useRef } from 'react';
import { Session, AppState } from './types';
import { loadSessions, saveSessions, loadProperNouns, saveProperNouns } from './utils';
import { Home } from './views/Home';
import { SessionDetail } from './views/SessionDetail';
import { Download, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [properNouns, setProperNouns] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'HOME' | 'SESSION'>('HOME');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize data
  useEffect(() => {
    setSessions(loadSessions());
    setProperNouns(loadProperNouns());
  }, []);

  // Persist on change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions]);

  // Persist Proper Nouns
  useEffect(() => {
    // We save even empty arrays to ensure key exists or cleared if needed
    saveProperNouns(properNouns);
  }, [properNouns]);

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

  const handleAddProperNoun = (word: string) => {
    const lower = word.toLowerCase();
    if (!properNouns.includes(lower)) {
      setProperNouns(prev => [...prev, lower]);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('HOME');
    setActiveSessionId(null);
  };

  // --- Export / Import Logic ---

  const handleExportData = () => {
    // Bundle both sessions and properNouns
    const exportData = {
      version: 2,
      sessions,
      properNouns
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dictation-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        let newSessions: Session[] = [];
        let newProperNouns: string[] = [];

        // Check format
        if (Array.isArray(parsed)) {
          // Legacy format (just sessions array)
          newSessions = parsed;
          newProperNouns = properNouns; // keep existing
        } else if (parsed.sessions && Array.isArray(parsed.sessions)) {
          // New format
          newSessions = parsed.sessions;
          newProperNouns = Array.isArray(parsed.properNouns) ? parsed.properNouns : [];
        } else {
          throw new Error("Invalid format");
        }

        if (window.confirm(`Found ${newSessions.length} records. This will overwrite your current data. Continue?`)) {
           setSessions(newSessions);
           setProperNouns(newProperNouns);
           
           saveSessions(newSessions); 
           saveProperNouns(newProperNouns);
           
           alert("Data imported successfully!");
           handleBackToHome();
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse file. Please select a valid backup JSON.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again if needed
    event.target.value = '';
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Global Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={handleBackToHome}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">D</div>
              <span className="font-bold text-xl tracking-tight text-slate-800">DictationMaster</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Contextual Info */}
              {currentView === 'SESSION' && activeSession && (
                  <span className="hidden sm:inline-block text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full mr-4">
                      No. {activeSession.id}
                  </span>
              )}

              {/* Data Management Controls (Only visible on Home) */}
              {currentView === 'HOME' && (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleExportData}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
                    title="Export Data"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleImportClick}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
                    title="Import Data"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                  />
                </div>
              )}
            </div>
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
            properNouns={properNouns}
            onAddProperNoun={handleAddProperNoun}
          />
        )}
      </main>
    </div>
  );
};

export default App;