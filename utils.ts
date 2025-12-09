import { DiffPart, Session } from './types';

// --- Local Storage Helpers ---

const STORAGE_KEY = 'dictation_master_data_v1';

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

// --- Word Diff Algorithm (LCS based) ---

const tokenize = (text: string): string[] => {
  return text.trim().split(/\s+/).filter(t => t.length > 0);
};

// Removes punctuation for comparison
const cleanWord = (word: string): string => {
  return word.replace(/[^\w]|_/g, '').toLowerCase();
};

export const calculateDiff = (userText: string, originalText: string): DiffPart[] => {
  const userWords = tokenize(userText);
  const originalWords = tokenize(originalText);

  const n = userWords.length;
  const m = originalWords.length;

  // dp[i][j] stores the length of LCS of userWords[0..i-1] and originalWords[0..j-1]
  const dp: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const u = cleanWord(userWords[i - 1]);
      const o = cleanWord(originalWords[j - 1]);

      if (u === o) {
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
    const u = i > 0 ? cleanWord(uRaw) : null;
    const o = j > 0 ? cleanWord(oRaw) : null;

    if (i > 0 && j > 0 && u === o) {
      // Match found (ignoring punctuation)
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
  // Count matches (which now include ignored punctuation errors)
  const matches = diffs.filter(d => d.type === 'match').length;
  return Math.round((matches / totalWords) * 100);
};