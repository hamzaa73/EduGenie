
export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Option {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctIndex?: number; // For MCQ
  correctAnswer?: boolean; // For T/F
  explanation: string;
  difficulty: Difficulty;
  sectionTitle?: string;
}

export interface QuizConfig {
  numMcq: number;
  numTf: number;
  difficulty: Difficulty;
  language: 'ar' | 'en';
}

export interface SavedBank {
  id: string;
  timestamp: number;
  title: string;
  questions: Question[];
  config: QuizConfig;
}

export interface AppState {
  step: 'UPLOAD' | 'PREVIEW' | 'GENERATING' | 'RESULTS' | 'QUIZ' | 'HISTORY' | 'QUIZ_SUMMARY';
  extractedText: string;
  questions: Question[];
  currentQuizIndex: number;
  userAnswers: Record<string, any>; // Record<questionId, selectedIndex | boolean>
  showAnswer: boolean;
  language: 'ar' | 'en';
  history: SavedBank[];
}
