import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import RecordItem from '@/components/RecordItem';
import { mockInterviewRecords, mockDeviationAlerts } from '@/data/interviews';
import { InterviewRecord } from '@/types';
import { getRecommendationText, getRecommendationColor } from '@/utils';
import classnames from 'classnames';

const filterOptions = [
  { key: 'all', label: '全部', color: '' },
  { key: 'strong-hire', label: '强烈推荐', color: '#00B42A' },
  { key: 'hire', label: '推荐录用', color: '#00B8D9' },
  { key: 'borderline', label: '待定复核', color: '#FF7D00' },
  { key: 'no-hire', label: '不予录用', color: '#F53F3F' }
];

const RecordsPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const stats = useMemo(() => {
    const total = mockInterviewRecords.length;
    const avg = Math.round(
      mockInterviewRecords.reduce((acc, r) => acc + r.overallScore, 0) / total
    );
    const passRate = Math.round(
      (mockInterviewRecords.filter(r =>
        r.recommendation === 'strong-hire' || r.recommendation === 'hire'
      ).length / total) * 100
    );
    const reviewCount = mockInterviewRecords.reduce(
      (acc, r) => acc + r.reviewItems.length, 0
    );
    return { total, avg, passRate, reviewCount };
  }, []);

  const recordsWithReview = useMemo(() =>
    mockInterviewRecords.filter(r => r.reviewItems.length > 0), []);

  const filteredRecords = useMemo(() => {
    return mockInterviewRecords.filter(r => {
      const matchFilter = activeFilter === 'all' || r.recommendation === activeFilter;
      const matchSearch = !searchText ||
        r.candidateName.includes(searchText) ||
        r.position.includes(searchText) ||
        r.interviewerName.includes(searchText);
      return matchFilter && matchSearch;
    });
  }, [searchText, activeFilter]);

  const handleExport = () => {
    Taro.showActionSheet({
      itemList: ['导出选中记录', '导出全部记录', '导出为Excel', '导出为PDF'],
      success: (res) => {
        Taro.showLoading({ title: '正在导出...' });
        setTimeout(() => {
          Taro.hideLoading();
          Taro.showToast({
            title: '导出成功，已保存到本地',
            icon: 'none',
            duration: 2000
          });
        }, 1500);
      }
    });
  };

  const handleViewDeviation = () => {
    Taro.showModal({
      title: '偏差提醒详情',
      content: `检测到 ${mockDeviationAlerts.length} 项评分偏差：\n\n` +
        mockDeviationAlerts.map((a, i) =>
          `${i + 1}. ${a.dimension}：${a.description}\n建议：${a.suggestion}`
        ).join('\n\n'),
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#1E5EFF'
    });
  };

  const handlePullDownRefresh = () => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 1000);
  };

  return (
    <View className={styles.pageContainer} onPullDownRefresh={handlePullDownRefresh}>
      <View style={{ padding: `0 ${32}rpx`, paddingTop: 32 }}>
        <Text className="pageTitle">面试记录</Text>
        <Text className="pageSubtitle">共 {stats.total} 份面试纪要，平均 {stats.avg} 分</Text>

        <View className={styles.statsCards}>
          <View className={styles.statsItem}>
            <Text className={styles.statsValue} style={{ color: '#1E5EFF' }}>
              {stats.total}
            </Text>
            <Text className={styles.statsLabel}>面试总数</Text>
          </View>
          <View className={styles.statsItem}>
            <Text className={styles.statsValue} style={{ color: '#00B42A' }}>
              {stats.passRate}%
            </Text>
            <Text className={styles.statsLabel}>通过率</Text>
          </View>
          <View className={styles.statsItem}>
            <Text className={styles.statsValue} style={{ color: '#FF7D00' }}>
              {stats.reviewCount}
            </Text>
            <Text className={styles.statsLabel}>待复核项</Text>
          </View>
        </View>

        {mockDeviationAlerts.length > 0 && (
          <View className={styles.deviationAlert} onClick={handleViewDeviation}>
            <View className={styles.alertLeft}>
              <Text className={styles.alertIcon}>⚠️</Text>
              <View className={styles.alertContent}>
                <Text className={styles.alertTitle}>
                  检测到 {mockDeviationAlerts.length} 项评分偏差
                </Text>
                <Text className={styles.alertDesc}>
                  建议在面试官校准会议上讨论对齐
                </Text>
              </View>
            </View>
            <Text className={styles.alertAction}>查看</Text>
          </View>
        )}

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
          {filterOptions.map(opt => (
            <View
              key={opt.key}
              className={classnames(styles.filterTab, activeFilter === opt.key && styles.active)}
              style={activeFilter === opt.key && opt.color ? {
                background: `linear-gradient(135deg, ${opt.color} 0%, ${opt.color}CC 100%)`
              } : {}}
              onClick={() => setActiveFilter(opt.key)}
            >
              {opt.label}
            </View>
          ))}
        </View>

        {recordsWithReview.length > 0 && (
          <View className={styles.reviewSection}>
            <View className={styles.reviewTitle}>
              <Text>需要复核的面试</Text>
              <Text className={styles.count}>{recordsWithReview.length} 份</Text>
            </View>
            {recordsWithReview.map(record => (
              <RecordItem key={`review-${record.id}`} record={record} />
            ))}
          </View>
        )}

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>面试纪要列表</Text>
          <Text className={styles.sectionCount}>{filteredRecords.length} 份</Text>
        </View>

        {filteredRecords.length > 0 ? (
          filteredRecords.map(record => (
            <RecordItem key={record.id} record={record} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无符合条件的面试记录</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default RecordsPage;
