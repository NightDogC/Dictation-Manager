import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Note } from '../types';
import { X } from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, noteId?: string) => void;
  initialNote?: Note | null;
}

export const NoteModal: React.FC<NoteModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialNote 
}) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent(initialNote ? initialNote.content : '');
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSave(content.trim(), initialNote?.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">
            {initialNote ? 'Edit Note' : 'Add Quick Note'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <textarea
            className="w-full h-40 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none leading-relaxed"
            placeholder="Write your note here... (e.g., 'Remember the spelling of conscientious')"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400"
              disabled={!content.trim()}
            >
              {initialNote ? 'Update Note' : 'Save Note'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};