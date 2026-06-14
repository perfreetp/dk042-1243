import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordItem from '@/components/RecordItem';
import { useInterviewStore } from '@/store/interview';
import { mockDeviationAlerts } from '@/data/interviews';
import classnames from 'classnames';

const recFilters = [
  { key: 'all', label: '全部' },
  { key: 'strong-hire', label: '强烈推荐' },
  { key: 'hire', label: '推荐录用' },
  { key: 'borderline', label: '待定复核' },
  { key: 'no-hire', label: '不予录用' }
];

const RecordsPage: React.FC = () => {
  const { interviewRecords } = useInterviewStore();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showDeviation, setShowDeviation] = useState(false);

  const stats = useMemo(() => {
    const total = interviewRecords.length;
    const strongHire = interviewRecords.filter(r => r.recommendation === 'strong-hire').length;
    const hire = interviewRecords.filter(r => r.recommendation === 'hire').length;
    const borderline = interviewRecords.filter(r => r.recommendation === 'borderline').length;
    const noHire = interviewRecords.filter(r => r.recommendation === 'no-hire').length;
    const pendingReview = interviewRecords.filter(r => r.reviewItems && r.reviewItems.length > 0).length;
    const passRate = total > 0 ? Math.round(((strongHire + hire) / total) * 100) : 0;

    return { total, strongHire, hire, borderline, noHire, pendingReview, passRate };
  }, [interviewRecords]);

  const filteredRecords = useMemo(() => {
    let list = [...interviewRecords];

    if (activeFilter !== 'all') {
      list = list.filter(r => r.recommendation === activeFilter);
    }

    if (searchText) {
      list = list.filter(r =>
        r.candidateName.includes(searchText) ||
        r.position.includes(searchText) ||
        r.interviewerName?.includes(searchText)
      );
    }

    const withReview = list.filter(r => r.reviewItems && r.reviewItems.length > 0);
    const withoutReview = list.filter(r => !r.reviewItems || r.reviewItems.length === 0);
    return [...withReview, ...withoutReview];
  }, [interviewRecords, searchText, activeFilter]);

  const handleExport = () => {
    Taro.showActionSheet({
      itemList: ['导出 Excel', '导出 PDF', '导出面试纪要'],
      success: (res) => {
        Taro.showLoading({ title: '导出中...' });
        setTimeout(() => {
          Taro.hideLoading();
          Taro.showToast({ title: '已生成下载链接', icon: 'success' });
        }, 1200);
      }
    });
  };

  return (
    <View className={styles.pageContainer}>
      <View style={{ padding: `0 ${32}rpx`, paddingTop: 32 }}>
        <Text className="pageTitle">面试记录</Text>
        <Text className="pageSubtitle">共 {stats.total} 份面试纪要，通过率 {stats.passRate}%</Text>

        <View className={styles.alertEntry} onClick={() => setShowDeviation(true)}>
          <View className={styles.alertLeft}>
            <Text className={styles.alertIcon}>⚠️</Text>
            <View className={styles.alertInfo}>
              <Text className={styles.alertTitle}>面试官偏差提醒</Text>
              <Text className={styles.alertDesc}>
                检测到 {mockDeviationAlerts.length} 个校准点，建议查看
              </Text>
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
              placeholder="搜索候选人、岗位、面试官"
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
            />
          </View>
          <Button className={styles.exportBtn} onClick={handleExport}>
            导出
          </Button>
        </View>

        <View className={styles.filterTabs}>
          {recFilters.map(f => (
            <View
              key={f.key}
              className={classnames(styles.filterTab, activeFilter === f.key && styles.active)}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </View>
          ))}
        </View>

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>面试纪要列表</Text>
          <Text className={styles.sectionCount}>{filteredRecords.length} 份</Text>
        </View>
      </View>

      <View style={{ padding: `0 ${32}rpx` }}>
        {filteredRecords.length > 0 ? (
          filteredRecords.map(record => (
            <RecordItem key={record.id} record={record} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📝</Text>
            <Text className={styles.emptyText}>暂无面试记录</Text>
            <Text className={styles.emptyDesc}>完成面试并提交评分后，记录将显示在这里</Text>
          </View>
        )}
      </View>

      {showDeviation && (
        <View className={styles.modalMask} onClick={() => setShowDeviation(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>面试官偏差提醒</Text>
              <Text className={styles.modalClose} onClick={() => setShowDeviation(false)}>×</Text>
            </View>

            <View style={{ padding: '0 32rpx 32rpx' }}>
              {mockDeviationAlerts.map((alert, i) => (
                <View key={i} className={styles.deviationItem}>
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
          </View>
        </View>
      )}
    </View>
  );
};

export default RecordsPage;
