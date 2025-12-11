export interface DiffPart {
  value: string;
  type: 'match' | 'add' | 'remove'; // 'add' = extra word by user, 'remove' = missed word
}

export interface Attempt {
  id: string;
  timestamp: number;
  userText: string;
  accuracy?: number;
}

export interface Session {
  id: number; // The sequential day number (1, 2, 3...)
  createdAt: number;
  originalText: string | null; // Null if not yet entered
  attempts: Attempt[];
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  sessions: Session[];
}

export const ITEMS_PER_PAGE = 25;