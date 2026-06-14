import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useInterviewStore } from '../../store/interview';
import { getRecommendationText, formatDate } from '../../utils';
import styles from './index.module.scss';

export default function RecordDetail() {
  const router = useRouter();
  const recordId = router.params.id as string;
  const { getRecordById, templates, exportRecordAsText } = useInterviewStore();

  const [record, setRecord] = useState(() => getRecordById(recordId));

  useDidShow(() => {
    setRecord(getRecordById(recordId));
  });

  if (!record) {
    return (
      <View className={styles.container}>
        <View className={styles.emptyState}>
          <Text>记录不存在</Text>
        </View>
      </View>
    );
  }

  const template = templates.find(t => t.id === record.templateId);
  const compMap = new Map(template?.competencies.map(c => [c.id, c.name]) || []);

  const handleExport = () => {
    const text = exportRecordAsText(recordId);
    Taro.setClipboardData({
      data: text,
      success: () => {
        Taro.showToast({ title: '纪要已复制到剪贴板', icon: 'success' });
      }
    });
  };

  const handleBack = () => {
    Taro.navigateBack();
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <View className={styles.topRow}>
          <View className={styles.mainInfo}>
            <View className={styles.avatar}>{record.candidateName.charAt(0)}</View>
            <View className={styles.info}>
              <Text className={styles.name}>{record.candidateName}</Text>
              <Text className={styles.position}>{record.position} · {record.department}</Text>
            </View>
          </View>
          <View className={styles.score}>
            <Text className={styles.scoreNum}>{record.overallScore}</Text>
            <Text className={styles.scoreLabel}>综合得分</Text>
          </View>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.tag}>📋 {record.templateName}</Text>
          <Text className={styles.tag}>👤 {record.interviewerName}</Text>
          <Text className={styles.tag}>🔄 第{record.round}/{record.totalRounds}轮</Text>
          <Text className={styles.tag}>⏱ {record.duration}分钟</Text>
          <Text className={styles.tag}>📅 {formatDate(record.date, 'YYYY-MM-DD')}</Text>
        </View>
      </View>

      <View className={`${styles.recommendation} ${styles[record.recommendation]}`}>
        {getRecommendationText(record.recommendation)}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📝 面试官总结</Text>
        <Text className={styles.summaryText}>{record.summary || '（无总结）'}</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📊 各维度评分</Text>
        {record.scores.map((s, idx) => (
          <View key={idx}>
            <View className={styles.scoreRow}>
              <Text className={styles.compName}>{compMap.get(s.competencyId) || '维度' + (idx + 1)}</Text>
              <View className={styles.bar}>
                <View className={styles.fill} style={{ width: `${(s.score / s.maxScore) * 100}%` }}></View>
              </View>
              <Text className={styles.scoreVal}>{s.score}</Text>
            </View>
            {s.reason && (
              <Text className={styles.reasonText}>理由：{s.reason}</Text>
            )}
          </View>
        ))}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>💬 问答记录</Text>
        {record.questions.map((q, idx) => {
          const a = record.answers[idx];
          return (
            <View key={idx} className={styles.qaItem}>
              <Text className={styles.question}>Q{idx + 1}: {q.content}</Text>
              {a?.answer && (
                <Text className={styles.answer}>{a.answer}</Text>
              )}
              <View className={styles.markers}>
                {a?.highlights?.map((h, i) => (
                  <Text key={`h-${i}`} className={`${styles.marker} ${styles.highlight}`}>✨ {h}</Text>
                ))}
                {a?.doubts?.map((d, i) => (
                  <Text key={`d-${i}`} className={`${styles.marker} ${styles.doubt}`}>❓ {d}</Text>
                ))}
                {a?.risks?.map((r, i) => (
                  <Text key={`r-${i}`} className={`${styles.marker} ${styles.risk}`}>⚠️ {r}</Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {record.reviewItems.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>⚠️ 需要复核</Text>
          <View className={styles.reviewList}>
            {record.reviewItems.map((item, idx) => (
              <View key={idx} className={styles.reviewItem}>
                <Text className={styles.icon}>📌</Text>
                <Text className={styles.text}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <button className={`${styles.btn} ${styles.backBtn}`} onClick={handleBack}>返回</button>
        <button className={`${styles.btn} ${styles.exportBtn}`} onClick={handleExport}>导出纪要</button>
      </View>
    </ScrollView>
  );
}
