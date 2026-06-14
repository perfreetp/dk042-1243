import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import CandidateCard from '@/components/CandidateCard';
import { useInterviewStore } from '@/store/interview';
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
  const { candidates, addCandidate, batchAddCandidates } = useInterviewStore();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchText, setBatchText] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    experience: '',
    education: '',
    phone: '',
    email: '',
    tags: ''
  });

  const stats = useMemo(() => ({
    total: candidates.length,
    today: candidates.filter(c => c.appliedAt === new Date().toISOString().slice(0, 10)).length || 2,
    interviewing: candidates.filter(c => c.status === 'interviewing').length,
    passed: candidates.filter(c => c.status === 'passed').length
  }), [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchStatus = activeFilter === 'all' || c.status === activeFilter;
      const matchSearch = !searchText ||
        c.name.includes(searchText) ||
        c.position.includes(searchText) ||
        c.tags.some(t => t.includes(searchText));
      return matchStatus && matchSearch;
    });
  }, [searchText, activeFilter, candidates]);

  const handleImport = () => {
    Taro.showActionSheet({
      itemList: ['手动添加候选人', '批量导入（粘贴）', '从招聘系统同步'],
      success: (res) => {
        if (res.tapIndex === 0) {
          setShowAddModal(true);
        } else if (res.tapIndex === 1) {
          setShowBatchModal(true);
        } else if (res.tapIndex === 2) {
          Taro.showModal({
            title: '招聘系统同步',
            content: '请输入招聘系统同步密钥以开启同步功能',
            editable: true,
            placeholderText: '请输入密钥',
            confirmText: '同步',
            success: (r) => {
              if (r.confirm) {
                Taro.showLoading({ title: '同步中...' });
                setTimeout(() => {
                  Taro.hideLoading();
                  Taro.showToast({ title: '暂未配置同步密钥', icon: 'none' });
                }, 1500);
              }
            }
          });
        }
      }
    });
  };

  const handleAddSubmit = () => {
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!formData.position.trim()) {
      Taro.showToast({ title: '请输入岗位', icon: 'none' });
      return;
    }

    const tags = formData.tags
      .split(/[,，\s]+/)
      .map(t => t.trim())
      .filter(Boolean);

    addCandidate({
      name: formData.name.trim(),
      avatar: `https://picsum.photos/seed/${Date.now()}/200/200`,
      position: formData.position.trim(),
      department: formData.department.trim() || '技术部',
      experience: parseInt(formData.experience) || 1,
      education: formData.education.trim() || '本科',
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      tags
    });

    Taro.showToast({ title: '添加成功', icon: 'success' });
    setShowAddModal(false);
    setFormData({
      name: '', position: '', department: '',
      experience: '', education: '', phone: '', email: '', tags: ''
    });
  };

  const handleBatchImport = () => {
    if (!batchText.trim()) {
      Taro.showToast({ title: '请输入候选人数据', icon: 'none' });
      return;
    }

    try {
      const lines = batchText.trim().split('\n').filter(l => l.trim());
      const parsed = lines.map(line => {
        const parts = line.split(/[,，\t]/).map(p => p.trim());
        const [name, position, department, experience, education, tagsStr] = parts;
        const tags = tagsStr ? tagsStr.split(/[、\/|]/).map(t => t.trim()).filter(Boolean) : [];
        return {
          name: name || '未命名',
          avatar: `https://picsum.photos/seed/${Math.random()}/200/200`,
          position: position || '未分配',
          department: department || '技术部',
          experience: parseInt(experience) || 1,
          education: education || '本科',
          phone: '',
          email: '',
          tags
        };
      });

      if (parsed.length === 0) {
        Taro.showToast({ title: '没有解析到有效数据', icon: 'none' });
        return;
      }

      batchAddCandidates(parsed);
      Taro.showToast({ title: `成功导入 ${parsed.length} 人`, icon: 'success' });
      setShowBatchModal(false);
      setBatchText('');
    } catch {
      Taro.showToast({ title: '格式解析失败，请检查', icon: 'none' });
    }
  };

  const handlePullDownRefresh = () => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 500);
  };

  return (
    <View className={styles.pageContainer} onPullDownRefresh={handlePullDownRefresh}>
      <View style={{ padding: `0 ${32}rpx`, paddingTop: 32 }}>
        <Text className="pageTitle">候选人管理</Text>
        <Text className="pageSubtitle">共 {candidates.length} 位候选人，今日新增 {stats.today} 位</Text>

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
            <Button className={styles.emptyBtn} onClick={handleImport}>
              去添加
            </Button>
          </View>
        )}
      </View>

      {showAddModal && (
        <View className={styles.modalMask} onClick={() => setShowAddModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>手动添加候选人</Text>
              <Text className={styles.modalClose} onClick={() => setShowAddModal(false)}>×</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>姓名 <Text style={{ color: '#F53F3F' }}>*</Text></Text>
              <Input
                className={styles.formInput}
                placeholder="请输入候选人姓名"
                value={formData.name}
                onInput={(e) => setFormData(p => ({ ...p, name: e.detail.value }))}
              />
            </View>

            <View className={styles.formRow}>
              <View className={styles.formGroup} style={{ flex: 1, marginRight: 16 }}>
                <Text className={styles.formLabel}>岗位 <Text style={{ color: '#F53F3F' }}>*</Text></Text>
                <Input
                  className={styles.formInput}
                  placeholder="如：高级前端工程师"
                  value={formData.position}
                  onInput={(e) => setFormData(p => ({ ...p, position: e.detail.value }))}
                />
              </View>
              <View className={styles.formGroup} style={{ flex: 1 }}>
                <Text className={styles.formLabel}>部门</Text>
                <Input
                  className={styles.formInput}
                  placeholder="如：技术部"
                  value={formData.department}
                  onInput={(e) => setFormData(p => ({ ...p, department: e.detail.value }))}
                />
              </View>
            </View>

            <View className={styles.formRow}>
              <View className={styles.formGroup} style={{ flex: 1, marginRight: 16 }}>
                <Text className={styles.formLabel}>工作年限</Text>
                <Input
                  className={styles.formInput}
                  type="number"
                  placeholder="年"
                  value={formData.experience}
                  onInput={(e) => setFormData(p => ({ ...p, experience: e.detail.value }))}
                />
              </View>
              <View className={styles.formGroup} style={{ flex: 1 }}>
                <Text className={styles.formLabel}>学历</Text>
                <Input
                  className={styles.formInput}
                  placeholder="如：本科"
                  value={formData.education}
                  onInput={(e) => setFormData(p => ({ ...p, education: e.detail.value }))}
                />
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>手机号</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="请输入手机号"
                value={formData.phone}
                onInput={(e) => setFormData(p => ({ ...p, phone: e.detail.value }))}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>邮箱</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入邮箱"
                value={formData.email}
                onInput={(e) => setFormData(p => ({ ...p, email: e.detail.value }))}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>技能标签</Text>
              <Input
                className={styles.formInput}
                placeholder="多个标签用逗号分隔，如：React,Node.js"
                value={formData.tags}
                onInput={(e) => setFormData(p => ({ ...p, tags: e.detail.value }))}
              />
            </View>

            <View className={styles.modalFooter}>
              <Button className={classnames(styles.modalBtn, styles.cancelBtn)} onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button className={classnames(styles.modalBtn, styles.confirmBtn)} onClick={handleAddSubmit}>
                确认添加
              </Button>
            </View>
          </View>
        </View>
      )}

      {showBatchModal && (
        <View className={styles.modalMask} onClick={() => setShowBatchModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>批量导入候选人</Text>
              <Text className={styles.modalClose} onClick={() => setShowBatchModal(false)}>×</Text>
            </View>

            <Text className={styles.batchTip}>
              格式：每行一个候选人，字段用逗号分隔，顺序为：
              <Text style={{ color: '#1E5EFF' }}>姓名,岗位,部门,工作年限,学历,技能标签</Text>
              {'\n'}示例：张三,高级前端工程师,技术部,5,本科,React,Vue
            </Text>

            <Textarea
              className={styles.batchTextarea}
              placeholder={'张三,高级前端工程师,技术部,5,本科,React,Vue\n李四,产品经理,产品部,3,硕士,用户研究,数据分析'}
              value={batchText}
              onInput={(e) => setBatchText(e.detail.value)}
              maxlength={2000}
              autoHeight
            />

            <View className={styles.modalFooter}>
              <Button className={classnames(styles.modalBtn, styles.cancelBtn)} onClick={() => setShowBatchModal(false)}>
                取消
              </Button>
              <Button className={classnames(styles.modalBtn, styles.confirmBtn)} onClick={handleBatchImport}>
                开始导入
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default CandidatesPage;
