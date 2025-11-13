export type Page = 'chat' | 'textbooks' | 'tools' | 'settings';
export type Theme = 'light' | 'dark' | 'system';
export type ColorTheme = 'gold' | 'blue' | 'green' | 'ruby' | 'violet';
export type BackgroundTheme = 'bg-pro-1' | 'bg-pro-2' | 'bg-pro-3' | 'bg-pro-4' | 'bg-pro-5' | 'bg-pro-6' | 'bg-pro-7' | 'bg-pro-8' | 'bg-pro-9' | 'bg-pro-10';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  imageUrl?: string | null;
}

export interface Book {
  id: number;
  title: string;
  grade: string;
  subject: string;
  coverUrl: string;
  downloadUrl: string;
}

export type Tool = 'summarizer' | 'questioner' | 'mindmap' | 'iqtest' | 'tts';

export interface IQQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

// --- New types for IQ Test ---
export type IQTestTopic = 'general' | 'logic' | 'math' | 'spatial';
export type IQTestDifficulty = 'easy' | 'medium' | 'hard';


// --- New types for Question Generator ---
export type QuestionType = 'mcq' | 'tf' | 'short';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedQuestion {
  type: QuestionType;
  question: string;
  options?: string[];
  // `correctAnswer` for mcq/short is string, for tf is boolean
  correctAnswer: string | boolean; 
  idealAnswer?: string; // Only for short answer questions
}

export interface ShortAnswerEvaluation {
    score: number;
    feedback: string;
}

export interface MindMapNode {
  topic: string;
  children?: MindMapNode[];
  // For rendering
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
}

// --- New type for Suggestions Page ---
export type SuggestionType = 'improvement' | 'new_tool' | 'bug_report';