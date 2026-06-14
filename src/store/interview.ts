import { create } from 'zustand';
import type {
  Candidate,
  InterviewSession,
  AnswerRecord,
  ScoreDimension,
  Question,
  InterviewRecord,
  InterviewTemplate
} from '@/types';
import { mockRequiredQuestions } from '@/data/templates';
import { mockCandidates } from '@/data/candidates';
import { mockInterviewRecords, mockInterviewSession } from '@/data/interviews';
import { mockTemplates, mockCompetencies } from '@/data/templates';
import { storage, generateId, calculateOverallScore } from '@/utils';

interface InterviewState {
  candidates: Candidate[];
  interviewRecords: InterviewRecord[];
  templates: InterviewTemplate[];
  currentCandidate: Candidate | null;
  currentSession: InterviewSession;
  selectedCompareIds: string[];
  currentTemplateId: string;

  setCurrentCandidate: (candidate: Candidate) => void;
  setCurrentQuestionIndex: (index: number) => void;
  addAnswer: (record: AnswerRecord) => void;
  updateAnswer: (questionId: string, updates: Partial<AnswerRecord>) => void;
  setScores: (scores: ScoreDimension[]) => void;
  setOverallScore: (score: number) => void;
  setRecommendation: (rec: InterviewSession['recommendation']) => void;
  setSummary: (summary: string) => void;

  addCandidate: (candidate: Omit<Candidate, 'id' | 'appliedAt' | 'status' | 'interviewRound' | 'totalRounds'>) => void;
  batchAddCandidates: (candidates: Omit<Candidate, 'id' | 'appliedAt' | 'status' | 'interviewRound' | 'totalRounds'>[]) => void;
  updateCandidateStatus: (id: string, status: Candidate['status']) => void;

  startInterview: (candidateId: string, templateId?: string) => void;
  submitInterview: () => InterviewRecord | null;

  addTemplate: (template: Omit<InterviewTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'isDefault'>) => void;
  setCurrentTemplateId: (id: string) => void;

  setSelectedCompareIds: (ids: string[]) => void;
  toggleCompareCandidate: (id: string) => void;

  initFromStorage: () => void;
}

const getInitialSession = (): InterviewSession => ({
  ...mockInterviewSession,
  questions: mockRequiredQuestions as Question[]
});

export const useInterviewStore = create<InterviewState>((set, get) => ({
  candidates: mockCandidates,
  interviewRecords: mockInterviewRecords,
  templates: mockTemplates,
  currentCandidate: mockCandidates[0],
  currentSession: getInitialSession(),
  selectedCompareIds: ['c001', 'c003', 'c009'],
  currentTemplateId: 't001',

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

  updateAnswer: (questionId, updates) => set((state) => {
    const existing = state.currentSession.answers.find(a => a.questionId === questionId);
    let newAnswers;
    if (existing) {
      newAnswers = state.currentSession.answers.map(a =>
        a.questionId === questionId ? { ...a, ...updates } : a
      );
    } else {
      newAnswers = [...state.currentSession.answers, {
        questionId,
        answer: '',
        highlights: [],
        doubts: [],
        risks: [],
        ...updates
      } as AnswerRecord];
    }
    return {
      currentSession: { ...state.currentSession, answers: newAnswers }
    };
  }),

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

  addCandidate: (candidateData) => {
    const newCandidate: Candidate = {
      id: generateId(),
      ...candidateData,
      status: 'pending',
      interviewRound: 1,
      totalRounds: 3,
      appliedAt: new Date().toISOString().slice(0, 10)
    };
    set((state) => {
      const newCandidates = [newCandidate, ...state.candidates];
      storage.set('candidates', newCandidates);
      return { candidates: newCandidates };
    });
  },

  batchAddCandidates: (candidatesData) => {
    const newCandidates = candidatesData.map((c, i) => ({
      id: generateId(),
      ...c,
      status: 'pending' as const,
      interviewRound: 1,
      totalRounds: 3,
      appliedAt: new Date().toISOString().slice(0, 10)
    }));
    set((state) => {
      const merged = [...newCandidates, ...state.candidates];
      storage.set('candidates', merged);
      return { candidates: merged };
    });
  },

  updateCandidateStatus: (id, status) => {
    set((state) => {
      const newCandidates = state.candidates.map(c =>
        c.id === id ? { ...c, status } : c
      );
      storage.set('candidates', newCandidates);
      return { candidates: newCandidates };
    });
  },

  startInterview: (candidateId, templateId) => {
    const { candidates, templates } = get();
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    const tplId = templateId || get().currentTemplateId;
    const template = templates.find(t => t.id === tplId) || templates[0];

    const allQuestions = [
      ...template.requiredQuestions,
      ...template.followupQuestions
    ];

    const newSession: InterviewSession = {
      id: generateId(),
      candidateId: candidate.id,
      templateId: template.id,
      position: candidate.position,
      interviewer: '当前面试官',
      startTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'in-progress',
      currentQuestionIndex: 0,
      questions: allQuestions as Question[],
      answers: [],
      scores: template.competencies.map(comp => ({
        competencyId: comp.id,
        score: 7,
        maxScore: 10,
        reason: ''
      })),
      overallScore: 70,
      recommendation: 'borderline',
      summary: '',
      reviewItems: [],
      deviationAlerts: []
    };

    set({
      currentCandidate: candidate,
      currentSession: newSession
    });

    get().updateCandidateStatus(candidateId, 'interviewing');
  },

  submitInterview: () => {
    const { currentSession, currentCandidate, interviewRecords } = get();
    if (!currentCandidate) return null;

    const reviewItems: string[] = [];

    currentSession.answers.forEach(a => {
      if (a.risks && a.risks.length > 0) {
        a.risks.forEach(r => reviewItems.push(`风险：${r}`));
      }
      if (a.doubts && a.doubts.length > 0) {
        a.doubts.forEach(d => reviewItems.push(`疑点：${d}`));
      }
    });

    currentSession.scores.forEach(s => {
      if (s.score >= 8 && !s.reason?.trim()) {
        const comp = mockCompetencies.find(c => c.id === s.competencyId);
        reviewItems.push(`${comp?.name || '某维度'}高分但缺少评分理由`);
      }
      if (s.score <= 5 && !s.reason?.trim()) {
        const comp = mockCompetencies.find(c => c.id === s.competencyId);
        reviewItems.push(`${comp?.name || '某维度'}低分但缺少评分理由`);
      }
    });

    const duration = Math.round((Date.now() - new Date(currentSession.startTime.replace(' ', 'T')).getTime()) / 60000);

    const newRecord: InterviewRecord = {
      id: generateId(),
      candidateId: currentCandidate.id,
      candidateName: currentCandidate.name,
      candidateAvatar: currentCandidate.avatar,
      position: currentCandidate.position,
      department: currentCandidate.department,
      interviewer: '当前面试官',
      interviewerName: '当前面试官',
      round: currentCandidate.interviewRound,
      totalRounds: currentCandidate.totalRounds,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      duration: duration || 45,
      overallScore: currentSession.overallScore,
      recommendation: currentSession.recommendation,
      summary: currentSession.summary || '面试完成，等待详细评价',
      scores: currentSession.scores,
      reviewItems,
      exported: false
    };

    const newRecords = [newRecord, ...interviewRecords];
    storage.set('interviewRecords', newRecords);

    let newStatus: Candidate['status'] = 'completed';
    if (currentSession.recommendation === 'strong-hire' || currentSession.recommendation === 'hire') {
      newStatus = currentCandidate.interviewRound >= currentCandidate.totalRounds ? 'passed' : 'completed';
    } else if (currentSession.recommendation === 'no-hire') {
      newStatus = 'rejected';
    }

    const { candidates } = get();
    const updatedCandidates = candidates.map(c =>
      c.id === currentCandidate.id ? { ...c, status: newStatus } : c
    );
    storage.set('candidates', updatedCandidates);

    set({
      interviewRecords: newRecords,
      candidates: updatedCandidates
    });

    return newRecord;
  },

  addTemplate: (templateData) => {
    const newTemplate: InterviewTemplate = {
      id: generateId(),
      ...templateData,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      usageCount: 0,
      isDefault: false
    };
    set((state) => {
      const newTemplates = [...state.templates, newTemplate];
      storage.set('templates', newTemplates);
      return { templates: newTemplates };
    });
  },

  setCurrentTemplateId: (id) => set({ currentTemplateId: id }),

  setSelectedCompareIds: (ids) => set({ selectedCompareIds: ids }),

  toggleCompareCandidate: (id) => {
    set((state) => {
      const exists = state.selectedCompareIds.includes(id);
      if (exists) {
        return { selectedCompareIds: state.selectedCompareIds.filter(i => i !== id) };
      }
      if (state.selectedCompareIds.length >= 5) {
        Taro.showToast({ title: '最多选择5人对比', icon: 'none' });
        return { selectedCompareIds: state.selectedCompareIds };
      }
      return { selectedCompareIds: [...state.selectedCompareIds, id] };
    });
  },

  initFromStorage: () => {
    const savedCandidates = storage.get<Candidate[]>('candidates', null);
    const savedRecords = storage.get<InterviewRecord[]>('interviewRecords', null);
    const savedTemplates = storage.get<InterviewTemplate[]>('templates', null);

    if (savedCandidates && savedCandidates.length > 0) {
      set({ candidates: savedCandidates });
    }
    if (savedRecords && savedRecords.length > 0) {
      set({ interviewRecords: savedRecords });
    }
    if (savedTemplates && savedTemplates.length > 0) {
      set({ templates: savedTemplates });
    }
  }
}));
