import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, Button, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import ScoreSlider from '@/components/ScoreSlider';
import TagBadge from '@/components/TagBadge';
import RadarChart from '@/components/RadarChart';
import { useInterviewStore } from '@/store/interview';
import { mockCompetencies } from '@/data/templates';
import { mockScores } from '@/data/interviews';
import { ScoreDimension } from '@/types';
import { calculateOverallScore, getRecommendationText, getRecommendationColor } from '@/utils';
import classnames from 'classnames';

const recOptions = [
  { key: 'strong-hire', label: '强烈推荐', desc: '优秀候选人，建议录用', color: '#00B42A', icon: '🌟' },
  { key: 'hire', label: '推荐录用', desc: '符合要求，建议通过', color: '#00B8D9', icon: '✅' },
  { key: 'borderline', label: '待定复核', desc: '存疑，建议再评估', color: '#FF7D00', icon: '⚠️' },
  { key: 'no-hire', label: '不予录用', desc: '未达要求，不通过', color: '#F53F3F', icon: '❌' }
];

const ScoringPage: React.FC = () => {
  const { currentCandidate, setScores, setOverallScore, setRecommendation, setSummary } = useInterviewStore();

  const [scores, setLocalScores] = useState<ScoreDimension[]>(() =>
    mockCompetencies.map(comp => {
      const existing = mockScores.find(s => s.competencyId === comp.id);
      return existing || {
        competencyId: comp.id,
        score: 7,
        maxScore: 10,
        reason: ''
      };
    })
  );
  const [recommendation, setLocalRecommendation] = useState<string>('hire');
  const [summary, setLocalSummary] = useState('');

  const overallScore = useMemo(() => {
    const weighted = scores.map((s, i) => ({
      ...s,
      weight: mockCompetencies[i]?.weight || 1
    }));
    return calculateOverallScore(weighted);
  }, [scores]);

  const scoreLevel = useMemo(() => {
    if (overallScore >= 90) return { text: 'S级 · 卓越', rank: '超过95%的候选人' };
    if (overallScore >= 80) return { text: 'A级 · 优秀', rank: '超过80%的候选人' };
    if (overallScore >= 70) return { text: 'B级 · 良好', rank: '超过60%的候选人' };
    if (overallScore >= 60) return { text: 'C级 · 合格', rank: '超过40%的候选人' };
    return { text: 'D级 · 待提升', rank: '需重点关注' };
  }, [overallScore]);

  useEffect(() => {
    setScores(scores);
    setOverallScore(overallScore);
  }, [scores, overallScore, setScores, setOverallScore]);

  useEffect(() => {
    setRecommendation(recommendation as any);
  }, [recommendation, setRecommendation]);

  useEffect(() => {
    setSummary(summary);
  }, [summary, setSummary]);

  const handleScoreChange = (competencyId: string, newScore: number) => {
    setLocalScores(prev =>
      prev.map(s =>
        s.competencyId === competencyId ? { ...s, score: newScore } : s
      )
    );
  };

  const handleReasonChange = (competencyId: string, reason: string) => {
    setLocalScores(prev =>
      prev.map(s =>
        s.competencyId === competencyId ? { ...s, reason } : s
      )
    );
  };

  const handleGenerateSummary = () => {
    Taro.showLoading({ title: 'AI生成中...' });
    setTimeout(() => {
      Taro.hideLoading();
      const rec = recOptions.find(r => r.key === recommendation);
      const highlights = scores
        .filter(s => s.score >= 8)
        .map(s => mockCompetencies.find(c => c.id === s.competencyId)?.name)
        .filter(Boolean);
      const improvements = scores
        .filter(s => s.score <= 6)
        .map(s => mockCompetencies.find(c => c.id === s.competencyId)?.name)
        .filter(Boolean);

      const generated = `${currentCandidate?.name || '候选人'}综合得分为${overallScore}分（${scoreLevel.text}），整体表现${overallScore >= 75 ? '优秀，达到岗位要求' : '尚可，部分维度需加强'}。
\n主要优势体现在${highlights.length > 0 ? highlights.join('、') : '综合能力均衡'}等方面。
${improvements.length > 0 ? `建议在${improvements.join('、')}等方面进一步评估和考察。\n` : ''}
综合评价：${rec?.label}，${overallScore >= 70 ? '建议' : '不建议'}进入下一环节。`;

      setLocalSummary(generated);
      Taro.showToast({ title: '已生成AI评语', icon: 'success' });
    }, 1200);
  };

  const handleSubmit = () => {
    const missingReasons = scores.filter(s => !s.reason.trim() && s.score !== 7);
    if (missingReasons.length > 0) {
      Taro.showModal({
        title: '评分提醒',
        content: `有${missingReasons.length}个维度缺少评分理由，建议补充后提交。是否继续提交？`,
        confirmText: '继续提交',
        success: (res) => {
          if (res.confirm) {
            doSubmit();
          }
        }
      });
    } else {
      doSubmit();
    }
  };

  const doSubmit = () => {
    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: '评分提交成功', icon: 'success' });
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/records/index' });
      }, 1500);
    }, 1000);
  };

  return (
    <View className={styles.pageContainer}>
      <View style={{ padding: `0 ${32}rpx`, paddingTop: 32 }}>
        <Text className="pageTitle">评分面板</Text>
        <Text className="pageSubtitle">请根据候选人面试表现客观打分</Text>

        {currentCandidate && (
          <View className={styles.candidateInfo}>
            <Image
              className={styles.avatar}
              src={currentCandidate.avatar}
              mode="aspectFill"
            />
            <View className={styles.info}>
              <Text className={styles.name}>{currentCandidate.name}</Text>
              <Text className={styles.position}>{currentCandidate.position}</Text>
              <View className={styles.tagRow}>
                {currentCandidate.tags.slice(0, 3).map((t, i) => (
                  <TagBadge key={i} text={t} type="primary" size="sm" />
                ))}
              </View>
            </View>
          </View>
        )}

        <View className={styles.overallScoreCard}>
          <View className={styles.scoreLeft}>
            <Text className={styles.scoreLabel}>综合加权得分</Text>
            <View className={styles.scoreMain}>
              <Text className={styles.scoreValue}>{overallScore}</Text>
              <Text className={styles.scoreMax}>分</Text>
            </View>
            <Text className={styles.scoreHint}>基于各维度权重计算</Text>
          </View>
          <View className={styles.scoreRight}>
            <View className={styles.levelBadge}>
              <Text className={styles.levelText}>{scoreLevel.text}</Text>
            </View>
            <Text className={styles.rankText}>{scoreLevel.rank}</Text>
          </View>
        </View>

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            能力分布图
            <Text className={styles.badge}>可视化</Text>
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <RadarChart scores={scores} />
        </View>

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            多维度评分
            <Text className={styles.badge}>{mockCompetencies.length}项</Text>
          </Text>
        </View>

        {mockCompetencies.map((comp, i) => {
          const scoreData = scores.find(s => s.competencyId === comp.id);
          return (
            <ScoreSlider
              key={comp.id}
              competency={comp}
              score={scoreData?.score || 7}
              maxScore={10}
              reason={scoreData?.reason || ''}
              onScoreChange={(s) => handleScoreChange(comp.id, s)}
              onReasonChange={(r) => handleReasonChange(comp.id, r)}
            />
          );
        })}

        <View className={styles.recommendationSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              录用建议
              <Text className={styles.badge}>必填</Text>
            </Text>
          </View>
          <View className={styles.recOptions}>
            {recOptions.map(opt => (
              <View
                key={opt.key}
                className={classnames(styles.recOption, recommendation === opt.key && styles.active)}
                style={{
                  color: opt.color,
                  borderColor: recommendation === opt.key ? opt.color : 'transparent'
                }}
                onClick={() => setLocalRecommendation(opt.key)}
              >
                <Text className={styles.recIcon}>{opt.icon}</Text>
                <Text className={styles.recLabel} style={{ color: opt.color }}>
                  {opt.label}
                </Text>
                <Text className={styles.recDesc} style={{ color: opt.color }}>
                  {opt.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.summarySection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              总体评价
              <Text className={styles.badge}>推荐</Text>
            </Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryLabel}>面试总结评语</Text>
            <Textarea
              className={styles.summaryInput}
              placeholder="请输入候选人的总体评价，包括优劣势分析、录用建议等..."
              value={summary}
              onInput={(e) => setLocalSummary(e.detail.value)}
              maxlength={1000}
              autoHeight
            />
            <View className={styles.summaryTools}>
              <Button className={styles.aiGenBtn} onClick={handleGenerateSummary}>
                🤖 AI生成评语
              </Button>
              <Text className={styles.charCount}>{summary.length}/1000</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.bottomInfo}>
          <Text className={styles.bottomLabel}>录用建议</Text>
          <Text
            className={styles.bottomValue}
            style={{ color: getRecommendationColor(recommendation) }}
          >
            {getRecommendationText(recommendation)}
          </Text>
        </View>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          提交评分
        </Button>
      </View>
    </View>
  );
};

export default ScoringPage;
