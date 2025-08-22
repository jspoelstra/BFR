export const initialState = {
  progress: {
    studyReadSections: {},
    flashcards: { 
      seen: 0, 
      correct: 0,
      // Per-deck progress tracking
      decks: {},
      currentDeck: null,
      // Card scheduling for spaced repetition
      cardSchedule: {} // deckId-cardIndex -> { lastSeen, interval, easeFactor }
    },
    quizzes: { attempts: 0, best: 0 },
    sectional: { attempts: 0, correct: 0 },
    runway: { attempts: 0, correct: 0 },
  },
  lastRoute: '#study',
  lastStudy: null,
  // Topic navigation state
  study: {
    currentTopic: null, // null means showing topic list
    lastTopic: null     // persist last selected topic
  }
};

const KEY = 'bfr-part91-progress-v1';

export function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
  if(!raw) return structuredClone(initialState);
  const parsed = JSON.parse(raw);
  // Shallow-merge top-level, then ensure nested defaults exist to avoid runtime errors
  const base = structuredClone(initialState);
  const merged = { ...base, ...parsed };
  merged.progress = { ...base.progress, ...(parsed.progress||{}) };
  merged.progress.flashcards = { ...base.progress.flashcards, ...((parsed.progress||{}).flashcards||{}) };
  merged.progress.flashcards.decks = { ...base.progress.flashcards.decks, ...((parsed.progress||{}).flashcards||{}).decks||{} };
  merged.progress.flashcards.cardSchedule = { ...base.progress.flashcards.cardSchedule, ...((parsed.progress||{}).flashcards||{}).cardSchedule||{} };
  merged.progress.quizzes = { ...base.progress.quizzes, ...((parsed.progress||{}).quizzes||{}) };
  merged.progress.sectional = { ...base.progress.sectional, ...((parsed.progress||{}).sectional||{}) };
  merged.progress.runway = { ...base.progress.runway, ...((parsed.progress||{}).runway||{}) };
  merged.progress.studyReadSections = { ...base.progress.studyReadSections, ...((parsed.progress||{}).studyReadSections||{}) };
  // Merge study topic navigation state
  merged.study = { ...base.study, ...(parsed.study||{}) };
  return merged;
  }catch{
    return structuredClone(initialState);
  }
}

export function saveState(state){
  localStorage.setItem(KEY, JSON.stringify(state));
}
