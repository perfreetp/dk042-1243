import type { InterviewRecord, InterviewSession, DeviationAlert, CompareItem } from '@/types';
import { mockCompetencies } from './templates';

export const mockScores = mockCompetencies.map(c => ({
  competencyId: c.id,
  score: Math.round((Math.random() * 0.4 + 0.6) * 10),
  maxScore: 10,
  reason: `${c.name}表现${Math.random() > 0.5 ? '良好，能够有效解决复杂问题' : '达标，有一定的经验积累'}`
}));

export const mockInterviewSession: InterviewSession = {
  id: 's001',
  candidateId: 'c001',
  templateId: 't001',
  position: '高级前端工程师',
  interviewer: '面试官-李工',
  startTime: '2026-06-15 14:00',
  status: 'in-progress',
  currentQuestionIndex: 2,
  questions: [],
  answers: [],
  scores: [],
  overallScore: 0,
  recommendation: 'borderline',
  summary: '',
  reviewItems: [],
  deviationAlerts: []
};

export const mockInterviewRecords: InterviewRecord[] = [
  {
    id: 'r001',
    candidateId: 'c003',
    candidateName: '王浩然',
    candidateAvatar: 'https://picsum.photos/id/177/200/200',
    position: '后端开发工程师',
    department: '技术部',
    interviewer: '面试官-张总监',
    interviewerName: '张总监',
    round: 3,
    totalRounds: 3,
    date: '2026-06-10 10:00',
    duration: 75,
    overallScore: 88,
    recommendation: 'strong-hire',
    summary: '候选人技术基础扎实，有丰富的高并发系统设计经验。在Java微服务、分布式缓存、消息队列等方面有深入实践。沟通表达清晰，逻辑思维强。强烈推荐录用。',
    scores: mockScores,
    reviewItems: ['需要确认薪资期望是否在预算范围内', '背景调查确认工作经历真实性'],
    exported: true
  },
  {
    id: 'r002',
    candidateId: 'c005',
    candidateName: '刘子轩',
    candidateAvatar: 'https://picsum.photos/id/1027/200/200',
    position: '数据分析师',
    department: '数据部',
    interviewer: '面试官-王经理',
    interviewerName: '王经理',
    round: 3,
    totalRounds: 3,
    date: '2026-06-08 15:30',
    duration: 60,
    overallScore: 82,
    recommendation: 'hire',
    summary: '统计学背景扎实，SQL和Python能力达标。有AB测试和用户行为分析经验，数据敏感度较好。建议录用。',
    scores: mockScores,
    reviewItems: ['确认入职时间是否可提前'],
    exported: true
  },
  {
    id: 'r003',
    candidateId: 'c009',
    candidateName: '吴建华',
    candidateAvatar: 'https://picsum.photos/id/1027/200/200',
    position: '高级前端工程师',
    department: '技术部',
    interviewer: '面试官-陈架构师',
    interviewerName: '陈架构师',
    round: 3,
    totalRounds: 3,
    date: '2026-06-05 14:00',
    duration: 90,
    overallScore: 75,
    recommendation: 'borderline',
    summary: '技术广度不错，Vue生态经验丰富。但在前端工程化和性能优化方面深度稍显不足。可作为备选，建议与团队沟通后决定。',
    scores: mockScores,
    reviewItems: ['需交叉验证工程化能力', '与团队匹配度待评估'],
    exported: false
  },
  {
    id: 'r004',
    candidateId: 'c007',
    candidateName: '孙伟峰',
    candidateAvatar: 'https://picsum.photos/id/1012/200/200',
    position: '测试开发工程师',
    department: '技术部',
    interviewer: '面试官-刘测试',
    interviewerName: '刘测试',
    round: 2,
    totalRounds: 3,
    date: '2026-06-02 10:30',
    duration: 45,
    overallScore: 58,
    recommendation: 'no-hire',
    summary: '基础测试知识达标，但自动化测试框架设计能力偏弱，缺少性能测试实战经验。暂不建议录用。',
    scores: mockScores.map(s => ({ ...s, score: Math.round(s.score * 0.6) })),
    reviewItems: [],
    exported: true
  },
  {
    id: 'r005',
    candidateId: 'c001',
    candidateName: '张明远',
    candidateAvatar: 'https://picsum.photos/id/64/200/200',
    position: '高级前端工程师',
    department: '技术部',
    interviewer: '面试官-李工',
    interviewerName: '李工',
    round: 1,
    totalRounds: 3,
    date: '2026-06-12 09:00',
    duration: 60,
    overallScore: 80,
    recommendation: 'hire',
    summary: 'React技术栈熟练，有大型项目经验。技术深度和广度都达到要求。建议进入下一轮。',
    scores: mockScores,
    reviewItems: ['进一步考察系统设计能力'],
    exported: false
  }
];

export const mockDeviationAlerts: DeviationAlert[] = [
  {
    id: 'd1',
    type: 'over-score',
    dimension: '沟通表达',
    description: '该维度评分高于团队平均分15%，但回答记录中缺乏具体案例支撑',
    suggestion: '建议重新评估沟通维度，补充更多STAR案例后再打分',
    severity: 'high'
  },
  {
    id: 'd2',
    type: 'inconsistent',
    dimension: '技术深度',
    description: '技术深度评分8分，但问题回答中对核心原理的解释较浅显',
    suggestion: '可以增加一道原理性追问题，验证候选人的真实水平',
    severity: 'medium'
  },
  {
    id: 'd3',
    type: 'missing-evidence',
    dimension: '文化匹配',
    description: '评分理由中缺少具体案例描述，仅有主观判断',
    suggestion: '建议补充1-2个能体现文化匹配度的具体案例',
    severity: 'low'
  }
];

export const mockCompareItems: CompareItem[] = [
  {
    candidateId: 'c001',
    candidateName: '张明远',
    scores: mockCompetencies.map(c => ({
      competencyId: c.id,
      score: [8, 7, 7, 8, 8, 7][parseInt(c.id.replace('comp', '')) - 1] || 7,
      maxScore: 10,
      reason: ''
    })),
    overallScore: 78,
    recommendation: '推荐录用',
    date: '2026-06-12'
  },
  {
    candidateId: 'c009',
    candidateName: '吴建华',
    scores: mockCompetencies.map(c => ({
      competencyId: c.id,
      score: [7, 7, 6, 8, 6, 8][parseInt(c.id.replace('comp', '')) - 1] || 7,
      maxScore: 10,
      reason: ''
    })),
    overallScore: 72,
    recommendation: '待定复核',
    date: '2026-06-05'
  },
  {
    candidateId: 'c003',
    candidateName: '王浩然',
    scores: mockCompetencies.map(c => ({
      competencyId: c.id,
      score: [9, 9, 8, 8, 8, 9][parseInt(c.id.replace('comp', '')) - 1] || 8,
      maxScore: 10,
      reason: ''
    })),
    overallScore: 88,
    recommendation: '强烈推荐',
    date: '2026-06-10'
  }
];
