import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import CandidateCard from '@/components/CandidateCard';
import { mockCandidates } from '@/data/candidates';
import { Candidate } from '@/types';
import classnames from 'classnames';

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待面试' },
  { key: 'interviewing', label: '面试中' },
  { key: 'scoring', label: '评分中' },
  { key: 'completed', label: '已完成' },
  { key: 'passed', label: '已通过' },
  { key: 'rejected', label: '已拒绝' }
];

const CandidatesPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const stats = useMemo(() => ({
    total: mockCandidates.length,
    today: 2,
    interviewing: mockCandidates.filter(c => c.status === 'interviewing').length,
    passed: mockCandidates.filter(c => c.status === 'passed').length
  }), []);

  const filteredCandidates = useMemo(() => {
    return mockCandidates.filter(c => {
      const matchStatus = activeFilter === 'all' || c.status === activeFilter;
      const matchSearch = !searchText ||
        c.name.includes(searchText) ||
        c.position.includes(searchText) ||
        c.tags.some(t => t.includes(searchText));
      return matchStatus && matchSearch;
    });
  }, [searchText, activeFilter]);

  const handleImport = () => {
    Taro.showActionSheet({
      itemList: ['批量导入Excel', '手动添加候选人', '从招聘系统同步'],
      success: (res) => {
        Taro.showToast({
          title: ['导入功能开发中', '添加功能开发中', '同步功能开发中'][res.tapIndex],
          icon: 'none'
        });
      }
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
        <Text className="pageTitle">候选人管理</Text>
        <Text className="pageSubtitle">共 {mockCandidates.length} 位候选人，今日新增 {stats.today} 位</Text>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>候选人总数</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue} style={{ color: '#1E5EFF' }}>{stats.interviewing}</Text>
            <Text className={styles.statLabel}>面试进行中</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue} style={{ color: '#00B42A' }}>{stats.passed}</Text>
            <Text className={styles.statLabel}>已通过录用</Text>
          </View>
        </View>

        <View className={styles.toolbar}>
          <View className={styles.searchBox}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Input
              className={styles.searchInput}
              placeholder="搜索姓名、岗位、技能标签"
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
            />
          </View>
          <Button className={styles.importBtn} onClick={handleImport}>
            导入
          </Button>
        </View>

        <View className={styles.filterTabs}>
          {statusFilters.map(f => (
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
          <Text className={styles.sectionTitle}>候选人列表</Text>
          <Text className={styles.sectionCount}>{filteredCandidates.length} 人</Text>
        </View>
      </View>

      <View style={{ padding: `0 ${32}rpx` }}>
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map(candidate => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无符合条件的候选人</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CandidatesPage;
