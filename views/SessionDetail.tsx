import React, { useState, useEffect } from 'react';
import { Session, Attempt } from '../types';
import { Button, Card } from '../components/Button';
import { DiffViewer } from '../components/DiffViewer';
import { ArrowLeft, Save, Edit2, History, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; 

// Simple ID generator since we can't rely on external packages for this specific file
const generateId = () => Math.random().toString(36).substring(2, 15);

interface SessionDetailProps {
  session: Session;
  onUpdateSession: (updatedSession: Session) => void;
  onBack: () => void;
  properNouns: string[];
  onAddProperNoun: (word: string) => void;
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ 
  session, 
  onUpdateSession, 
  onBack,
  properNouns,
  onAddProperNoun
}) => {
  // Local state for inputs
  const [dictationInput, setDictationInput] = useState('');
  const [originalInput, setOriginalInput] = useState(session.originalText || '');
  const [isEditingOriginal, setIsEditingOriginal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Workflow Stages: 
  // 1. INPUT_DICTATION (User types what they hear)
  // 2. INPUT_ORIGINAL (User provides the source text - only if not already present)
  // 3. REVIEW (Comparison)
  type Stage = 'INPUT_DICTATION' | 'INPUT_ORIGINAL' | 'REVIEW';
  
  const [stage, setStage] = useState<Stage>('INPUT_DICTATION');

  // Load the "current" active attempt if one was just made, or show history
  // If the session has an original text, we start fresh (re-practice mode)
  useEffect(() => {
    if (session.originalText) {
      // Re-entering an existing session: Start fresh input
      setStage('INPUT_DICTATION');
      setOriginalInput(session.originalText);
    } else {
      // New session setup
      setStage('INPUT_DICTATION');
    }
  }, [session.id]); // Reset when session ID changes

  // Helper to find the latest attempt displayed in the review
  const latestAttempt = session.attempts[session.attempts.length - 1];
  
  // Decide what to show based on state
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  
  const currentReviewAttempt = session.attempts.find(a => a.id === currentAttemptId);

  const handleSaveDictation = () => {
    if (!dictationInput.trim()) {
      setErrorMsg("Please type something before saving.");
      return;
    }
    setErrorMsg(null);

    const newAttempt: Attempt = {
      id: generateId(),
      timestamp: Date.now(),
      userText: dictationInput.trim()
    };

    const updatedSession = {
      ...session,
      attempts: [...session.attempts, newAttempt]
    };

    onUpdateSession(updatedSession);
    setCurrentAttemptId(newAttempt.id);
    setDictationInput(''); // Clear input for "clean slate" feel or if we go back

    if (!session.originalText) {
      setStage('INPUT_ORIGINAL');
    } else {
      setStage('REVIEW');
    }
  };

  const handleSaveOriginal = () => {
    if (!originalInput.trim()) {
      setErrorMsg("Original text cannot be empty.");
      return;
    }
    setErrorMsg(null);

    const updatedSession = {
      ...session,
      originalText: originalInput.trim()
    };
    onUpdateSession(updatedSession);
    setIsEditingOriginal(false);
    setStage('REVIEW');
  };

  const handleEditOriginal = () => {
    setIsEditingOriginal(true);
    // If we are editing original, we essentially pause the review to fix the source
    // The UI should show the input box for original text.
  };

  const handleRetry = () => {
    setStage('INPUT_DICTATION');
    setCurrentAttemptId(null);
    setDictationInput('');
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dictation #{session.id}</h2>
          <p className="text-slate-500 text-sm">
            {new Date(session.createdAt).toLocaleDateString()} • {session.attempts.length} attempts
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {errorMsg}
        </div>
      )}

      {/* STAGE: INPUT DICTATION */}
      {stage === 'INPUT_DICTATION' && (
        <Card className="p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Step 1: Listen and type what you hear
          </label>
          <textarea
            className="w-full h-48 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-lg leading-relaxed"
            placeholder="Type your dictation here..."
            value={dictationInput}
            onChange={(e) => setDictationInput(e.target.value)}
            autoFocus
          />
          <div className="mt-4 flex justify-end">
             {/* If user inputs nothing, the button handles error, fulfilling requirement #4 indirectly by validation */}
            <Button onClick={handleSaveDictation} disabled={!dictationInput.trim()}>
              Save Dictation
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE: INPUT ORIGINAL (Setup Phase) */}
      {(stage === 'INPUT_ORIGINAL' || (isEditingOriginal && stage !== 'INPUT_DICTATION')) && (
        <Card className="p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {isEditingOriginal ? 'Edit Original Text' : 'Step 2: Paste the correct original text'}
          </label>
          <textarea
            className="w-full h-48 p-4 border border-indigo-200 bg-indigo-50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-lg leading-relaxed text-indigo-900"
            placeholder="Paste original text here..."
            value={originalInput}
            onChange={(e) => setOriginalInput(e.target.value)}
            autoFocus
          />
          <div className="mt-4 flex justify-end gap-2">
            {isEditingOriginal && (
              <Button variant="ghost" onClick={() => setIsEditingOriginal(false)}>Cancel</Button>
            )}
            <Button onClick={handleSaveOriginal}>
              {isEditingOriginal ? 'Save Changes' : 'Save Original & Compare'}
            </Button>
          </div>
        </Card>
      )}

      {/* STAGE: REVIEW / RESULT */}
      {stage === 'REVIEW' && !isEditingOriginal && currentReviewAttempt && (
        <div className="space-y-6">
          
          <Card className="p-6 border-l-4 border-l-indigo-500">
             <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Result</h3>
                <div className="flex space-x-2">
                   <Button variant="secondary" size="sm" onClick={handleEditOriginal}>
                      <Edit2 className="w-4 h-4 mr-1" /> Edit Original
                   </Button>
                   <Button onClick={handleRetry}>
                      New Attempt
                   </Button>
                </div>
             </div>
             
             {session.originalText && (
               <DiffViewer 
                 userText={currentReviewAttempt.userText} 
                 originalText={session.originalText}
                 properNouns={properNouns}
                 onAddProperNoun={onAddProperNoun}
               />
             )}
          </Card>

           {/* User's Raw Input Display (Optional reference) */}
           <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="text-xs font-uppercase font-bold text-slate-400 mb-2 uppercase tracking-wide">Your Raw Input</h4>
              <p className="text-slate-600 break-words">{currentReviewAttempt.userText}</p>
           </div>
        </div>
      )}

      {/* HISTORY SECTION (Collapsed by default or at bottom) */}
      <div className="mt-12 border-t border-slate-200 pt-8">
        <h3 className="text-lg font-bold text-slate-700 flex items-center mb-4">
          <History className="w-5 h-5 mr-2 text-slate-400" />
          Previous Attempts
        </h3>
        <div className="space-y-3">
          {session.attempts.length === 0 ? (
            <p className="text-slate-400 italic">No attempts yet.</p>
          ) : (
            [...session.attempts].reverse().map((attempt) => (
              <div key={attempt.id} className={`p-4 rounded-lg border ${attempt.id === currentAttemptId ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{new Date(attempt.timestamp).toLocaleString()}</span>
                  {attempt.id === currentAttemptId && <span className="text-indigo-600 font-bold">LATEST</span>}
                </div>
                <p className="text-slate-700 line-clamp-2 break-words">{attempt.userText}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};