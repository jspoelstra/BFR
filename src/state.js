export const initialState = {
  progress: {
    studyReadSections: {},
    flashcards: { seen: 0, correct: 0 },
    quizzes: { attempts: 0, best: 0 },
    sectional: { attempts: 0, correct: 0 },
    runway: { attempts: 0, correct: 0 },
  },
  lastRoute: '#study',
  lastStudy: null,
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
  merged.progress.quizzes = { ...base.progress.quizzes, ...((parsed.progress||{}).quizzes||{}) };
  merged.progress.sectional = { ...base.progress.sectional, ...((parsed.progress||{}).sectional||{}) };
  merged.progress.runway = { ...base.progress.runway, ...((parsed.progress||{}).runway||{}) };
  merged.progress.studyReadSections = { ...base.progress.studyReadSections, ...((parsed.progress||{}).studyReadSections||{}) };
  return merged;
  }catch{
    return structuredClone(initialState);
  }
}

export function saveState(state){
  localStorage.setItem(KEY, JSON.stringify(state));
}
