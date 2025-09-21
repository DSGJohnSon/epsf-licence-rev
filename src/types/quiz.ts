export interface QuizOption {
  id: string;
  text: string;
  image?: string; // URL ou chemin vers l'image de l'option (optionnel)
  imageAlt?: string; // Texte alternatif pour l'image de l'option (optionnel)
}

export interface QuizQuestion {
  id: number;
  question: string;
  type: 'single' | 'multiple';
  options: QuizOption[];
  correctAnswers: string[];
  code?: string; // Code de la question (optionnel)
  image?: string; // URL ou chemin vers l'image d'illustration (optionnel)
  imageAlt?: string; // Texte alternatif pour l'image (optionnel)
}

export interface Quiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface QuizData {
  quiz: Quiz;
}

export interface UserAnswer {
  questionId: number;
  selectedAnswers: string[];
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: UserAnswer[];
}