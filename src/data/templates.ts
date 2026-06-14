import type { InterviewTemplate, Competency, Question, AIFollowupSuggestion } from '@/types';

export const mockCompetencies: Competency[] = [
  { id: 'comp1', name: '技术深度', description: '对核心技术的理解深度和广度', weight: 2 },
  { id: 'comp2', name: '问题解决能力', description: '分析问题和解决问题的逻辑思路', weight: 2 },
  { id: 'comp3', name: '系统设计能力', description: '架构设计和系统思维', weight: 1.5 },
  { id: 'comp4', name: '沟通表达', description: '语言表达和沟通协作', weight: 1 },
  { id: 'comp5', name: '学习成长', description: '学习意愿和成长潜力', weight: 1 },
  { id: 'comp6', name: '文化匹配', description: '价值观和团队匹配度', weight: 1 }
];

export const mockRequiredQuestions: Question[] = [
  {
    id: 'q1',
    content: '请介绍你最近主导的一个技术项目，你在其中的角色和主要贡献是什么？',
    type: 'required',
    competencyId: 'comp1',
    scoringGuide: '考察项目复杂度、候选人的参与深度、技术选型的合理性'
  },
  {
    id: 'q2',
    content: '请举例说明你解决过的最复杂的技术问题，你的思路和最终方案是什么？',
    type: 'required',
    competencyId: 'comp2',
    scoringGuide: '考察问题拆解能力、逻辑思维、方案落地能力'
  },
  {
    id: 'q3',
    content: '如果让你设计一个支持千万级用户的系统，你会考虑哪些方面？请画出核心架构。',
    type: 'required',
    competencyId: 'comp3',
    scoringGuide: '考察系统思维、可扩展性考虑、性能优化思路'
  },
  {
    id: 'q4',
    content: '请描述一次与同事意见不一致的情况，你是如何处理的？',
    type: 'required',
    competencyId: 'comp4',
    scoringGuide: '考察沟通方式、同理心、冲突解决能力'
  },
  {
    id: 'q5',
    content: '最近一年你在技术上有什么学习和成长？有什么新的技术方向想探索？',
    type: 'required',
    competencyId: 'comp5',
    scoringGuide: '考察学习主动性、学习方法、技术敏感度'
  },
  {
    id: 'q6',
    content: '你理想中的工作环境和团队氛围是什么样的？为什么选择我们公司？',
    type: 'required',
    competencyId: 'comp6',
    scoringGuide: '考察价值观匹配、动机、对公司的了解程度'
  }
];

export const mockFollowupQuestions: Question[] = [
  {
    id: 'f1',
    content: '这个方案相比其他方案有什么优劣势？为什么最终选择这个？',
    type: 'followup',
    competencyId: 'comp1'
  },
  {
    id: 'f2',
    content: '在这个过程中遇到了什么困难？你是如何克服的？',
    type: 'followup',
    competencyId: 'comp2'
  },
  {
    id: 'f3',
    content: '如果现在让你重新做这个项目，你会有什么不同的做法？',
    type: 'followup',
    competencyId: 'comp3'
  },
  {
    id: 'f4',
    content: '你从这次经历中学到了什么？',
    type: 'followup',
    competencyId: 'comp5'
  }
];

export const mockTemplates: InterviewTemplate[] = [
  {
    id: 't001',
    name: '高级前端工程师标准面试',
    position: '高级前端工程师',
    department: '技术部',
    competencies: mockCompetencies,
    requiredQuestions: mockRequiredQuestions,
    followupQuestions: mockFollowupQuestions,
    createdAt: '2026-01-15',
    updatedAt: '2026-05-20',
    usageCount: 156,
    isDefault: true
  },
  {
    id: 't002',
    name: '产品经理标准面试',
    position: '产品经理',
    department: '产品部',
    competencies: mockCompetencies,
    requiredQuestions: mockRequiredQuestions,
    followupQuestions: mockFollowupQuestions,
    createdAt: '2026-02-01',
    updatedAt: '2026-06-01',
    usageCount: 89,
    isDefault: false
  },
  {
    id: 't003',
    name: '后端工程师通用模板',
    position: '后端开发工程师',
    department: '技术部',
    competencies: mockCompetencies,
    requiredQuestions: mockRequiredQuestions,
    followupQuestions: mockFollowupQuestions,
    createdAt: '2026-03-10',
    updatedAt: '2026-05-15',
    usageCount: 203,
    isDefault: false
  }
];

export const mockAIFollowups: AIFollowupSuggestion[] = [
  {
    id: 'ai1',
    content: '候选人提到了「性能优化」，请问具体做了哪些优化？优化前后的指标数据是多少？',
    reason: '回答较为笼统，缺少具体数据支撑，需要验证真实性和深度',
    competency: '技术深度'
  },
  {
    id: 'ai2',
    content: '你刚才提到负责了核心模块开发，请问这个模块的具体技术难点是什么？你是怎么攻克的？',
    reason: '需要确认候选人对核心技术点的掌握程度',
    competency: '问题解决能力'
  },
  {
    id: 'ai3',
    content: '在项目协作中，你是如何与产品、设计同学对齐需求的？有没有遇到需求频繁变更的情况？',
    reason: '考察跨团队协作能力和沟通方式',
    competency: '沟通表达'
  }
];
