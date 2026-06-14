import React, { useState, useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RadarChart from '@/components/RadarChart';
import CandidateCard from '@/components/CandidateCard';
import { mockCandidates } from '@/data/candidates';
import { mockCompareItems, mockDeviationAlerts } from '@/data/interviews';
import { mockTemplates, mockCompetencies } from '@/data/templates';
import { getSeverityColor } from '@/utils';
import classnames from 'classnames';

const tabs = [
  { key: 'compare', label: '多人对比', icon: '📊' },
  { key: 'deviation', label: '偏差提醒', icon: '⚠️' },
  { key: 'templates', label: '模板复用', icon: '📋' }
];

const AnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('compare');
  const [showSelector, setShowSelector] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(['c001', 'c003', 'c009']);

  const selectedCandidates = useMemo(() =>
    mockCandidates.filter(c => selectedIds.includes(c.id)),
    [selectedIds]);

  const compareData = useMemo(() =>
    mockCompareItems.filter(c => selectedIds.includes(c.candidateId)),
    [selectedIds]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 5) {
        Taro.showToast({ title: '最多选择5人对比', icon: 'none' });
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleUseTemplate = (template: any) => {
    Taro.showModal({
      title: '使用模板',
      content: `确定使用「${template.name}」模板进行下一场面试吗？`,
      confirmText: '使用模板',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '模板已加载', icon: 'success' });
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/candidates/index' });
          }, 1500);
        }
      }
    });
  };

  const handleCopyTemplate = (template: any) => {
    Taro.showToast({
      title: `已复制：${template.name}副本`,
      icon: 'none'
    });
  };

  const getDeviationTypeText = (type: string) => {
    const map: Record<string, string> = {
      'over-score': '🔺 评分偏高',
      'under-score': '🔻 评分偏低',
      'inconsistent': '⚖️ 前后不一致',
      'missing-evidence': '📝 缺少证据'
    };
    return map[type] || type;
  };

  return (
    <View className={styles.pageContainer}>
      <View style={{ padding: `0 ${32}rpx`, paddingTop: 32 }}>
        <Text className="pageTitle">对比分析</Text>
        <Text className="pageSubtitle">面试官校准与面试数据分析中心</Text>

        <View className={styles.tabSection}>
          {tabs.map(tab => (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
            </View>
          ))}
        </View>

        {activeTab === 'compare' && (
          <>
            <View className={styles.selectCandidates}>
              <View className={styles.selectHeader}>
                <Text className={styles.selectTitle}>
                  👥 选择对比候选人
                  <Text className={styles.selectHint}>（最多5人）</Text>
                </Text>
                <Text
                  className={styles.selectAction}
                  onClick={() => setShowSelector(!showSelector)}
                >
                  {showSelector ? '收起' : '编辑'}
                </Text>
              </View>

              {selectedCandidates.length > 0 ? (
                <View className={styles.selectedRow}>
                  {selectedCandidates.map(c => (
                    <View key={c.id} className={styles.selectedChip}>
                      <Image
                        className={styles.chipAvatar}
                        src={c.avatar}
                        mode="aspectFill"
                      />
                      <Text className={styles.chipName}>{c.name}</Text>
                      <Text
                        className={styles.chipClose}
                        onClick={() => handleToggleSelect(c.id)}
                      >
                        ×
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className={styles.emptySelected}>
                  <Text>请选择至少2位候选人进行对比分析</Text>
                </View>
              )}
            </View>

            {showSelector && (
              <View style={{ marginBottom: 32 }}>
                {mockCandidates.slice(0, 6).map(c => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    showSelect
                    isSelected={selectedIds.includes(c.id)}
                    onClick={() => handleToggleSelect(c.id)}
                  />
                ))}
              </View>
            )}

            {compareData.length >= 2 && (
              <>
                <View className={styles.compareTable}>
                  <View className={styles.sectionHeader}>
                    <Text className={styles.sectionTitle}>📈 维度对比详情</Text>
                  </View>
                  <View className={styles.tableHeader}>
                    <View className={styles.tableCorner}>评分维度</View>
                    {compareData.map(item => (
                      <View key={item.candidateId} className={styles.tableHeaderCell}>
                        <Image
                          className={styles.headerAvatar}
                          src={mockCandidates.find(c => c.id === item.candidateId)?.avatar}
                          mode="aspectFill"
                        />
                        <Text className={styles.headerName}>{item.candidateName}</Text>
                        <Text className={styles.headerScore}>
                          总分 {item.overallScore} · {item.recommendation}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {mockCompetencies.map(comp => (
                    <View key={comp.id} className={styles.tableRow}>
                      <View className={styles.rowLabel}>{comp.name}</View>
                      {compareData.map(item => {
                        const s = item.scores.find(x => x.competencyId === comp.id);
                        const score = s?.score || 0;
                        const percent = (score / 10) * 100;
                        const color = score >= 8 ? '#00B42A'
                          : score >= 7 ? '#00B8D9'
                            : score >= 6 ? '#1E5EFF'
                              : score >= 5 ? '#FF7D00' : '#F53F3F';
                        return (
                          <View key={item.candidateId} className={styles.rowCell}>
                            <Text className={styles.cellScore} style={{ color }}>
                              {score}
                            </Text>
                            <View className={styles.cellBar}>
                              <View
                                className={styles.cellBarFill}
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: color
                                }}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>

                {compareData.length >= 2 && (
                  <View>
                    <View className={styles.sectionHeader}>
                      <Text className={styles.sectionTitle}>🕸️ 能力雷达对比</Text>
                    </View>
                    <RadarChart
                      scores={compareData[0].scores}
                      compareScores={compareData[1].scores}
                    />
                  </View>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'deviation' && (
          <View className={styles.deviationSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>
                常见偏差提醒
                <Text className={styles.badge}>{mockDeviationAlerts.length}项</Text>
              </Text>
            </View>

            {mockDeviationAlerts.map(alert => (
              <View
                key={alert.id}
                className={styles.deviationCard}
                style={{ borderLeftColor: getSeverityColor(alert.severity) }}
              >
                <View className={styles.deviationHeader}>
                  <View className={styles.deviationType}>
                    <Text>{getDeviationTypeText(alert.type)}</Text>
                  </View>
                  <View
                    className={styles.severityBadge}
                    style={{
                      backgroundColor: `${getSeverityColor(alert.severity)}15`,
                      color: getSeverityColor(alert.severity)
                    }}
                  >
                    {alert.severity === 'high' ? '高风险' :
                      alert.severity === 'medium' ? '中风险' : '低风险'}
                  </View>
                </View>
                <Text className={styles.deviationDimension}>
                  📍 涉及维度：{alert.dimension}
                </Text>
                <Text className={styles.deviationDesc}>
                  {alert.description}
                </Text>
                <View className={styles.deviationSuggest}>
                  <Text className={styles.suggestLabel}>💡 校准建议</Text>
                  <Text className={styles.suggestText}>{alert.suggestion}</Text>
                </View>
              </View>
            ))}

            <View className={styles.templateCard} style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #F0F7FF 100%)',
              marginTop: 16
            }}>
              <View className={styles.templateInfo}>
                <Text className={styles.templateName}>🎓 面试官校准要点</Text>
                <View style={{ marginTop: 16, lineHeight: 2 }}>
                  <Text style={{ fontSize: 24, color: '#4E5969' }}>
                    1. 使用STAR法则验证回答，确保有具体事例支撑{'\n'}
                    2. 先独立打分，再进行集体校准，避免锚定效应{'\n'}
                    3. 对模糊回答必须追问到位，确认候选人真实水平{'\n'}
                    4. 重点关注与岗位核心要求的匹配度
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'templates' && (
          <View className={styles.templatesSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>📋 面试模板库</Text>
            </View>

            {mockTemplates.map(template => (
              <View key={template.id} className={styles.templateCard}>
                <View className={styles.templateHeader}>
                  <View className={styles.templateInfo}>
                    <Text className={styles.templateName}>{template.name}</Text>
                    <View className={styles.templateMeta}>
                      <View className={styles.metaItem}>
                        <Text>💼</Text>
                        <Text>{template.position}</Text>
                      </View>
                      <View className={styles.metaItem}>
                        <Text>🏢</Text>
                        <Text>{template.department}</Text>
                      </View>
                      <View className={styles.metaItem}>
                        <Text>🕐</Text>
                        <Text>更新 {template.updatedAt}</Text>
                      </View>
                    </View>
                  </View>
                  {template.isDefault && (
                    <View className={styles.defaultBadge}>默认</View>
                  )}
                </View>

                <View className={styles.templateStats}>
                  <View className={styles.statBlock}>
                    <Text className={styles.statNum}>{template.competencies.length}</Text>
                    <Text className={styles.statLabel}>能力维度</Text>
                  </View>
                  <View className={styles.statBlock}>
                    <Text className={styles.statNum}>{template.requiredQuestions.length}</Text>
                    <Text className={styles.statLabel}>必问问题</Text>
                  </View>
                  <View className={styles.statBlock}>
                    <Text className={styles.statNum}>{template.followupQuestions.length}</Text>
                    <Text className={styles.statLabel}>追问题库</Text>
                  </View>
                  <View className={styles.statBlock}>
                    <Text className={styles.statNum}>{template.usageCount}</Text>
                    <Text className={styles.statLabel}>使用次数</Text>
                  </View>
                </View>

                <View className={styles.templateActions}>
                  <Button
                    className={classnames(styles.templateBtn, styles.useBtn)}
                    onClick={() => handleUseTemplate(template)}
                  >
                    使用模板
                  </Button>
                  <Button
                    className={classnames(styles.templateBtn, styles.copyBtn)}
                    onClick={() => handleCopyTemplate(template)}
                  >
                    复制模板
                  </Button>
                </View>
              </View>
            ))}

            <View
              className={styles.templateCard}
              style={{
                border: '2rpx dashed #C9CDD4',
                background: 'rgba(255,255,255,0.5)',
                boxShadow: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 160
              }}
              onClick={() => Taro.showToast({ title: '创建模板功能开发中', icon: 'none' })}
            >
              <Text style={{ fontSize: 48, marginBottom: 16 }}>➕</Text>
              <Text style={{ fontSize: 28, color: '#86909C', fontWeight: 500 }}>
                创建自定义面试模板
              </Text>
              <Text style={{ fontSize: 22, color: '#C9CDD4', marginTop: 8 }}>
                可配置能力模型、必问题、追问题和评分维度
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default AnalysisPage;
