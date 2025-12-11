import React, { useState } from 'react';
import { Note } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, Trash2, Edit2, Plus, Search } from 'lucide-react';

interface NotesManagerProps {
  notes: Note[];
  onBack: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onAddNote: () => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({ 
  notes, 
  onBack, 
  onEditNote, 
  onDeleteNote,
  onAddNote
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotes = notes
    .filter(n => n.content.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center self-start md:self-auto">
          <button onClick={onBack} className="mr-4 p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
             <h1 className="text-2xl font-bold text-slate-800">My Notes</h1>
             <p className="text-slate-500 text-sm">{notes.length} notes recorded</p>
          </div>
        </div>

        <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-grow md:flex-grow-0">
                <input 
                  type="text" 
                  placeholder="Search notes..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <Button onClick={onAddNote} className="whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" /> Add Note
            </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <Edit2 className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-700">No notes yet</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                Create notes to remember vocabulary, grammar rules, or mistakes from your dictations.
            </p>
            <Button onClick={onAddNote} className="mt-6">Create your first note</Button>
        </div>
      ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
              <p className="text-slate-500">No notes found matching "{searchTerm}"</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => (
            <div key={note.id} className="bg-yellow-50 rounded-xl p-5 shadow-sm border border-yellow-200 flex flex-col hover:shadow-md transition-shadow relative group">
              <div className="flex-grow mb-4">
                <p className="text-slate-800 whitespace-pre-wrap font-medium leading-relaxed font-handwriting">
                    {note.content}
                </p>
              </div>
              
              <div className="flex justify-between items-end border-t border-yellow-200 pt-3 mt-auto">
                <span className="text-xs text-yellow-700 font-medium">
                    {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onEditNote(note)}
                        className="p-1.5 text-yellow-700 hover:bg-yellow-200 rounded-md transition-colors"
                        title="Edit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => {
                            if(window.confirm('Delete this note?')) onDeleteNote(note.id);
                        }}
                        className="p-1.5 text-yellow-700 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};