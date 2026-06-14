import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useInterviewStore } from '../../store/interview';
import { RADAR_COLORS, getRecommendationText, getRecommendationBgColor, getSeverityColor } from '../../utils';
import type { Competency, Question } from '../../types';
import styles from './index.module.scss';

type TabType = 'compare' | 'calibration' | 'templates';

export default function Analysis() {
  const [activeTab, setActiveTab] = useState<TabType>('compare');
  const [showEditor, setShowEditor] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const {
    candidates,
    templates,
    compareCandidateIds,
    maxCompareCount,
    currentTemplateId,
    toggleCompareCandidate,
    clearCompareCandidates,
    getCompareList,
    getDeviationAlerts,
    addTemplate,
    updateTemplate,
    duplicateTemplate,
    deleteTemplate,
    setCurrentTemplateId,
    addCompetencyToTemplate,
    updateCompetencyInTemplate,
    deleteCompetencyFromTemplate,
    addQuestionToTemplate,
    updateQuestionInTemplate,
    deleteQuestionFromTemplate
  } = useInterviewStore();

  const compareList = getCompareList();
  const alerts = getDeviationAlerts();

  const radarData = useMemo(() => {
    if (compareList.length === 0) return { labels: [], datasets: [] };

    const firstRecord = compareList[0].latestRecord;
    if (!firstRecord) return { labels: [], datasets: [] };

    const template = templates.find(t => t.id === firstRecord.templateId);
    const labels = template?.competencies.map(c => c.name) || [];

    const datasets = compareList.map((item, idx) => ({
      label: item.candidate.name,
      color: RADAR_COLORS[idx % RADAR_COLORS.length],
      values: item.latestRecord?.scores.map(s => s.score) || labels.map(() => 0)
    }));

    return { labels, datasets };
  }, [compareList, templates]);

  const handleToggleCandidate = (candidateId: string) => {
    const success = toggleCompareCandidate(candidateId);
    if (!success) {
      Taro.showToast({
        title: `最多只能对比${maxCompareCount}人`,
        icon: 'none',
        duration: 1500
      });
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplateId(null);
    setShowTemplateEditor(true);
  };

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(templateId);
    setShowTemplateEditor(true);
  };

  const handleUseTemplate = (templateId: string) => {
    setCurrentTemplateId(templateId);
    Taro.showToast({ title: '已设为当前模板', icon: 'success' });
  };

  const handleDuplicateTemplate = (templateId: string) => {
    duplicateTemplate(templateId);
    Taro.showToast({ title: '已复制', icon: 'success' });
  };

  const handleDeleteTemplate = (templateId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该模板吗？',
      success: (res) => {
        if (res.confirm) {
          deleteTemplate(templateId);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  const TemplateEditorContent = () => {
    const [formData, setFormData] = useState(() => {
      if (editingTemplateId) {
        const t = templates.find(t => t.id === editingTemplateId);
        if (t) return {
          name: t.name,
          position: t.position,
          department: t.department,
          description: t.description,
          competencies: [...t.competencies],
          requiredQuestions: [...t.requiredQuestions],
          followupQuestions: [...t.followupQuestions]
        };
      }
      return {
        name: '',
        position: '',
        department: '',
        description: '',
        competencies: [] as Competency[],
        requiredQuestions: [] as Question[],
        followupQuestions: [] as Question[]
      };
    });

    const [editingCompetencyId, setEditingCompetencyId] = useState<string | null>(null);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [questionType, setQuestionType] = useState<'required' | 'followup'>('required');

    const handleSave = () => {
      if (!formData.name.trim()) {
        Taro.showToast({ title: '请输入模板名称', icon: 'none' });
        return;
      }
      if (formData.competencies.length === 0) {
        Taro.showToast({ title: '至少添加一个能力维度', icon: 'none' });
        return;
      }

      if (editingTemplateId) {
        updateTemplate(editingTemplateId, formData);
        Taro.showToast({ title: '已保存', icon: 'success' });
      } else {
        addTemplate(formData);
        Taro.showToast({ title: '已创建', icon: 'success' });
      }
      setShowTemplateEditor(false);
    };

    const handleAddCompetency = () => {
      const newComp: Competency = {
        id: 'temp-' + Date.now(),
        name: '',
        description: '',
        weight: 10
      };
      setFormData(prev => ({
        ...prev,
        competencies: [...prev.competencies, newComp]
      }));
      setEditingCompetencyId(newComp.id);
    };

    const handleUpdateCompetency = (id: string, updates: Partial<Competency>) => {
      setFormData(prev => ({
        ...prev,
        competencies: prev.competencies.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      }));
    };

    const handleDeleteCompetency = (id: string) => {
      setFormData(prev => ({
        ...prev,
        competencies: prev.competencies.filter(c => c.id !== id)
      }));
    };

    const handleAddQuestion = () => {
      const newQ: Question = {
        id: 'temp-' + Date.now(),
        content: '',
        type: questionType,
        competencyIds: []
      };
      setFormData(prev => ({
        ...prev,
        [questionType === 'required' ? 'requiredQuestions' : 'followupQuestions']: [
          ...prev[questionType === 'required' ? 'requiredQuestions' : 'followupQuestions'],
          newQ
        ]
      }));
      setEditingQuestionId(newQ.id);
    };

    const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
      setFormData(prev => {
        const updated = { ...prev };
        const reqIdx = prev.requiredQuestions.findIndex(q => q.id === id);
        if (reqIdx !== -1) {
          updated.requiredQuestions = [...prev.requiredQuestions];
          updated.requiredQuestions[reqIdx] = { ...prev.requiredQuestions[reqIdx], ...updates };
          return updated;
        }
        const folIdx = prev.followupQuestions.findIndex(q => q.id === id);
        if (folIdx !== -1) {
          updated.followupQuestions = [...prev.followupQuestions];
          updated.followupQuestions[folIdx] = { ...prev.followupQuestions[folIdx], ...updates };
        }
        return updated;
      });
    };

    const handleDeleteQuestion = (id: string) => {
      setFormData(prev => ({
        ...prev,
        requiredQuestions: prev.requiredQuestions.filter(q => q.id !== id),
        followupQuestions: prev.followupQuestions.filter(q => q.id !== id)
      }));
    };

    const totalWeight = formData.competencies.reduce((sum, c) => sum + c.weight, 0);

    return (
      <View className={styles.editorOverlay}>
        <View className={styles.editorPanel}>
          <View className={styles.editorHeader}>
            <Text className={styles.editorTitle}>
              {editingTemplateId ? '编辑模板' : '创建模板'}
            </Text>
            <Text className={styles.closeBtn} onClick={() => setShowTemplateEditor(false)}>×</Text>
          </View>

          <ScrollView className={styles.editorBody} scrollY>
            <View className={styles.formSection}>
              <Text className={styles.formLabel}>模板名称 *</Text>
              <Input
                className={styles.formInput}
                placeholder="如：高级Java工程师通用模板"
                value={formData.name}
                onInput={e => setFormData(prev => ({ ...prev, name: e.detail.value }))}
              />
            </View>

            <View className={styles.formRow}>
              <View className={styles.formSection} style={{ flex: 1 }}>
                <Text className={styles.formLabel}>适用岗位</Text>
                <Input
                  className={styles.formInput}
                  placeholder="如：Java工程师"
                  value={formData.position}
                  onInput={e => setFormData(prev => ({ ...prev, position: e.detail.value }))}
                />
              </View>
              <View className={styles.formSection} style={{ flex: 1, marginLeft: 20 }}>
                <Text className={styles.formLabel}>适用部门</Text>
                <Input
                  className={styles.formInput}
                  placeholder="如：技术部"
                  value={formData.department}
                  onInput={e => setFormData(prev => ({ ...prev, department: e.detail.value }))}
                />
              </View>
            </View>

            <View className={styles.formSection}>
              <Text className={styles.formLabel}>模板描述</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="简要说明模板的适用场景和特点"
                value={formData.description}
                onInput={e => setFormData(prev => ({ ...prev, description: e.detail.value }))}
              />
            </View>

            <View className={styles.formSection}>
              <View className={styles.sectionHeader}>
                <Text className={styles.formLabel}>能力维度配置</Text>
                <Text className={styles.weightInfo}>权重合计: {totalWeight}</Text>
                <Text className={styles.addBtn} onClick={handleAddCompetency}>+ 添加</Text>
              </View>

              {formData.competencies.map((c, idx) => (
                <View key={c.id} className={styles.competencyItem}>
                  <View className={styles.competencyHeader}>
                    <Text className={styles.competencyIndex}>维度 {idx + 1}</Text>
                    <Text
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteCompetency(c.id)}
                    >删除</Text>
                  </View>
                  <View className={styles.competencyBody}>
                    <Input
                      className={styles.formInput}
                      placeholder="维度名称，如：专业技术"
                      value={c.name}
                      onInput={e => handleUpdateCompetency(c.id, { name: e.detail.value })}
                    />
                    <View className={styles.weightRow}>
                      <Text className={styles.weightLabel}>权重</Text>
                      <Input
                        className={styles.weightInput}
                        type="number"
                        value={String(c.weight)}
                        onInput={e => handleUpdateCompetency(c.id, { weight: parseInt(e.detail.value) || 0 })}
                      />
                    </View>
                    <Textarea
                      className={styles.formTextarea}
                      style={{ height: 100 }}
                      placeholder="维度说明，描述该能力的考察要点"
                      value={c.description}
                      onInput={e => handleUpdateCompetency(c.id, { description: e.detail.value })}
                    />
                  </View>
                </View>
              ))}

              {formData.competencies.length === 0 && (
                <View className={styles.emptyHint}>
                  <Text>还没有配置能力维度，点击上方「添加」开始配置</Text>
                </View>
              )}
            </View>

            <View className={styles.formSection}>
              <View className={styles.sectionHeader}>
                <Text className={styles.formLabel}>面试题库</Text>
                <View className={styles.questionTypeTabs}>
                  <Text
                    className={`${styles.typeTab} ${questionType === 'required' ? styles.active : ''}`}
                    onClick={() => setQuestionType('required')}
                  >必问题</Text>
                  <Text
                    className={`${styles.typeTab} ${questionType === 'followup' ? styles.active : ''}`}
                    onClick={() => setQuestionType('followup')}
                  >追问题</Text>
                </View>
                <Text className={styles.addBtn} onClick={handleAddQuestion}>+ 添加</Text>
              </View>

              {(questionType === 'required' ? formData.requiredQuestions : formData.followupQuestions).map((q, idx) => (
                <View key={q.id} className={styles.questionItem}>
                  <View className={styles.questionHeader}>
                    <Text className={styles.questionIndex}>Q{idx + 1}</Text>
                    <Text
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteQuestion(q.id)}
                    >删除</Text>
                  </View>
                  <Textarea
                    className={styles.formTextarea}
                    style={{ height: 120 }}
                    placeholder="请输入面试问题"
                    value={q.content}
                    onInput={e => handleUpdateQuestion(q.id, { content: e.detail.value })}
                  />
                </View>
              ))}

              {(questionType === 'required' ? formData.requiredQuestions : formData.followupQuestions).length === 0 && (
                <View className={styles.emptyHint}>
                  <Text>还没有配置{questionType === 'required' ? '必问题' : '追问题'}，点击上方「添加」开始配置</Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View className={styles.editorFooter}>
            <button className={styles.cancelBtn} onClick={() => setShowTemplateEditor(false)}>取消</button>
            <button className={styles.saveBtn} onClick={handleSave}>保存</button>
          </View>
        </View>
      </View>
    );
  };

  const renderRadar = () => {
    if (radarData.labels.length === 0 || radarData.datasets.length === 0) {
      return (
        <View className={styles.emptyRadar}>
          <Text>请先选择候选人进行对比</Text>
        </View>
      );
    }

    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 120;
    const levels = 5;
    const angleStep = (Math.PI * 2) / radarData.labels.length;

    const getPoint = (idx: number, value: number, max: number = 10) => {
      const r = (value / max) * radius;
      const angle = idx * angleStep - Math.PI / 2;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      };
    };

    const labelOffset = 140;
    const getLabelPoint = (idx: number) => {
      const angle = idx * angleStep - Math.PI / 2;
      return {
        x: cx + labelOffset * Math.cos(angle),
        y: cy + labelOffset * Math.sin(angle)
      };
    };

    return (
      <View className={styles.radarContainer}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {[...Array(levels)].map((_, levelIdx) => {
            const r = ((levelIdx + 1) / levels) * radius;
            const points = radarData.labels.map((_, idx) => {
              const angle = idx * angleStep - Math.PI / 2;
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            }).join(' ');
            return (
              <polygon
                key={`grid-${levelIdx}`}
                points={points}
                fill="none"
                stroke="#E5E6EB"
                strokeWidth="1"
              />
            );
          })}

          {radarData.labels.map((_, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            const x2 = cx + radius * Math.cos(angle);
            const y2 = cy + radius * Math.sin(angle);
            return (
              <line
                key={`axis-${idx}`}
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                stroke="#E5E6EB"
                strokeWidth="1"
              />
            );
          })}

          {radarData.datasets.map((dataset, dsIdx) => {
            const points = dataset.values.map((v, idx) => {
              const p = getPoint(idx, v);
              return `${p.x},${p.y}`;
            }).join(' ');

            return (
              <g key={`ds-${dsIdx}`}>
                <polygon
                  points={points}
                  fill={dataset.color}
                  fillOpacity="0.15"
                  stroke={dataset.color}
                  strokeWidth="2"
                />
                {dataset.values.map((v, idx) => {
                  const p = getPoint(idx, v);
                  return (
                    <circle
                      key={`pt-${dsIdx}-${idx}`}
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill={dataset.color}
                    />
                  );
                })}
              </g>
            );
          })}

          {radarData.labels.map((label, idx) => {
            const p = getLabelPoint(idx);
            return (
              <text
                key={`label-${idx}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#4E5969"
                fontSize="12"
              >
                {label}
              </text>
            );
          })}
        </svg>

        <View className={styles.radarLegend}>
          {radarData.datasets.map((ds, idx) => (
            <View key={idx} className={styles.legendItem}>
              <View className={styles.legendDot} style={{ background: ds.color }}></View>
              <Text className={styles.legendText}>{ds.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>对比分析</Text>
        <Text className={styles.subtitle}>候选人对比 · 偏差校准 · 模板管理</Text>
      </View>

      <View className={styles.tabBar}>
        <View
          className={`${styles.tab} ${activeTab === 'compare' ? styles.active : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          <Text>📊 多人对比</Text>
        </View>
        <View
          className={`${styles.tab} ${activeTab === 'calibration' ? styles.active : ''}`}
          onClick={() => setActiveTab('calibration')}
        >
          <Text>🎯 偏差提醒</Text>
        </View>
        <View
          className={`${styles.tab} ${activeTab === 'templates' ? styles.active : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <Text>📋 模板库</Text>
        </View>
      </View>

      {activeTab === 'compare' && (
        <>
          <View className={styles.compareHeader}>
            <View className={styles.compareTitleRow}>
              <Text className={styles.compareTitle}>对比分析</Text>
              <Text className={styles.compareCount}>
                已选 {compareCandidateIds.length}/{maxCompareCount} 人
              </Text>
              <View className={styles.headerActions}>
                <Text className={styles.actionBtn} onClick={() => setShowEditor(true)}>
                  编辑
                </Text>
                {compareCandidateIds.length > 0 && (
                  <Text className={styles.actionBtn} onClick={clearCompareCandidates}>
                    清空
                  </Text>
                )}
              </View>
            </View>
          </View>

          {renderRadar()}

          <View className={styles.compareTable}>
            <View className={styles.tableHeader}>
              <Text className={styles.tableCell}>维度</Text>
              {compareList.map(item => (
                <Text key={item.candidate.id} className={styles.tableCell}>
                  {item.candidate.name}
                </Text>
              ))}
            </View>
            {compareList.length > 0 && compareList[0].latestRecord?.scores.map((score, scoreIdx) => {
              const template = templates.find(t => t.id === compareList[0].latestRecord!.templateId);
              const comp = template?.competencies[scoreIdx];
              return (
                <View key={scoreIdx} className={styles.tableRow}>
                  <Text className={styles.tableCell}>{comp?.name || `维度${scoreIdx + 1}`}</Text>
                  {compareList.map(item => (
                    <Text
                      key={item.candidate.id}
                      className={styles.tableCell}
                      style={{
                        color: item.latestRecord?.scores[scoreIdx]
                          ? item.latestRecord.scores[scoreIdx].score >= 7 ? '#00B42A' : item.latestRecord.scores[scoreIdx].score <= 4 ? '#F53F3F' : '#1D2129'
                          : '#86909C',
                        fontWeight: 600
                      }}
                    >
                      {item.latestRecord?.scores[scoreIdx]?.score || '-'}
                    </Text>
                  ))}
                </View>
              );
            })}
            <View className={styles.tableRow}>
              <Text className={styles.tableCell} style={{ fontWeight: 600 }}>总分</Text>
              {compareList.map(item => (
                <Text
                  key={item.candidate.id}
                  className={styles.tableCell}
                  style={{ fontWeight: 700, color: '#1E5EFF' }}
                >
                  {item.latestRecord?.overallScore || '-'}
                </Text>
              ))}
            </View>
            <View className={styles.tableRow}>
              <Text className={styles.tableCell} style={{ fontWeight: 600 }}>建议</Text>
              {compareList.map(item => (
                <Text
                  key={item.candidate.id}
                  className={styles.tableCell}
                >
                  {item.latestRecord?.recommendation
                    ? getRecommendationText(item.latestRecord.recommendation).split(' ')[1]
                    : '-'}
                </Text>
              ))}
            </View>
          </View>

          <View className={styles.compareCards}>
            {compareList.map(item => (
              <View key={item.candidate.id} className={styles.compareCard}>
                <View className={styles.compareCardHeader}>
                  <Text className={styles.compareCardName}>{item.candidate.name}</Text>
                  <View
                    className={styles.recBadge}
                    style={{ background: item.latestRecord ? getRecommendationBgColor(item.latestRecord.recommendation) : '#F2F3F5' }}
                  >
                    <Text>{item.latestRecord ? getRecommendationText(item.latestRecord.recommendation) : '未面试'}</Text>
                  </View>
                </View>
                <View className={styles.compareCardMeta}>
                  <Text>{item.candidate.position}</Text>
                  <Text>·</Text>
                  <Text>{item.candidate.experience}年</Text>
                  <Text>·</Text>
                  <Text>{item.candidate.education}</Text>
                </View>
                {item.latestRecord && (
                  <View className={styles.compareCardScore}>
                    <Text className={styles.scoreNum}>{item.latestRecord.overallScore}</Text>
                    <Text className={styles.scoreLabel}>分</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      {activeTab === 'calibration' && (
        <View className={styles.calibrationSection}>
          <View className={styles.sectionTitle}>
            <Text>🎯 常见偏差提醒</Text>
          </View>
          {alerts.map(alert => (
            <View key={alert.id} className={styles.alertCard}>
              <View className={styles.alertHeader}>
                <View className={styles.alertTitle}>
                  <View
                    className={styles.severityDot}
                    style={{ background: getSeverityColor(alert.severity) }}
                  ></View>
                  <Text className={styles.alertTitleText}>{alert.title}</Text>
                </View>
                <View
                  className={styles.severityBadge}
                  style={{
                    background: alert.severity === 'high' ? '#FFECE8' : alert.severity === 'medium' ? '#FFF7E8' : '#E8F3FF',
                    color: getSeverityColor(alert.severity)
                  }}
                >
                  <Text>{alert.severity === 'high' ? '高风险' : alert.severity === 'medium' ? '中风险' : '低风险'}</Text>
                </View>
              </View>
              <Text className={styles.alertDesc}>{alert.description}</Text>
              <View className={styles.alertTip}>
                <Text className={styles.tipIcon}>💡</Text>
                <Text className={styles.tipText}>{alert.calibrationTip}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'templates' && (
        <View className={styles.templatesSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📋 模板库</Text>
            <Text className={styles.addBtn} onClick={handleCreateTemplate}>+ 创建</Text>
          </View>

          {templates.map(template => (
            <View key={template.id} className={styles.templateCard}>
              <View className={styles.templateCardHeader}>
                <View>
                  <Text className={styles.templateName}>{template.name}</Text>
                  {currentTemplateId === template.id && (
                    <View className={styles.inUseBadge}>
                      <Text>使用中</Text>
                    </View>
                  )}
                </View>
                <View className={styles.templateActions}>
                  <Text className={styles.actionLink} onClick={() => handleEditTemplate(template.id)}>编辑</Text>
                  <Text className={styles.actionLink} onClick={() => handleDuplicateTemplate(template.id)}>复制</Text>
                  <Text className={styles.actionLinkDanger} onClick={() => handleDeleteTemplate(template.id)}>删除</Text>
                </View>
              </View>
              <Text className={styles.templateDesc}>{template.position} · {template.department}</Text>
              <Text className={styles.templateDesc2}>{template.description}</Text>
              <View className={styles.templateStats}>
                <Text>📊 {template.competencies.length} 维度</Text>
                <Text>❓ {template.requiredQuestions.length + template.followupQuestions.length} 题</Text>
                <Text>📋 使用 {template.usageCount} 次</Text>
              </View>
              {currentTemplateId !== template.id && (
                <button className={styles.useTemplateBtn} onClick={() => handleUseTemplate(template.id)}>
                  使用此模板
                </button>
              )}
            </View>
          ))}
        </View>
      )}

      {showEditor && (
        <View className={styles.modalOverlay} onClick={() => setShowEditor(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择候选人</Text>
              <Text className={styles.modalSubtitle}>
                已选 {compareCandidateIds.length}/{maxCompareCount} 人
              </Text>
              <Text className={styles.closeBtn} onClick={() => setShowEditor(false)}>×</Text>
            </View>
            <ScrollView className={styles.modalBody} scrollY>
              {candidates.map(c => {
                const isSelected = compareCandidateIds.includes(c.id);
                return (
                  <View
                    key={c.id}
                    className={`${styles.candidateSelectCard} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleToggleCandidate(c.id)}
                  >
                    <View className={styles.candidateAvatar}>{c.name.charAt(0)}</View>
                    <View className={styles.candidateInfo}>
                      <Text className={styles.candidateName}>{c.name}</Text>
                      <Text className={styles.candidatePosition}>
                        {c.position} · {c.experience}年 · {c.education}
                      </Text>
                    </View>
                    <View className={styles.checkBox}>
                      {isSelected && <Text>✓</Text>}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <View className={styles.modalFooter}>
              <button className={styles.confirmBtn} onClick={() => setShowEditor(false)}>
                确定
              </button>
            </View>
          </View>
        </View>
      )}

      {showTemplateEditor && <TemplateEditorContent />}
    </ScrollView>
  );
}
