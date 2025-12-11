import React, { useState, useEffect, useRef } from 'react';
import { Session, AppState, Note } from './types';
import { loadSessions, saveSessions, loadProperNouns, saveProperNouns, loadNotes, saveNotes } from './utils';
import { Home } from './views/Home';
import { SessionDetail } from './views/SessionDetail';
import { NotesManager } from './views/NotesManager';
import { NoteModal } from './components/NoteModal';
import { Download, Upload, FileText, PlusCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Simple ID gen for notes if needed, or stick to random string
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [properNouns, setProperNouns] = useState<string[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  
  const [currentView, setCurrentView] = useState<'HOME' | 'SESSION' | 'NOTES'>('HOME');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  
  // Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize data
  useEffect(() => {
    setSessions(loadSessions());
    setProperNouns(loadProperNouns());
    setNotes(loadNotes());
  }, []);

  // Persist on change
  useEffect(() => {
    if (sessions.length > 0) saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveProperNouns(properNouns);
  }, [properNouns]);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // --- Session Handlers ---

  const handleCreateSession = () => {
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

  // --- Note Handlers ---

  const handleOpenAddNote = () => {
    setEditingNote(null);
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNote = (note: Note) => {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (content: string, noteId?: string) => {
    if (noteId) {
      // Update existing
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content, updatedAt: Date.now() } : n));
    } else {
      // Create new
      const newNote: Note = {
        id: generateId(),
        content,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setNotes(prev => [newNote, ...prev]);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleGoToNotes = () => {
    setCurrentView('NOTES');
  };

  // --- Export / Import Logic ---

  const handleExportData = () => {
    const exportData = {
      version: 3,
      sessions,
      properNouns,
      notes
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dictation-backup-v3-${new Date().toISOString().slice(0, 10)}.json`;
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
        let newNotes: Note[] = [];

        // Simple version detection based on structure
        if (Array.isArray(parsed)) {
          // v1
          newSessions = parsed;
          newProperNouns = properNouns;
          newNotes = notes;
        } else if (parsed.sessions && !parsed.notes) {
          // v2
          newSessions = parsed.sessions;
          newProperNouns = Array.isArray(parsed.properNouns) ? parsed.properNouns : [];
          newNotes = notes;
        } else if (parsed.sessions && parsed.notes) {
          // v3
          newSessions = parsed.sessions;
          newProperNouns = Array.isArray(parsed.properNouns) ? parsed.properNouns : [];
          newNotes = Array.isArray(parsed.notes) ? parsed.notes : [];
        } else {
          throw new Error("Invalid format");
        }

        if (window.confirm(`Importing data... Current data will be overwritten. Continue?`)) {
           setSessions(newSessions);
           setProperNouns(newProperNouns);
           setNotes(newNotes);
           
           saveSessions(newSessions); 
           saveProperNouns(newProperNouns);
           saveNotes(newNotes);
           
           alert("Data imported successfully!");
           handleBackToHome();
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      {/* Global Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer group" onClick={handleBackToHome}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:bg-indigo-700 transition-colors">D</div>
              <span className="font-bold text-xl tracking-tight text-slate-800">DictationMaster</span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Contextual Info */}
              {currentView === 'SESSION' && activeSession && (
                  <span className="hidden sm:inline-block text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full mr-2">
                      No. {activeSession.id}
                  </span>
              )}

              {/* Global Add Note Button */}
              <button
                onClick={handleOpenAddNote}
                className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg font-medium text-sm transition-colors"
              >
                 <PlusCircle className="w-4 h-4" />
                 <span className="hidden sm:inline">Add Note</span>
              </button>

              {/* Data Management Controls (Only visible on Home) */}
              {currentView === 'HOME' && (
                <div className="flex items-center space-x-1 border-l border-slate-200 pl-3 ml-2">
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
            notes={notes}
            onCreateSession={handleCreateSession}
            onSelectSession={handleSelectSession}
            onGoToNotes={handleGoToNotes}
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

        {currentView === 'NOTES' && (
            <NotesManager 
                notes={notes}
                onBack={handleBackToHome}
                onEditNote={handleOpenEditNote}
                onDeleteNote={handleDeleteNote}
                onAddNote={handleOpenAddNote}
            />
        )}
      </main>

      {/* Global Note Modal */}
      <NoteModal 
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        initialNote={editingNote}
      />
    </div>
  );
};

export default App;