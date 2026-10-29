export type GenreType = 'hikaye' | 'masal' | 'bilim_kurgu' | 'polisiye' | 'ani' | 'gunluk' | 'siir' | 'fabl';

export type StoryStatus =
  | 'draft'
  | 'completed'
  | 'pending_teacher'
  | 'revision_requested'
  | 'resubmitted'
  | 'approved'
  | 'nominated_for_magazine'
  | 'published';

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

export interface TeacherFeedback {
  id: string;
  teacherId: string;
  teacherName: string;
  decision: 'approved' | 'revision_requested' | 'nominated_for_magazine' | 'published' | 'rejected';
  decisionLabel: string;
  generalComment: string;
  revisionChecklist: string[];
  rubricScores: Record<string, number>;
  rubricTotal: number;
  submittedAt: string;
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
  teacherFeedback?: TeacherFeedback | null;
  studentNotes?: string;
}

export interface Story {
  id: string;
  studentCode: string;
  authorUsername?: string;
  authorName?: string;
  authorClass?: string;
  title: string;
  genre: GenreType;
  place: string;
  time: string;
  character: string;
  surpriseCard: string;
  status: StoryStatus;
  createdAt: string;
  updatedAt: string;
  currentVersionNumber: number;
  versions: StoryVersion[];
  classId?: string;
  taskId?: string;
  testType?: 'standard' | 'pre_test' | 'post_test';
  publishedWorkId?: string;
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

export interface User {
  id: string;
  username: string;
  role: 'student' | 'teacher';
  name: string;
  classGrade?: string;
  pseudonym?: string;
  mustChangePassword?: boolean;
  createdAt: string;
}

export interface RubricLevel {
  level: number;
  label: string; // 'Geliştirilmeli' | 'Kısmen Yeterli' | 'Yeterli' | 'Çok İyi'
  description: string;
  score: number;
}

export interface RubricCriterion {
  id: string;
  key: string;
  name: string;
  description: string;
  maxScore: number;
  levels: RubricLevel[];
}

export interface PublishedWork {
  id: string;
  storyId: string;
  title: string;
  content: string;
  genre: GenreType;
  authorType: 'real_name' | 'pseudonym' | 'anonymous';
  authorDisplayName: string;
  studentUsername: string;
  teacherEditorNotes?: string;
  issueId?: string;
  issueNumber?: number;
  publishedAt: string;
  wordCount: number;
  likesCount: number;
  place: string;
  time: string;
  character: string;
  surpriseCard: string;
  score?: number;
}

export interface MagazineIssue {
  id: string;
  issueNumber: number;
  title: string;
  theme: string;
  editorNote: string;
  coverColor: string;
  publishedAt: string;
  workIds: string[];
  isCurrent: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string; // username or 'all_teachers'
  userRole: 'student' | 'teacher';
  title: string;
  message: string;
  storyId?: string;
  type: 'info' | 'revision' | 'approved' | 'magazine' | 'submission';
  read: boolean;
  createdAt: string;
}
