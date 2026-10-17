export type GenreType = 'hikaye' | 'masal' | 'bilim_kurgu' | 'polisiye' | 'ani' | 'gunluk';

export interface GenreInfo {
  id: GenreType;
  title: string;
  badge: string;
  shortDesc: string;
  iconName: string;
  colorClass: string;
  bgGradient: string;
  accentBorder: string;
}

export interface StoryPrompts {
  genre: GenreType;
  place: string;
  time: string;
  character: string;
  surpriseCard: string;
}

export interface CriterionScore {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  justification: string;
}

export interface AIReview {
  id: string;
  evaluatedAt: string;
  totalScore: number;
  criteriaScores: CriterionScore[];
  generalReview: string;
  strengths: string[];
  areasToImprove: string[];
  topThreeSuggestions: string[];
  genreCompliance: string;
  surpriseCardCompliance: string;
  nextActionStep: string;
  humanEvaluation?: {
    teacherScore: number;
    teacherNotes: string;
    evaluatedBy: string;
    evaluatedAt: string;
    criteriaScores?: Record<string, number>;
  };
}

export interface StoryVersion {
  id: string;
  versionNumber: number;
  title: string;
  content: string;
  wordCount: number;
  characterCount: number;
  createdAt: string;
  review?: AIReview | null;
  studentNotes?: string;
}

export interface Story {
  id: string;
  studentCode: string;
  title: string;
  genre: GenreType;
  place: string;
  time: string;
  character: string;
  surpriseCard: string;
  status: 'draft' | 'completed';
  createdAt: string;
  updatedAt: string;
  currentVersionNumber: number;
  versions: StoryVersion[];
  classId?: string;
  taskId?: string;
  testType?: 'standard' | 'pre_test' | 'post_test';
}

export interface WritingTask {
  id: string;
  title: string;
  classId: string;
  description: string;
  targetGenre?: GenreType | 'all';
  minWords: number;
  maxWords: number;
  requireSurpriseCard: boolean;
  taskType: 'standard' | 'pre_test' | 'post_test';
  createdAt: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  grade: string;
  studentCodes: string[];
  createdAt: string;
}

export interface LiteratureGuideItem {
  id: GenreType;
  title: string;
  subtitle: string;
  definition: string;
  keyFeatures: string[];
  structure: string[];
  watchOutTips: string[];
  guidingQuestions: string[];
  sampleTitle: string;
  sampleExcerpt: string;
  writingAdvice: string[];
}
