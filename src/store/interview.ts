import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  Candidate,
  InterviewSession,
  InterviewTemplate,
  InterviewRecord,
  Competency,
  Question,
  ScoreDimension,
  AnswerRecord,
  DeviationAlert
} from '../types';
import { storage, calculateOverallScore } from '../utils';

interface InterviewState {
  candidates: Candidate[];
  templates: InterviewTemplate[];
  currentSession: InterviewSession | null;
  records: InterviewRecord[];
  compareCandidateIds: string[];
  currentTemplateId: string | null;
  currentRecordId: string | null;
  maxCompareCount: number;

  initFromStorage: () => void;
  persistToStorage: () => void;

  addCandidate: (candidate: Omit<Candidate, 'id' | 'status' | 'interviewRound' | 'totalRounds' | 'appliedAt' | 'avatar'>) => void;
  batchAddCandidates: (candidates: Array<Omit<Candidate, 'id' | 'status' | 'interviewRound' | 'totalRounds' | 'appliedAt' | 'avatar'>>) => void;
  updateCandidateStatus: (candidateId: string, status: Candidate['status']) => void;

  addTemplate: (template: Omit<InterviewTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'isDefault'>) => void;
  updateTemplate: (templateId: string, updates: Partial<InterviewTemplate>) => void;
  deleteTemplate: (templateId: string) => void;
  duplicateTemplate: (templateId: string) => void;
  setCurrentTemplateId: (templateId: string | null) => void;
  addCompetencyToTemplate: (templateId: string, competency: Omit<Competency, 'id'>) => void;
  updateCompetencyInTemplate: (templateId: string, competencyId: string, updates: Partial<Competency>) => void;
  deleteCompetencyFromTemplate: (templateId: string, competencyId: string) => void;
  addQuestionToTemplate: (templateId: string, question: Omit<Question, 'id'>) => void;
  updateQuestionInTemplate: (templateId: string, questionId: string, updates: Partial<Question>) => void;
  deleteQuestionFromTemplate: (templateId: string, questionId: string) => void;

  startInterview: (config: {
    candidateId: string;
    templateId: string;
    interviewerId: string;
    interviewerName: string;
    round: number;
    totalRounds: number;
  }) => void;
  updateAnswer: (questionId: string, answer: Partial<AnswerRecord>) => void;
  setScores: (scores: ScoreDimension[]) => void;
  setRecommendation: (recommendation: InterviewSession['recommendation']) => void;
  setSummary: (summary: string) => void;
  submitInterview: () => InterviewRecord;
  getCurrentSession: () => InterviewSession | null;

  getRecordById: (recordId: string) => InterviewRecord | undefined;
  getFilteredRecords: (filters?: {
    templateId?: string;
    interviewer?: string;
    recommendation?: string;
    keyword?: string;
  }) => InterviewRecord[];
  getUniqueInterviewers: () => string[];
  getUniqueTemplates: () => { id: string; name: string }[];
  exportRecordAsText: (recordId: string) => string;

  toggleCompareCandidate: (candidateId: string) => boolean;
  clearCompareCandidates: () => void;
  getCompareList: () => { candidate: Candidate; latestRecord: InterviewRecord | undefined }[];

  getDeviationAlerts: () => DeviationAlert[];
  generateAIComments: () => string;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultCompetencies: Competency[] = [
  { id: generateId(), name: '专业技术', description: '岗位所需的专业知识和技能', weight: 25 },
  { id: generateId(), name: '项目经验', description: '过往项目经历的深度和复杂度', weight: 20 },
  { id: generateId(), name: '问题解决', description: '分析和解决复杂问题的能力', weight: 15 },
  { id: generateId(), name: '沟通表达', description: '清晰表达和有效沟通的能力', weight: 15 },
  { id: generateId(), name: '团队协作', description: '团队合作和跨部门协同能力', weight: 15 },
  { id: generateId(), name: '文化适配', description: '与公司文化和价值观的匹配度', weight: 10 }
];

const defaultQuestions: Question[] = [
  { id: generateId(), content: '请介绍一下你自己和主要的工作经历', type: 'required', competencyIds: [] },
  { id: generateId(), content: '请描述一个你主导的最有成就感的项目', type: 'required', competencyIds: [] }
];

const getDefaultTemplates = (): InterviewTemplate[] => [
  {
    id: generateId(),
    name: '前端工程师通用模板',
    position: '前端工程师',
    department: '技术部',
    description: '适用于初中级前端工程师的通用面试模板',
    competencies: [...defaultCompetencies],
    requiredQuestions: [...defaultQuestions],
    followupQuestions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    isDefault: true
  }
];

const getDefaultCandidates = (): Candidate[] => [
  {
    id: generateId(),
    name: '张明',
    avatar: '',
    position: '高级前端工程师',
    department: '技术部',
    experience: 5,
    education: '本科',
    phone: '13800138001',
    email: 'zhangming@example.com',
    status: 'pending',
    interviewRound: 0,
    totalRounds: 3,
    appliedAt: new Date().toISOString(),
    tags: ['React', 'TypeScript', 'Node.js']
  },
  {
    id: generateId(),
    name: '李华',
    avatar: '',
    position: '前端工程师',
    department: '技术部',
    experience: 3,
    education: '硕士',
    phone: '13800138002',
    email: 'lihua@example.com',
    status: 'pending',
    interviewRound: 0,
    totalRounds: 3,
    appliedAt: new Date().toISOString(),
    tags: ['Vue', '小程序', 'CSS']
  }
];

export const useInterviewStore = create<InterviewState>((set, get) => ({
  candidates: [],
  templates: [],
  currentSession: null,
  records: [],
  compareCandidateIds: [],
  currentTemplateId: null,
  currentRecordId: null,
  maxCompareCount: 5,

  initFromStorage: () => {
    const candidates = storage.get<Candidate[]>('candidates', getDefaultCandidates());
    const templates = storage.get<InterviewTemplate[]>('templates', getDefaultTemplates());
    const records = storage.get<InterviewRecord[]>('records', []);
    const currentTemplateId = storage.get<string | null>('currentTemplateId', templates[0]?.id || null);
    const compareCandidateIds = storage.get<string[]>('compareCandidateIds', []);

    set({ candidates, templates, records, currentTemplateId, compareCandidateIds });
  },

  persistToStorage: () => {
    const { candidates, templates, records, currentTemplateId, compareCandidateIds } = get();
    storage.set('candidates', candidates);
    storage.set('templates', templates);
    storage.set('records', records);
    storage.set('currentTemplateId', currentTemplateId);
    storage.set('compareCandidateIds', compareCandidateIds);
  },

  addCandidate: (candidateData) => {
    const newCandidate: Candidate = {
      ...candidateData,
      id: generateId(),
      avatar: '',
      status: 'pending',
      interviewRound: 0,
      totalRounds: 3,
      appliedAt: new Date().toISOString()
    };
    set(state => ({ candidates: [newCandidate, ...state.candidates] }));
    get().persistToStorage();
  },

  batchAddCandidates: (candidatesData) => {
    const newCandidates: Candidate[] = candidatesData.map(c => ({
      ...c,
      id: generateId(),
      avatar: '',
      status: 'pending',
      interviewRound: 0,
      totalRounds: 3,
      appliedAt: new Date().toISOString()
    }));
    set(state => ({ candidates: [...newCandidates, ...state.candidates] }));
    get().persistToStorage();
  },

  updateCandidateStatus: (candidateId, status) => {
    set(state => ({
      candidates: state.candidates.map(c =>
        c.id === candidateId ? { ...c, status } : c
      )
    }));
    get().persistToStorage();
  },

  addTemplate: (templateData) => {
    const newTemplate: InterviewTemplate = {
      ...templateData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      isDefault: false
    };
    set(state => ({ templates: [...state.templates, newTemplate] }));
    get().persistToStorage();
  },

  updateTemplate: (templateId, updates) => {
    set(state => ({
      templates: state.templates.map(t =>
        t.id === templateId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    }));
    get().persistToStorage();
  },

  deleteTemplate: (templateId) => {
    set(state => ({
      templates: state.templates.filter(t => t.id !== templateId)
    }));
    get().persistToStorage();
  },

  duplicateTemplate: (templateId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (template) {
      const newTemplate: InterviewTemplate = {
        ...template,
        id: generateId(),
        name: `${template.name}（副本）`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        isDefault: false
      };
      set(state => ({ templates: [...state.templates, newTemplate] }));
      get().persistToStorage();
    }
  },

  setCurrentTemplateId: (templateId) => {
    set({ currentTemplateId: templateId });
    get().persistToStorage();
  },

  addCompetencyToTemplate: (templateId, competencyData) => {
    const newCompetency: Competency = {
      ...competencyData,
      id: generateId()
    };
    set(state => ({
      templates: state.templates.map(t =>
        t.id === templateId
          ? {
              ...t,
              competencies: [...t.competencies, newCompetency],
              updatedAt: new Date().toISOString()
            }
          : t
      )
    }));
    get().persistToStorage();
  },

  updateCompetencyInTemplate: (templateId, competencyId, updates) => {
    set(state => ({
      templates: state.templates.map(t =>
        t.id === templateId
          ? {
              ...t,
              competencies: t.competencies.map(c =>
                c.id === competencyId ? { ...c, ...updates } : c
              ),
              updatedAt: new Date().toISOString()
            }
          : t
      )
    }));
    get().persistToStorage();
  },

  deleteCompetencyFromTemplate: (templateId, competencyId) => {
    set(state => ({
      templates: state.templates.map(t =>
        t.id === templateId
          ? {
              ...t,
              competencies: t.competencies.filter(c => c.id !== competencyId),
              updatedAt: new Date().toISOString()
            }
          : t
      )
    }));
    get().persistToStorage();
  },

  addQuestionToTemplate: (templateId, questionData) => {
    const newQuestion: Question = {
      ...questionData,
      id: generateId()
    };
    set(state => ({
      templates: state.templates.map(t =>
        t.id === templateId
          ? {
              ...t,
              [questionData.type === 'required' ? 'requiredQuestions' : 'followupQuestions']: [
                ...t[questionData.type === 'required' ? 'requiredQuestions' : 'followupQuestions'],
                newQuestion
              ],
              updatedAt: new Date().toISOString()
            }
          : t
      )
    }));
    get().persistToStorage();
  },

  updateQuestionInTemplate: (templateId, questionId, updates) => {
    set(state => ({
      templates: state.templates.map(t => {
        if (t.id !== templateId) return t;
        const updated = { ...t, updatedAt: new Date().toISOString() };
        const reqIdx = t.requiredQuestions.findIndex(q => q.id === questionId);
        if (reqIdx !== -1) {
          updated.requiredQuestions = [...t.requiredQuestions];
          updated.requiredQuestions[reqIdx] = { ...t.requiredQuestions[reqIdx], ...updates };
          return updated;
        }
        const folIdx = t.followupQuestions.findIndex(q => q.id === questionId);
        if (folIdx !== -1) {
          updated.followupQuestions = [...t.followupQuestions];
          updated.followupQuestions[folIdx] = { ...t.followupQuestions[folIdx], ...updates };
          return updated;
        }
        return t;
      })
    }));
    get().persistToStorage();
  },

  deleteQuestionFromTemplate: (templateId, questionId) => {
    set(state => ({
      templates: state.templates.map(t =>
        t.id === templateId
          ? {
              ...t,
              requiredQuestions: t.requiredQuestions.filter(q => q.id !== questionId),
              followupQuestions: t.followupQuestions.filter(q => q.id !== questionId),
              updatedAt: new Date().toISOString()
            }
          : t
      )
    }));
    get().persistToStorage();
  },

  startInterview: (config) => {
    const { candidateId, templateId, interviewerId, interviewerName, round, totalRounds } = config;
    const candidate = get().candidates.find(c => c.id === candidateId);
    const template = get().templates.find(t => t.id === templateId);

    if (!candidate || !template) return;

    const questions: Question[] = [
      ...template.requiredQuestions,
      ...template.followupQuestions
    ];

    const scores: ScoreDimension[] = template.competencies.map(c => ({
      competencyId: c.id,
      score: 0,
      maxScore: 10,
      reason: ''
    }));

    const answers: AnswerRecord[] = questions.map(q => ({
      questionId: q.id,
      answer: '',
      highlights: [],
      doubts: [],
      risks: []
    }));

    const newSession: InterviewSession = {
      id: generateId(),
      candidateId,
      templateId,
      templateName: template.name,
      position: candidate.position,
      interviewer: interviewerId,
      interviewerName,
      round,
      totalRounds,
      startTime: new Date().toISOString(),
      status: 'in-progress',
      currentQuestionIndex: 0,
      questions,
      answers,
      scores,
      overallScore: 0,
      recommendation: 'borderline',
      summary: '',
      reviewItems: [],
      deviationAlerts: []
    };

    set({ currentSession: newSession });
    get().updateCandidateStatus(candidateId, 'interviewing');

    set(state => ({
      templates: state.templates.map(t =>
        t.id === templateId ? { ...t, usageCount: t.usageCount + 1 } : t
      )
    }));
    get().persistToStorage();
  },

  updateAnswer: (questionId, answerUpdate) => {
    set(state => {
      if (!state.currentSession) return state;
      const session = state.currentSession;
      const answerIdx = session.answers.findIndex(a => a.questionId === questionId);
      if (answerIdx === -1) return state;

      const newAnswers = [...session.answers];
      newAnswers[answerIdx] = { ...newAnswers[answerIdx], ...answerUpdate };

      return {
        currentSession: { ...session, answers: newAnswers }
      };
    });
  },

  setScores: (scores) => {
    set(state => {
      if (!state.currentSession) return state;
      const template = state.templates.find(t => t.id === state.currentSession!.templateId);
      const overallScore = calculateOverallScore(scores, template?.competencies || []);
      return {
        currentSession: { ...state.currentSession, scores, overallScore }
      };
    });
  },

  setRecommendation: (recommendation) => {
    set(state => state.currentSession ? {
      currentSession: { ...state.currentSession, recommendation }
    } : state);
  },

  setSummary: (summary) => {
    set(state => state.currentSession ? {
      currentSession: { ...state.currentSession, summary }
    } : state);
  },

  submitInterview: () => {
    const session = get().currentSession;
    if (!session) throw new Error('No active interview session');

    const candidate = get().candidates.find(c => c.id === session.candidateId);
    const template = get().templates.find(t => t.id === session.templateId);

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - new Date(session.startTime).getTime()) / 60000);

    const reviewItems: string[] = [];
    session.answers.forEach((a, idx) => {
      if (a.risks.length > 0) reviewItems.push(`${session.questions[idx]?.content || '第' + (idx + 1) + '题'}: 风险点 - ${a.risks.join('、')}`);
      if (a.doubts.length > 0) reviewItems.push(`${session.questions[idx]?.content || '第' + (idx + 1) + '题'}: 待核实 - ${a.doubts.join('、')}`);
    });

    session.scores.forEach((s, idx) => {
      const comp = template?.competencies[idx];
      if (!s.reason || s.reason.trim().length < 5) {
        if (s.score >= 8 || s.score <= 3) {
          reviewItems.push(`${comp?.name || '维度' + (idx + 1)}: ${s.score >= 8 ? '高分' : '低分'}缺乏评分理由`);
        }
      }
    });

    const record: InterviewRecord = {
      id: generateId(),
      candidateId: session.candidateId,
      candidateName: candidate?.name || '',
      candidateAvatar: candidate?.avatar || '',
      position: session.position,
      department: candidate?.department || '',
      templateId: session.templateId,
      templateName: session.templateName,
      interviewer: session.interviewer,
      interviewerName: session.interviewerName,
      round: session.round,
      totalRounds: session.totalRounds,
      date: new Date().toISOString(),
      duration,
      overallScore: session.overallScore,
      recommendation: session.recommendation,
      summary: session.summary,
      answers: session.answers,
      questions: session.questions,
      scores: session.scores,
      reviewItems,
      exported: false
    };

    const newStatus: Candidate['status'] =
      session.recommendation === 'strong-hire' || session.recommendation === 'hire' ? 'passed' :
      session.recommendation === 'no-hire' ? 'rejected' : 'completed';

    set(state => ({
      records: [record, ...state.records],
      currentSession: null,
      candidates: state.candidates.map(c =>
        c.id === session.candidateId ? { ...c, status: newStatus, interviewRound: session.round } : c
      )
    }));

    get().persistToStorage();
    return record;
  },

  getCurrentSession: () => get().currentSession,

  getRecordById: (recordId) => get().records.find(r => r.id === recordId),

  getFilteredRecords: (filters) => {
    let records = [...get().records];
    if (!filters) return records;

    if (filters.templateId) {
      records = records.filter(r => r.templateId === filters.templateId);
    }
    if (filters.interviewer) {
      records = records.filter(r => r.interviewerName === filters.interviewer);
    }
    if (filters.recommendation) {
      records = records.filter(r => r.recommendation === filters.recommendation);
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      records = records.filter(r =>
        r.candidateName.toLowerCase().includes(kw) ||
        r.position.toLowerCase().includes(kw) ||
        r.summary.toLowerCase().includes(kw)
      );
    }
    return records;
  },

  getUniqueInterviewers: () => {
    const names = new Set(get().records.map(r => r.interviewerName).filter(Boolean));
    return Array.from(names);
  },

  getUniqueTemplates: () => {
    const map = new Map<string, string>();
    get().records.forEach(r => {
      if (r.templateId && r.templateName) {
        map.set(r.templateId, r.templateName);
      }
    });
    get().templates.forEach(t => {
      if (!map.has(t.id)) {
        map.set(t.id, t.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  },

  exportRecordAsText: (recordId) => {
    const record = get().getRecordById(recordId);
    if (!record) return '';

    const template = get().templates.find(t => t.id === record.templateId);
    const compMap = new Map(template?.competencies.map(c => [c.id, c.name]) || []);

    const lines = [
      '========================================',
      '           面试纪要',
      '========================================',
      '',
      `候选人：${record.candidateName}`,
      `岗位：${record.position}`,
      `部门：${record.department}`,
      `面试模板：${record.templateName}`,
      `面试官：${record.interviewerName}`,
      `轮次：第 ${record.round} / ${record.totalRounds} 轮`,
      `面试时间：${new Date(record.date).toLocaleString('zh-CN')}`,
      `面试时长：${record.duration} 分钟`,
      '',
      '----------------------------------------',
      '            综合得分',
      '----------------------------------------',
      '',
      `总分：${record.overallScore} 分`,
      `录用建议：${record.recommendation === 'strong-hire' ? '强烈推荐录用' : record.recommendation === 'hire' ? '推荐录用' : record.recommendation === 'borderline' ? '待定' : '不推荐'}`,
      '',
      '----------------------------------------',
      '            面试官总结',
      '----------------------------------------',
      '',
      record.summary || '（无）',
      '',
      '----------------------------------------',
      '            各维度评分',
      '----------------------------------------',
      '',
      ...record.scores.map(s => {
        const name = compMap.get(s.competencyId) || '维度';
        return `【${name}】 ${s.score} / ${s.maxScore} 分`;
      }),
      '',
      ...record.scores.filter(s => s.reason).map(s => {
        const name = compMap.get(s.competencyId) || '维度';
        return `  - ${name} 理由：${s.reason}`;
      }),
      '',
      '----------------------------------------',
      '            问答记录',
      '----------------------------------------',
      '',
      ...record.questions.map((q, idx) => {
        const a = record.answers[idx];
        const out = [`Q${idx + 1}: ${q.content}`, ''];
        if (a?.answer) out.push(`A: ${a.answer}`, '');
        if (a?.highlights?.length) out.push(`  ✨ 亮点：${a.highlights.join('、')}`, '');
        if (a?.doubts?.length) out.push(`  ❓ 疑点：${a.doubts.join('、')}`, '');
        if (a?.risks?.length) out.push(`  ⚠️  风险：${a.risks.join('、')}`, '');
        out.push('');
        return out.join('\n');
      }),
      '----------------------------------------',
      '            需要复核的问题',
      '----------------------------------------',
      '',
      record.reviewItems.length > 0
        ? record.reviewItems.map((item, i) => `${i + 1}. ${item}`).join('\n')
        : '（无）',
      '',
      '========================================',
      `导出时间：${new Date().toLocaleString('zh-CN')}`,
      '========================================'
    ];

    return lines.join('\n');
  },

  toggleCompareCandidate: (candidateId) => {
    const { compareCandidateIds, maxCompareCount } = get();
    const idx = compareCandidateIds.indexOf(candidateId);

    if (idx !== -1) {
      const newIds = compareCandidateIds.filter(id => id !== candidateId);
      set({ compareCandidateIds: newIds });
      get().persistToStorage();
      return true;
    }

    if (compareCandidateIds.length >= maxCompareCount) {
      return false;
    }

    set({ compareCandidateIds: [...compareCandidateIds, candidateId] });
    get().persistToStorage();
    return true;
  },

  clearCompareCandidates: () => {
    set({ compareCandidateIds: [] });
    get().persistToStorage();
  },

  getCompareList: () => {
    const { compareCandidateIds, candidates, records } = get();
    return compareCandidateIds
      .map(id => {
        const candidate = candidates.find(c => c.id === id);
        if (!candidate) return null;
        const latestRecord = records
          .filter(r => r.candidateId === id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        return { candidate, latestRecord };
      })
      .filter(Boolean) as { candidate: Candidate; latestRecord: InterviewRecord | undefined }[];
  },

  getDeviationAlerts: (): DeviationAlert[] => {
    return [
      {
        id: generateId(),
        type: 'over-score',
        title: '高分宽容偏差',
        description: '您最近3次「沟通表达」评分比团队平均分高15%，可能存在评价标准偏松的情况',
        calibrationTip: '建议参考STAR原则，要求候选人提供具体的沟通场景和结果',
        severity: 'medium'
      },
      {
        id: generateId(),
        type: 'under-score',
        title: '学历偏见风险',
        description: '您对非本科学历候选人的「文化适配」评分普遍偏低，需警惕学历偏见',
        calibrationTip: '聚焦候选人实际表现和价值观匹配度，而非背景标签',
        severity: 'high'
      },
      {
        id: generateId(),
        type: 'missing-evidence',
        title: '评分证据不足',
        description: '42%的评分理由字数不足10字，缺乏具体行为证据支撑',
        calibrationTip: '每个评分理由请包含：场景+行为+结果三个要素',
        severity: 'high'
      },
      {
        id: generateId(),
        type: 'inconsistent',
        title: '标准不一致',
        description: '相同岗位不同候选人的「专业技术」权重波动达30%，需统一评分标准',
        calibrationTip: '使用岗位模板的默认权重配置，保持评价一致性',
        severity: 'medium'
      }
    ];
  },

  generateAIComments: () => {
    const session = get().currentSession;
    if (!session) return '';

    const highlights = session.answers.flatMap(a => a.highlights).filter(Boolean);
    const risks = session.answers.flatMap(a => a.risks).filter(Boolean);
    const doubts = session.answers.flatMap(a => a.doubts).filter(Boolean);

    const comps: string[] = [];
    const template = get().templates.find(t => t.id === session.templateId);
    session.scores.forEach(s => {
      const comp = template?.competencies.find(c => c.id === s.competencyId);
      if (comp && s.score >= 7) comps.push(comp.name);
    });

    const parts: string[] = [];

    if (comps.length > 0) {
      parts.push(`候选人在${comps.join('、')}方面表现突出，`);
    }

    if (highlights.length > 0) {
      parts.push(`展现出${highlights.slice(0, 3).join('、')}等亮点。`);
    }

    if (risks.length > 0) {
      parts.push(`需关注${risks.slice(0, 2).join('、')}等潜在风险。`);
    }

    if (doubts.length > 0) {
      parts.push(`建议进一步核实${doubts.slice(0, 2).join('、')}。`);
    }

    if (session.overallScore >= 80) {
      parts.push('综合来看，候选人能力与岗位要求高度匹配，建议录用。');
    } else if (session.overallScore >= 60) {
      parts.push('综合来看，候选人基本符合岗位要求，可考虑进入下一轮。');
    } else {
      parts.push('综合来看，候选人与岗位要求存在一定差距，建议审慎评估。');
    }

    return parts.join('');
  }
}));
