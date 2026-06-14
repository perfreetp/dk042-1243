import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface TagBadgeProps {
  text: string;
  type?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'highlight' | 'doubt' | 'risk';
  size?: 'sm' | 'md';
}

const TagBadge: React.FC<TagBadgeProps> = ({ text, type = 'default', size = 'sm' }) => {
  return (
    <View className={classnames(styles.tagBadge, styles[type], styles[size])}>
      <Text className={styles.tagText}>{text}</Text>
    </View>
  );
};

export default TagBadge;
