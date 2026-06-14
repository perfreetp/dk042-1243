import { create } from 'zustand';
import type { Candidate, InterviewSession, AnswerRecord, ScoreDimension, Question } from '@/types';
import { mockRequiredQuestions } from '@/data/templates';
import { mockInterviewSession } from '@/data/interviews';
import { mockCandidates } from '@/data/candidates';

interface InterviewState {
  currentCandidate: Candidate | null;
  currentSession: InterviewSession;
  selectedCandidates: string[];

  setCurrentCandidate: (candidate: Candidate) => void;
  setCurrentQuestionIndex: (index: number) => void;
  addAnswer: (record: AnswerRecord) => void;
  updateAnswer: (questionId: string, updates: Partial<AnswerRecord>) => void;
  setScores: (scores: ScoreDimension[]) => void;
  setOverallScore: (score: number) => void;
  setRecommendation: (rec: InterviewSession['recommendation']) => void;
  setSummary: (summary: string) => void;
  toggleCandidateSelection: (id: string) => void;
  clearSelection: () => void;
  startNewSession: (candidate: Candidate) => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  currentCandidate: mockCandidates[0],
  currentSession: {
    ...mockInterviewSession,
    questions: mockRequiredQuestions as Question[]
  },
  selectedCandidates: [],

  setCurrentCandidate: (candidate) => set({ currentCandidate: candidate }),
  setCurrentQuestionIndex: (index) => set((state) => ({
    currentSession: { ...state.currentSession, currentQuestionIndex: index }
  })),
  addAnswer: (record) => set((state) => ({
    currentSession: {
      ...state.currentSession,
      answers: [...state.currentSession.answers, record]
    }
  })),
  updateAnswer: (questionId, updates) => set((state) => ({
    currentSession: {
      ...state.currentSession,
      answers: state.currentSession.answers.map(a =>
        a.questionId === questionId ? { ...a, ...updates } : a
      )
    }
  })),
  setScores: (scores) => set((state) => ({
    currentSession: { ...state.currentSession, scores }
  })),
  setOverallScore: (score) => set((state) => ({
    currentSession: { ...state.currentSession, overallScore: score }
  })),
  setRecommendation: (rec) => set((state) => ({
    currentSession: { ...state.currentSession, recommendation: rec }
  })),
  setSummary: (summary) => set((state) => ({
    currentSession: { ...state.currentSession, summary }
  })),
  toggleCandidateSelection: (id) => set((state) => ({
    selectedCandidates: state.selectedCandidates.includes(id)
      ? state.selectedCandidates.filter(i => i !== id)
      : [...state.selectedCandidates, id]
  })),
  clearSelection: () => set({ selectedCandidates: [] }),
  startNewSession: (candidate) => set({
    currentCandidate: candidate,
    currentSession: {
      ...mockInterviewSession,
      id: `s${Date.now()}`,
      candidateId: candidate.id,
      position: candidate.position,
      startTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'in-progress',
      currentQuestionIndex: 0,
      questions: mockRequiredQuestions as Question[],
      answers: [],
      scores: [],
      overallScore: 0,
      summary: ''
    }
  })
}));
