import React, { useState } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useInterviewStore } from '../../store/interview';
import styles from './index.module.scss';

export default function StartInterview() {
  const { candidates, templates, startInterview, currentTemplateId } = useInterviewStore();
  const router = useRouter();

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    router.params.candidateId || null
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(currentTemplateId);
  const [interviewerName, setInterviewerName] = useState<string>('');
  const [round, setRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(3);

  useDidShow(() => {
    if (currentTemplateId && !selectedTemplateId) {
      setSelectedTemplateId(currentTemplateId);
    }
  });

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const canStart = selectedCandidateId && selectedTemplateId && interviewerName.trim();

  const handleStart = () => {
    if (!canStart) return;

    startInterview({
      candidateId: selectedCandidateId!,
      templateId: selectedTemplateId!,
      interviewerId: 'current',
      interviewerName: interviewerName.trim(),
      round,
      totalRounds
    });

    Taro.showToast({ title: '面试已开始', icon: 'success' });
    setTimeout(() => {
      Taro.navigateTo({ url: '/pages/interview/index' });
    }, 500);
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>发起面试</Text>
        <Text className={styles.subtitle}>确认面试信息后开始结构化提问</Text>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text>选择候选人</Text>
          <Text className={styles.count}>{candidates.length} 人</Text>
        </View>
        <View className={styles.candidateList}>
          {candidates.map(c => (
            <View
              key={c.id}
              className={`${styles.candidateCard} ${selectedCandidateId === c.id ? styles.selected : ''}`}
              onClick={() => setSelectedCandidateId(c.id)}
            >
              <View className={styles.avatar}>
                {c.name.charAt(0)}
              </View>
              <View className={styles.info}>
                <Text className={styles.name}>{c.name}</Text>
                <Text className={styles.position}>{c.position} · {c.experience}年 · {c.education}</Text>
              </View>
              <View className={styles.check}>✓</View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text>选择面试模板</Text>
          <Text className={styles.count}>{templates.length} 套</Text>
        </View>
        <View className={styles.templateList}>
          {templates.map(t => (
            <View
              key={t.id}
              className={`${styles.templateCard} ${selectedTemplateId === t.id ? styles.selected : ''}`}
              onClick={() => setSelectedTemplateId(t.id)}
            >
              <Text className={styles.templateName}>{t.name}</Text>
              <Text className={styles.templateMeta}>{t.position} · {t.department}</Text>
              <View className={styles.templateStats}>
                <Text className={styles.stat}>📊 {t.competencies.length} 维度</Text>
                <Text className={styles.stat}>❓ {t.requiredQuestions.length + t.followupQuestions.length} 题</Text>
                <Text className={styles.stat}>📋 使用 {t.usageCount} 次</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text>面试配置</Text>
        </View>

        <View className={styles.optionRow}>
          <Text className={styles.label}>面试官</Text>
          <View className={styles.value}>
            <Input
              className={styles.input}
              placeholder="请输入面试官姓名"
              value={interviewerName}
              onInput={e => setInterviewerName(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.optionRow}>
          <Text className={styles.label}>本轮次</Text>
          <View className={styles.value}>
            <View className={styles.stepper}>
              <View
                className={styles.btn}
                onClick={() => setRound(Math.max(1, round - 1))}
              >−</View>
              <Text className={styles.num}>{round}</Text>
              <View
                className={styles.btn}
                onClick={() => setRound(Math.min(totalRounds, round + 1))}
              >+</View>
              <Text className={styles.label} style={{ width: 'auto', marginLeft: 24 }}>共</Text>
              <View
                className={styles.btn}
                onClick={() => setTotalRounds(Math.max(1, totalRounds - 1))}
              >−</View>
              <Text className={styles.num}>{totalRounds}</Text>
              <View
                className={styles.btn}
                onClick={() => setTotalRounds(totalRounds + 1)}
              >+</View>
              <Text className={styles.desc}>轮</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.summaryBar}>
        <View className={styles.info}>
          {selectedCandidate ? (
            <>
              <Text className={styles.candidate}>{selectedCandidate.name}</Text>
              <Text className={styles.meta}>
                {selectedTemplate?.name || '未选模板'} · 第{round}轮
              </Text>
            </>
          ) : (
            <Text className={styles.meta}>请选择候选人</Text>
          )}
        </View>
        <button
          className={styles.startBtn}
          disabled={!canStart}
          onClick={handleStart}
        >开始面试</button>
      </View>
    </ScrollView>
  );
}
