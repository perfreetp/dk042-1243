import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import TagBadge from '../TagBadge';
import { InterviewRecord } from '@/types';
import {
  getRecommendationText,
  getRecommendationColor,
  getRecommendationBgColor,
  formatDuration
} from '@/utils';

interface RecordItemProps {
  record: InterviewRecord;
  onClick?: () => void;
}

const RecordItem: React.FC<RecordItemProps> = ({ record, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.showModal({
        title: '面试纪要',
        content: record.summary,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  };

  return (
    <View className={styles.recordItem} onClick={handleClick}>
      <View className={styles.header}>
        <Image
          className={styles.avatar}
          src={record.candidateAvatar}
          mode="aspectFill"
        />
        <View className={styles.candidateInfo}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{record.candidateName}</Text>
            {record.exported && <TagBadge text="已导出" type="success" size="sm" />}
          </View>
          <Text className={styles.position}>
            {record.position} · 第{record.round}/{record.totalRounds}轮
          </Text>
          <Text className={styles.meta}>
            {record.date} · {formatDuration(record.duration)} · {record.interviewerName}
          </Text>
        </View>
      </View>

      <View className={styles.scoreRow}>
        <View className={styles.scoreBlock}>
          <Text className={styles.scoreLabel}>综合评分</Text>
          <View className={styles.scoreValueWrap}>
            <Text
              className={styles.scoreValue}
              style={{ color: getRecommendationColor(record.recommendation) }}
            >
              {record.overallScore}
            </Text>
            <Text className={styles.scoreMax}>分</Text>
          </View>
        </View>

        <View
          className={styles.recommendationTag}
          style={{
            backgroundColor: getRecommendationBgColor(record.recommendation)
          }}
        >
          <Text
            className={styles.recommendationText}
            style={{ color: getRecommendationColor(record.recommendation) }}
          >
            {getRecommendationText(record.recommendation)}
          </Text>
        </View>

        <View className={styles.reviewBlock}>
          {record.reviewItems.length > 0 ? (
            <>
              <Text className={styles.reviewCount}>{record.reviewItems.length}</Text>
              <Text className={styles.reviewLabel}>待复核项</Text>
            </>
          ) : (
            <Text className={styles.noReview}>无复核</Text>
          )}
        </View>
      </View>

      <View className={styles.summary}>
        <Text className={styles.summaryText}>
          {record.summary.length > 80
            ? record.summary.slice(0, 80) + '...'
            : record.summary}
        </Text>
      </View>

      {record.reviewItems.length > 0 && (
        <View className={styles.reviewList}>
          {record.reviewItems.slice(0, 2).map((item, i) => (
            <View key={i} className={styles.reviewItem}>
              <Text className={styles.reviewDot}>●</Text>
              <Text className={styles.reviewText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default RecordItem;
