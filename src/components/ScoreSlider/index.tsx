import React from 'react';
import { View, Text, Slider, Textarea } from '@tarojs/components';
import styles from './index.module.scss';
import { Competency } from '@/types';

interface ScoreSliderProps {
  competency: Competency;
  score: number;
  maxScore?: number;
  reason?: string;
  onScoreChange: (score: number) => void;
  onReasonChange?: (reason: string) => void;
}

const ScoreSlider: React.FC<ScoreSliderProps> = ({
  competency,
  score,
  maxScore = 10,
  reason = '',
  onScoreChange,
  onReasonChange
}) => {
  const getScoreLevel = (s: number) => {
    const percent = s / maxScore;
    if (percent >= 0.9) return { text: '优秀', color: '#00B42A' };
    if (percent >= 0.75) return { text: '良好', color: '#00B8D9' };
    if (percent >= 0.6) return { text: '合格', color: '#1E5EFF' };
    if (percent >= 0.4) return { text: '待提升', color: '#FF7D00' };
    return { text: '不合格', color: '#F53F3F' };
  };

  const level = getScoreLevel(score);

  return (
    <View className={styles.scoreSlider}>
      <View className={styles.header}>
        <View className={styles.competencyInfo}>
          <Text className={styles.competencyName}>{competency.name}</Text>
          <Text className={styles.competencyWeight}>权重 ×{competency.weight}</Text>
        </View>
        <View className={styles.scoreDisplay}>
          <Text className={styles.scoreValue} style={{ color: level.color }}>
            {score}
          </Text>
          <Text className={styles.scoreMax}>/{maxScore}</Text>
          <View className={styles.levelTag} style={{ backgroundColor: `${level.color}15` }}>
            <Text style={{ color: level.color }}>{level.text}</Text>
          </View>
        </View>
      </View>

      <View className={styles.sliderWrapper}>
        <Slider
          min={0}
          max={maxScore}
          step={1}
          value={score}
          onChange={(e) => onScoreChange(e.detail.value)}
          activeColor={level.color}
          backgroundColor="#E5E6EB"
          blockSize={28}
          blockColor={level.color}
          showValue={false}
        />
        <View className={styles.scaleMarks}>
          {[0, 2, 4, 6, 8, 10].map((v) => (
            <Text key={v} className={styles.scaleText}>{v}</Text>
          ))}
        </View>
      </View>

      <View className={styles.competencyDesc}>
        <Text className={styles.descLabel}>维度说明：</Text>
        <Text className={styles.descText}>{competency.description}</Text>
      </View>

      {onReasonChange && (
        <View className={styles.reasonSection}>
          <Text className={styles.reasonLabel}>评分理由</Text>
          <Textarea
            className={styles.reasonInput}
            placeholder="请输入评分理由，建议结合具体STAR案例..."
            value={reason}
            onInput={(e) => onReasonChange(e.detail.value)}
            maxlength={300}
            autoHeight
          />
          <Text className={styles.reasonCount}>{reason.length}/300</Text>
        </View>
      )}
    </View>
  );
};

export default ScoreSlider;
