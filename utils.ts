import { DiffPart, Session, Note } from './types';

// --- Local Storage Helpers ---

const STORAGE_KEY = 'dictation_master_data_v1';
const PROPER_NOUNS_KEY = 'dictation_proper_nouns_v1';
const NOTES_KEY = 'dictation_notes_v1';

export const loadSessions = (): Session[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load data", e);
    return [];
  }
};

export const saveSessions = (sessions: Session[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

export const loadProperNouns = (): string[] => {
  try {
    const data = localStorage.getItem(PROPER_NOUNS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveProperNouns = (nouns: string[]) => {
  try {
    localStorage.setItem(PROPER_NOUNS_KEY, JSON.stringify(nouns));
  } catch (e) {
    console.error("Failed to save proper nouns", e);
  }
};

export const loadNotes = (): Note[] => {
  try {
    const data = localStorage.getItem(NOTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveNotes = (notes: Note[]) => {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error("Failed to save notes", e);
  }
};

// --- Helper: Levenshtein Distance & Accuracy ---

const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // deletion
        matrix[i][j - 1] + 1,       // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
};

const getLetterAccuracy = (word1: string, word2: string): number => {
  const maxLength = Math.max(word1.length, word2.length);
  if (maxLength === 0) return 1.0;
  const distance = getLevenshteinDistance(word1, word2);
  return 1 - (distance / maxLength);
};

// --- Word Diff Algorithm (LCS based) ---

const tokenize = (text: string): string[] => {
  return text.trim().split(/\s+/).filter(t => t.length > 0);
};

// Removes punctuation for comparison
const cleanWord = (word: string): string => {
  return word.replace(/[^\w]|_/g, '').toLowerCase();
};

export const calculateDiff = (userText: string, originalText: string, properNouns: string[] = []): DiffPart[] => {
  const userWords = tokenize(userText);
  const originalWords = tokenize(originalText);

  const n = userWords.length;
  const m = originalWords.length;

  // dp[i][j] stores the length of LCS of userWords[0..i-1] and originalWords[0..j-1]
  const dp: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const uRaw = userWords[i - 1];
      const oRaw = originalWords[j - 1];
      const u = cleanWord(uRaw);
      const o = cleanWord(oRaw);

      // Check Exact Match OR Proper Noun Fuzzy Match
      let isMatch = u === o;
      
      if (!isMatch && properNouns.includes(o)) {
        // If the original word is a marked proper noun, check if user typed it with >= 60% accuracy
        const accuracy = getLetterAccuracy(u, o);
        if (accuracy >= 0.60) {
          isMatch = true;
        }
      }

      if (isMatch) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to generate the diff
  let i = n;
  let j = m;
  const rawParts: DiffPart[] = [];

  while (i > 0 || j > 0) {
    const uRaw = i > 0 ? userWords[i - 1] : '';
    const oRaw = j > 0 ? originalWords[j - 1] : '';
    const u = i > 0 ? cleanWord(uRaw) : '';
    const o = j > 0 ? cleanWord(oRaw) : '';

    // Check Match condition again for backtracking
    let isMatch = (i > 0 && j > 0) && (u === o);
    if (i > 0 && j > 0 && !isMatch && properNouns.includes(o)) {
        if (getLetterAccuracy(u, o) >= 0.60) {
            isMatch = true;
        }
    }

    if (isMatch) {
      // Match found
      // We use the original text's formatting for the match
      rawParts.unshift({ type: 'match', value: originalWords[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Word exists in original but not in user input (Missed/Removed)
      rawParts.unshift({ type: 'remove', value: originalWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      // Word exists in user input but not in original (Extra/Added)
      rawParts.unshift({ type: 'add', value: userWords[i - 1] });
      i--;
    }
  }

  // Post-process: Treat pure punctuation differences as matches (ignore them)
  return rawParts.map(part => {
    if (part.type === 'match') return part;
    
    // If the diff is purely punctuation (cleanWord is empty), treat as match/ignore
    if (cleanWord(part.value) === '') {
      return { ...part, type: 'match' };
    }
    
    return part;
  });
};

export const calculateAccuracy = (diffs: DiffPart[]): number => {
  const totalWords = diffs.length;
  if (totalWords === 0) return 100;
  // Count matches
  const matches = diffs.filter(d => d.type === 'match').length;
  return Math.round((matches / totalWords) * 100);
};