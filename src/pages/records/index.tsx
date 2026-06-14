import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useInterviewStore } from '../../store/interview';
import { getRecommendationText, getRecommendationBgColor, getRecommendationColor, getSeverityColor } from '../../utils';
import type { InterviewRecord } from '../../types';

const recFilters = [
  { key: 'all', label: '全部' },
  { key: 'strong-hire', label: '强烈推荐' },
  { key: 'hire', label: '推荐录用' },
  { key: 'borderline', label: '待定复核' },
  { key: 'no-hire', label: '不予录用' }
];

const RecordsPage: React.FC = () => {
  const { records, getFilteredRecords, getUniqueInterviewers, getUniqueTemplates, getDeviationAlerts } = useInterviewStore();

  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filterInterviewer, setFilterInterviewer] = useState<string>('');
  const [filterTemplate, setFilterTemplate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeviation, setShowDeviation] = useState(false);

  const interviewers = getUniqueInterviewers();
  const templateList = getUniqueTemplates();
  const alerts = getDeviationAlerts();

  const stats = useMemo(() => {
    const total = records.length;
    const strongHire = records.filter(r => r.recommendation === 'strong-hire').length;
    const hire = records.filter(r => r.recommendation === 'hire').length;
    const borderline = records.filter(r => r.recommendation === 'borderline').length;
    const noHire = records.filter(r => r.recommendation === 'no-hire').length;
    const pendingReview = records.filter(r => r.reviewItems && r.reviewItems.length > 0).length;
    const passRate = total > 0 ? Math.round(((strongHire + hire) / total) * 100) : 0;

    return { total, strongHire, hire, borderline, noHire, pendingReview, passRate };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return getFilteredRecords({
      recommendation: activeFilter === 'all' ? undefined : activeFilter,
      interviewer: filterInterviewer || undefined,
      templateId: filterTemplate || undefined,
      keyword: searchText || undefined
    });
  }, [getFilteredRecords, activeFilter, filterInterviewer, filterTemplate, searchText]);

  const handleRecordClick = (record: InterviewRecord) => {
    Taro.navigateTo({ url: `/pages/record-detail/index?id=${record.id}` });
  };

  const handleExport = () => {
    Taro.showActionSheet({
      itemList: ['导出 Excel', '导出 PDF', '导出全部纪要'],
      success: (res) => {
        Taro.showLoading({ title: '导出中...' });
        setTimeout(() => {
          Taro.hideLoading();
          Taro.showToast({ title: '已生成下载链接', icon: 'success' });
        }, 1200);
      }
    });
  };

  const handleResetFilters = () => {
    setFilterInterviewer('');
    setFilterTemplate('');
  };

  const hasActiveFilters = filterInterviewer || filterTemplate;

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>面试记录</Text>
        <Text className={styles.subtitle}>共 {stats.total} 份纪要，通过率 {stats.passRate}%</Text>
      </View>

      <View className={styles.alertEntry} onClick={() => setShowDeviation(true)}>
        <View className={styles.alertLeft}>
          <Text className={styles.alertIcon}>⚠️</Text>
          <View className={styles.alertInfo}>
            <Text className={styles.alertTitle}>面试官偏差提醒</Text>
            <Text className={styles.alertDesc}>检测到 {alerts.length} 个校准点，建议查看</Text>
          </View>
        </View>
        <Text className={styles.alertArrow}>→</Text>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#00B42A' }}>{stats.strongHire}</Text>
          <Text className={styles.statLabel}>强烈推荐</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#00B8D9' }}>{stats.hire}</Text>
          <Text className={styles.statLabel}>推荐录用</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#FF7D00' }}>{stats.borderline}</Text>
          <Text className={styles.statLabel}>待定复核</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue} style={{ color: '#F53F3F' }}>{stats.noHire}</Text>
          <Text className={styles.statLabel}>不予录用</Text>
        </View>
      </View>

      <View className={styles.toolbar}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索候选人、岗位"
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
          />
        </View>
        <View
          className={styles.filterBtn}
          onClick={() => setShowFilters(!showFilters)}
          style={hasActiveFilters ? { borderColor: '#1E5EFF', color: '#1E5EFF' } : {}}
        >
          <Text>筛选{hasActiveFilters ? ` (${[filterInterviewer, filterTemplate].filter(Boolean).length})` : ''}</Text>
        </View>
        <View className={styles.exportBtn} onClick={handleExport}>
          <Text>导出</Text>
        </View>
      </View>

      {showFilters && (
        <View className={styles.filterPanel}>
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>按面试官</Text>
            <ScrollView className={styles.filterChips} scrollX>
              <View
                className={`${styles.filterChip} ${!filterInterviewer ? styles.active : ''}`}
                onClick={() => setFilterInterviewer('')}
              >全部</View>
              {interviewers.map(name => (
                <View
                  key={name}
                  className={`${styles.filterChip} ${filterInterviewer === name ? styles.active : ''}`}
                  onClick={() => setFilterInterviewer(name)}
                >{name}</View>
              ))}
              {interviewers.length === 0 && (
                <Text className={styles.emptyHint}>暂无面试官数据</Text>
              )}
            </ScrollView>
          </View>
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>按模板</Text>
            <ScrollView className={styles.filterChips} scrollX>
              <View
                className={`${styles.filterChip} ${!filterTemplate ? styles.active : ''}`}
                onClick={() => setFilterTemplate('')}
              >全部</View>
              {templateList.map(t => (
                <View
                  key={t.id}
                  className={`${styles.filterChip} ${filterTemplate === t.id ? styles.active : ''}`}
                  onClick={() => setFilterTemplate(t.id)}
                >{t.name}</View>
              ))}
            </ScrollView>
          </View>
          {hasActiveFilters && (
            <View className={styles.resetRow}>
              <Text className={styles.resetBtn} onClick={handleResetFilters}>清除筛选条件</Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.filterTabs}>
        {recFilters.map(f => (
          <View
            key={f.key}
            className={`${styles.filterTab} ${activeFilter === f.key ? styles.active : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.listHeader}>
        <Text className={styles.listTitle}>面试纪要</Text>
        <Text className={styles.listCount}>{filteredRecords.length} 份</Text>
      </View>

      {filteredRecords.length > 0 ? (
        filteredRecords.map(record => (
          <View
            key={record.id}
            className={styles.recordCard}
            onClick={() => handleRecordClick(record)}
          >
            <View className={styles.recordHeader}>
              <View className={styles.recordMain}>
                <View className={styles.avatar}>{record.candidateName.charAt(0)}</View>
                <View className={styles.recordInfo}>
                  <Text className={styles.recordName}>{record.candidateName}</Text>
                  <Text className={styles.recordPosition}>{record.position} · {record.department}</Text>
                </View>
              </View>
              <View
                className={styles.recBadge}
                style={{ background: getRecommendationBgColor(record.recommendation), color: getRecommendationColor(record.recommendation) }}
              >
                <Text>{getRecommendationText(record.recommendation).split(' ')[1]}</Text>
              </View>
            </View>
            <View className={styles.recordMeta}>
              <Text className={styles.metaItem}>📋 {record.templateName}</Text>
              <Text className={styles.metaItem}>👤 {record.interviewerName}</Text>
              <Text className={styles.metaItem}>🔄 第{record.round}/{record.totalRounds}轮</Text>
            </View>
            <View className={styles.recordFooter}>
              <View className={styles.scoreInfo}>
                <Text className={styles.scoreNum}>{record.overallScore}</Text>
                <Text className={styles.scoreLabel}>分</Text>
              </View>
              {record.reviewItems.length > 0 && (
                <View className={styles.reviewBadge}>
                  <Text>⚠️ 有{record.reviewItems.length}项待复核</Text>
                </View>
              )}
              <Text className={styles.recordDate}>
                {new Date(record.date).toLocaleDateString('zh-CN')} · {record.duration}分钟
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📝</Text>
          <Text className={styles.emptyText}>暂无匹配的面试记录</Text>
          <Text className={styles.emptyDesc}>完成面试并提交评分后，记录将显示在这里</Text>
        </View>
      )}

      {showDeviation && (
        <View className={styles.modalMask} onClick={() => setShowDeviation(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>面试官偏差提醒</Text>
              <Text className={styles.modalClose} onClick={() => setShowDeviation(false)}>×</Text>
            </View>
            <ScrollView className={styles.modalBody} scrollY>
              {alerts.map((alert, i) => (
                <View key={i} className={styles.deviationItem}>
                  <View className={styles.deviationHeader}>
                    <View
                      className={styles.severityBadge}
                      style={{
                        background: alert.severity === 'high' ? '#FFECE8' :
                          alert.severity === 'medium' ? '#FFF7E8' : '#E8F3FF',
                        color: getSeverityColor(alert.severity)
                      }}
                    >
                      <Text>{alert.severity === 'high' ? '严重' : alert.severity === 'medium' ? '中等' : '轻微'}</Text>
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
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default RecordsPage;
