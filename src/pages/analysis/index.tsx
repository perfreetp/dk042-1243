import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RadarChart from '@/components/RadarChart';
import CandidateCard from '@/components/CandidateCard';
import { useInterviewStore } from '@/store/interview';
import { mockCompetencies, mockTemplates } from '@/data/templates';
import { mockDeviationAlerts } from '@/data/interviews';
import classnames from 'classnames';

const tabs = [
  { key: 'compare', label: '多人对比' },
  { key: 'deviation', label: '偏差提醒' },
  { key: 'templates', label: '模板库' }
];

const AnalysisPage: React.FC = () => {
  const {
    candidates,
    interviewRecords,
    selectedCompareIds,
    toggleCompareCandidate,
    setSelectedCompareIds,
    templates,
    addTemplate,
    setCurrentTemplateId
  } = useInterviewStore();

  const [activeTab, setActiveTab] = useState('compare');
  const [showSelector, setShowSelector] = useState(false);
  const [showCreateTpl, setShowCreateTpl] = useState(false);

  const [tplForm, setTplForm] = useState({
    name: '',
    position: '',
    department: '',
    description: ''
  });

  const selectedCandidates = useMemo(() => {
    return candidates.filter(c => selectedCompareIds.includes(c.id)).slice(0, 5);
  }, [candidates, selectedCompareIds]);

  const compareData = useMemo(() => {
    return selectedCandidates.map(candidate => {
      const record = interviewRecords.find(r => r.candidateId === candidate.id);
      return {
        candidate,
        record,
        scores: record?.scores || mockCompetencies.map(comp => ({
          competencyId: comp.id,
          score: 7,
          maxScore: 10,
          reason: ''
        }))
      };
    });
  }, [selectedCandidates, interviewRecords]);

  const handleUseTemplate = (templateId: string) => {
    setCurrentTemplateId(templateId);
    Taro.showToast({ title: '模板已设置', icon: 'success' });
  };

  const handleCopyTemplate = (template: any) => {
    addTemplate({
      name: template.name + ' (副本)',
      position: template.position,
      department: template.department,
      description: template.description,
      competencies: template.competencies,
      requiredQuestions: template.requiredQuestions,
      followupQuestions: template.followupQuestions,
      scoringDimensions: template.scoringDimensions
    });
    Taro.showToast({ title: '模板已复制', icon: 'success' });
  };

  const handleCreateTemplate = () => {
    if (!tplForm.name.trim()) {
      Taro.showToast({ title: '请输入模板名称', icon: 'none' });
      return;
    }
    if (!tplForm.position.trim()) {
      Taro.showToast({ title: '请输入适用岗位', icon: 'none' });
      return;
    }

    addTemplate({
      name: tplForm.name.trim(),
      position: tplForm.position.trim(),
      department: tplForm.department.trim() || '通用',
      description: tplForm.description.trim(),
      competencies: mockCompetencies,
      requiredQuestions: mockTemplates[0]?.requiredQuestions || [],
      followupQuestions: mockTemplates[0]?.followupQuestions || [],
      scoringDimensions: mockTemplates[0]?.scoringDimensions || []
    });

    Taro.showToast({ title: '模板创建成功', icon: 'success' });
    setShowCreateTpl(false);
    setTplForm({ name: '', position: '', department: '', description: '' });
  };

  return (
    <View className={styles.pageContainer}>
      <View style={{ padding: `0 ${32}rpx`, paddingTop: 32 }}>
        <Text className="pageTitle">对比分析</Text>
        <Text className="pageSubtitle">多人对比、偏差校准、模板管理</Text>

        <View className={styles.tabBar}>
          {tabs.map(tab => (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </View>
          ))}
        </View>
      </View>

      {activeTab === 'compare' && (
        <View style={{ padding: `0 ${32}rpx` }}>
          <View className={styles.compareHeader}>
            <View className={styles.compareInfo}>
              <Text className={styles.compareCount}>
                已选择 <Text style={{ color: '#1E5EFF', fontWeight: 600 }}>{selectedCompareIds.length}</Text>/5 人
              </Text>
              <Text className={styles.compareHint}>选择候选人进行横向对比</Text>
            </View>
            <Button
              className={styles.editBtn}
              onClick={() => setShowSelector(true)}
            >
              编辑
            </Button>
          </View>

          {compareData.length > 0 ? (
            <>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>能力雷达对比</Text>
              </View>
              <View className={styles.radarWrapper}>
                <RadarChart
                  scores={compareData[0]?.scores || []}
                  compareScores={compareData.length > 1 ? compareData[1]?.scores : undefined}
                  candidates={compareData.map(d => d.candidate)}
                />
              </View>
              <View className={styles.legend}>
                {compareData.slice(0, 2).map((d, i) => (
                  <View key={d.candidate.id} className={styles.legendItem}>
                    <View
                      className={styles.legendDot}
                      style={{ backgroundColor: i === 0 ? '#1E5EFF' : '#00B8D9' }}
                    />
                    <Text className={styles.legendText}>{d.candidate.name}</Text>
                  </View>
                ))}
              </View>

              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>维度评分对比</Text>
              </View>
              <ScrollView className={styles.compareTable} scrollX>
                <View className={styles.tableInner}>
                  <View className={styles.tableHeader}>
                    <View className={styles.tableCellHeader}>
                      <Text>维度</Text>
                    </View>
                    {compareData.map(d => (
                      <View key={d.candidate.id} className={styles.tableCellHeader}>
                        <Image
                          className={styles.tableAvatar}
                          src={d.candidate.avatar}
                          mode="aspectFill"
                        />
                        <Text className={styles.tableName}>{d.candidate.name}</Text>
                      </View>
                    ))}
                  </View>
                  {mockCompetencies.map(comp => (
                    <View key={comp.id} className={styles.tableRow}>
                      <View className={styles.tableCell}>
                        <Text className={styles.dimName}>{comp.name}</Text>
                      </View>
                      {compareData.map(d => {
                        const score = d.scores.find(s => s.competencyId === comp.id)?.score || 0;
                        return (
                          <View key={d.candidate.id} className={styles.tableCell}>
                            <Text
                              className={styles.scoreText}
                              style={{
                                color: score >= 8 ? '#00B42A' :
                                  score >= 6 ? '#1E5EFF' :
                                    score >= 4 ? '#FF7D00' : '#F53F3F'
                              }}
                            >
                              {score}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                  <View className={styles.tableRow}>
                    <View className={styles.tableCell}>
                      <Text className={styles.dimName}>综合</Text>
                    </View>
                    {compareData.map(d => (
                      <View key={d.candidate.id} className={styles.tableCell}>
                        <Text
                          className={styles.scoreText}
                          style={{ color: '#1E5EFF', fontWeight: 600 }}
                        >
                          {d.record?.overallScore || 70}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>基本信息对比</Text>
              </View>
              {compareData.map(d => (
                <View key={d.candidate.id} className={styles.infoCard}>
                  <Image
                    className={styles.infoAvatar}
                    src={d.candidate.avatar}
                    mode="aspectFill"
                  />
                  <View className={styles.infoContent}>
                    <Text className={styles.infoName}>{d.candidate.name}</Text>
                    <Text className={styles.infoPosition}>{d.candidate.position}</Text>
                    <Text className={styles.infoMeta}>
                      {d.candidate.experience}年 · {d.candidate.education} · {d.candidate.department}
                    </Text>
                    {d.record && (
                      <View className={styles.infoScore}>
                        <Text className={styles.infoScoreValue}>{d.record.overallScore}分</Text>
                        <Text className={styles.infoRec}>
                          {d.record.recommendation === 'strong-hire' ? '强烈推荐' :
                            d.record.recommendation === 'hire' ? '推荐录用' :
                              d.record.recommendation === 'borderline' ? '待定复核' : '不予录用'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>👥</Text>
              <Text className={styles.emptyText}>请选择候选人进行对比</Text>
              <Text className={styles.emptyDesc}>最多可选择5位候选人进行横向对比</Text>
              <Button className={styles.emptyBtn} onClick={() => setShowSelector(true)}>
                选择候选人
              </Button>
            </View>
          )}
        </View>
      )}

      {activeTab === 'deviation' && (
        <View style={{ padding: `0 ${32}rpx` }}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>常见偏差提醒</Text>
            <Text className={styles.sectionCount}>{mockDeviationAlerts.length}项</Text>
          </View>
          {mockDeviationAlerts.map((alert, i) => (
            <View key={i} className={styles.deviationCard}>
              <View className={styles.deviationHeader}>
                <View
                  className={styles.severityBadge}
                  style={{
                    backgroundColor: alert.severity === 'high' ? '#FFECE8' :
                      alert.severity === 'medium' ? '#FFF7E6' : '#E8F3FF',
                    color: alert.severity === 'high' ? '#F53F3F' :
                      alert.severity === 'medium' ? '#FF7D00' : '#1E5EFF'
                  }}
                >
                  {alert.severity === 'high' ? '严重' : alert.severity === 'medium' ? '中等' : '轻微'}
                </View>
                <Text className={styles.deviationTitle}>{alert.title}</Text>
              </View>
              <Text className={styles.deviationDesc}>{alert.description}</Text>
              <View className={styles.deviationSuggestion}>
                <Text className={styles.suggestionLabel}>校准建议：</Text>
                <Text className={styles.suggestionText}>{alert.calibrationTip}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'templates' && (
        <View style={{ padding: `0 ${32}rpx` }}>
          <View className={styles.templateHeader}>
            <View className={styles.templateInfo}>
              <Text className={styles.templateCount}>共 {templates.length} 个模板</Text>
            </View>
            <Button className={styles.createBtn} onClick={() => setShowCreateTpl(true)}>
              + 创建
            </Button>
          </View>

          {templates.map(tpl => (
            <View key={tpl.id} className={styles.templateCard}>
              <View className={styles.templateTop}>
                <View className={styles.templateMain}>
                  <Text className={styles.templateName}>{tpl.name}</Text>
                  {tpl.isDefault && (
                    <View className={styles.defaultBadge}>默认</View>
                  )}
                </View>
                <Text className={styles.templatePosition}>{tpl.position}</Text>
              </View>
              <Text className={styles.templateDesc}>{tpl.description}</Text>
              <View className={styles.templateMeta}>
                <Text className={styles.metaItem}>
                  {tpl.competencies?.length || 0} 个能力维度
                </Text>
                <Text className={styles.metaItem}>
                  {tpl.requiredQuestions?.length || 0} 道必问题
                </Text>
                <Text className={styles.metaItem}>
                  {tpl.followupQuestions?.length || 0} 道追问题
                </Text>
              </View>
              <View className={styles.templateFooter}>
                <Text className={styles.usageCount}>已使用 {tpl.usageCount || 0} 次</Text>
                <View className={styles.templateActions}>
                  <Button className={styles.actionBtn} onClick={() => handleCopyTemplate(tpl)}>
                    复制
                  </Button>
                  <Button
                    className={classnames(styles.actionBtn, styles.primaryAction)}
                    onClick={() => handleUseTemplate(tpl.id)}
                  >
                    使用
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {showSelector && (
        <View className={styles.modalMask} onClick={() => setShowSelector(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择对比候选人</Text>
              <Text className={styles.modalClose} onClick={() => setShowSelector(false)}>×</Text>
            </View>
            <View className={styles.selectorTip}>
              已选 {selectedCompareIds.length}/5 人，点击卡片选择/取消
            </View>
            <ScrollView className={styles.selectorList} scrollY>
              {candidates.map(c => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  showSelect
                  isSelected={selectedCompareIds.includes(c.id)}
                />
              ))}
            </ScrollView>
            <View className={styles.modalFooter}>
              <Button
                className={classnames(styles.modalBtn, styles.cancelBtn)}
                onClick={() => setShowSelector(false)}
              >
                取消
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.confirmBtn)}
                onClick={() => setShowSelector(false)}
              >
                确定
              </Button>
            </View>
          </View>
        </View>
      )}

      {showCreateTpl && (
        <View className={styles.modalMask} onClick={() => setShowCreateTpl(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>创建面试模板</Text>
              <Text className={styles.modalClose} onClick={() => setShowCreateTpl(false)}>×</Text>
            </View>

            <View style={{ padding: '0 32rpx' }}>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>模板名称 <Text style={{ color: '#F53F3F' }}>*</Text></Text>
                <Input
                  className={styles.formInput}
                  placeholder="如：高级前端标准面试"
                  value={tplForm.name}
                  onInput={(e) => setTplForm(p => ({ ...p, name: e.detail.value }))}
                />
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>适用岗位 <Text style={{ color: '#F53F3F' }}>*</Text></Text>
                <Input
                  className={styles.formInput}
                  placeholder="如：高级前端工程师"
                  value={tplForm.position}
                  onInput={(e) => setTplForm(p => ({ ...p, position: e.detail.value }))}
                />
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>适用部门</Text>
                <Input
                  className={styles.formInput}
                  placeholder="如：技术部"
                  value={tplForm.department}
                  onInput={(e) => setTplForm(p => ({ ...p, department: e.detail.value }))}
                />
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>模板描述</Text>
                <Textarea
                  className={styles.formTextarea}
                  placeholder="简要描述该模板的适用场景、考察重点等"
                  value={tplForm.description}
                  onInput={(e) => setTplForm(p => ({ ...p, description: e.detail.value }))}
                />
              </View>

              <View className={styles.tplConfig}>
                <Text className={styles.configTitle}>能力维度（默认6项）</Text>
                <View className={styles.configList}>
                  {mockCompetencies.map(comp => (
                    <View key={comp.id} className={styles.configItem}>
                      <Text className={styles.configName}>{comp.name}</Text>
                      <Text className={styles.configWeight}>权重 {comp.weight}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View className={styles.modalFooter}>
              <Button
                className={classnames(styles.modalBtn, styles.cancelBtn)}
                onClick={() => setShowCreateTpl(false)}
              >
                取消
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.confirmBtn)}
                onClick={handleCreateTemplate}
              >
                创建模板
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default AnalysisPage;
