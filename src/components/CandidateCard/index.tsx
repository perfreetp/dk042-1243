import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import TagBadge from '../TagBadge';
import { Candidate } from '@/types';
import { getStatusText, getStatusColor, formatDate } from '@/utils';
import classnames from 'classnames';
import { useInterviewStore } from '@/store/interview';

interface CandidateCardProps {
  candidate: Candidate;
  showSelect?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  showSelect = false,
  isSelected = false,
  onClick
}) => {
  const { startInterview, toggleCompareCandidate } = useInterviewStore();

  const handleClick = () => {
    if (showSelect) {
      toggleCompareCandidate(candidate.id);
    } else if (onClick) {
      onClick();
    } else {
      startInterview(candidate.id);
      Taro.switchTab({ url: '/pages/interview/index' });
    }
  };

  return (
    <View
      className={classnames(styles.candidateCard, isSelected && styles.selected)}
      onClick={handleClick}
    >
      {showSelect && (
        <View className={classnames(styles.checkbox, isSelected && styles.checked)}>
          {isSelected && <Text className={styles.checkMark}>✓</Text>}
        </View>
      )}

      <Image
        className={styles.avatar}
        src={candidate.avatar}
        mode="aspectFill"
      />

      <View className={styles.info}>
        <View className={styles.header}>
          <Text className={styles.name}>{candidate.name}</Text>
          <View
            className={styles.statusTag}
            style={{ backgroundColor: `${getStatusColor(candidate.status)}15` }}
          >
            <Text style={{ color: getStatusColor(candidate.status) }}>
              {getStatusText(candidate.status)}
            </Text>
          </View>
        </View>

        <View className={styles.positionRow}>
          <Text className={styles.position}>{candidate.position}</Text>
          <Text className={styles.round}>
            第{candidate.interviewRound}/{candidate.totalRounds}轮
          </Text>
        </View>

        <View className={styles.meta}>
          <Text className={styles.metaText}>
            {candidate.experience}年 · {candidate.education} · {candidate.department}
          </Text>
        </View>

        <View className={styles.tags}>
          {candidate.tags.slice(0, 3).map((tag, i) => (
            <TagBadge key={i} text={tag} type="primary" />
          ))}
          {candidate.tags.length > 3 && (
            <TagBadge text={`+${candidate.tags.length - 3}`} type="default" />
          )}
        </View>

        <View className={styles.footer}>
          <Text className={styles.appliedAt}>投递：{formatDate(candidate.appliedAt)}</Text>
          <Text className={styles.action}>点击开始面试 →</Text>
        </View>
      </View>
    </View>
  );
};

export default CandidateCard;
