export interface Candidate {
  id: string;
  name: string;
  avatar: string;
  position: string;
  department: string;
  experience: number;
  education: string;
  phone: string;
  email: string;
  status: 'pending' | 'interviewing' | 'scoring' | 'completed' | 'passed' | 'rejected';
  interviewRound: number;
  totalRounds: number;
  appliedAt: string;
  tags: string[];
  summary?: string;
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface Question {
  id: string;
  content: string;
  type: 'required' | 'followup' | 'ai-generated';
  competencyId: string;
  sampleAnswer?: string;
  scoringGuide?: string;
}

export interface AnswerRecord {
  questionId: string;
  answer: string;
  highlights: string[];
  doubts: string[];
  risks: string[];
}

export interface ScoreDimension {
  competencyId: string;
  score: number;
  maxScore: number;
  reason: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  templateId: string;
  position: string;
  interviewer: string;
  startTime: string;
  endTime?: string;
  status: 'preparing' | 'in-progress' | 'scoring' | 'completed';
  currentQuestionIndex: number;
  questions: Question[];
  answers: AnswerRecord[];
  scores: ScoreDimension[];
  overallScore: number;
  recommendation: 'strong-hire' | 'hire' | 'borderline' | 'no-hire';
  summary: string;
  reviewItems: string[];
  deviationAlerts: string[];
}

export interface InterviewTemplate {
  id: string;
  name: string;
  position: string;
  department: string;
  competencies: Competency[];
  requiredQuestions: Question[];
  followupQuestions: Question[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  isDefault: boolean;
}

export interface InterviewRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar: string;
  position: string;
  department: string;
  interviewer: string;
  interviewerName: string;
  round: number;
  totalRounds: number;
  date: string;
  duration: number;
  overallScore: number;
  recommendation: 'strong-hire' | 'hire' | 'borderline' | 'no-hire';
  summary: string;
  scores: ScoreDimension[];
  reviewItems: string[];
  exported: boolean;
}

export interface CompareItem {
  candidateId: string;
  candidateName: string;
  scores: ScoreDimension[];
  overallScore: number;
  recommendation: string;
  date: string;
}

export interface DeviationAlert {
  id: string;
  type: 'over-score' | 'under-score' | 'inconsistent' | 'missing-evidence';
  dimension: string;
  description: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AIFollowupSuggestion {
  id: string;
  content: string;
  reason: string;
  competency: string;
}
