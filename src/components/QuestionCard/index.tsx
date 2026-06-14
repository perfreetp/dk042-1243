import React from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import styles from './index.module.scss';
import { Question, AnswerRecord } from '@/types';
import TagBadge from '../TagBadge';
import classnames from 'classnames';

interface QuestionCardProps {
  question: Question;
  answer: Partial<AnswerRecord>;
  onAnswerChange: (value: string) => void;
  onToggleHighlight: () => void;
  onToggleDoubt: () => void;
  onToggleRisk: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  onAnswerChange,
  onToggleHighlight,
  onToggleDoubt,
  onToggleRisk
}) => {
  const hasHighlights = (answer.highlights || []).length > 0;
  const hasDoubts = (answer.doubts || []).length > 0;
  const hasRisks = (answer.risks || []).length > 0;

  return (
    <View className={styles.questionCard}>
      <View className={styles.questionHeader}>
        <View className={styles.questionType}>
          <TagBadge
            text={question.type === 'required' ? '必问' : '追问'}
            type={question.type === 'required' ? 'primary' : 'default'}
            size="sm"
          />
          <Text className={styles.questionCompetency}>
            考察：{question.competencyIds?.[0] || '综合能力'}
          </Text>
        </View>
      </View>

      <Text className={styles.questionContent}>
        {question.content}
      </Text>

      {question.keyPoints && question.keyPoints.length > 0 && (
        <View className={styles.keyPoints}>
          <Text className={styles.keyPointsLabel}>评分要点：</Text>
          {question.keyPoints.map((point, i) => (
            <View key={i} className={styles.keyPointItem}>
              <Text className={styles.keyPointDot}>•</Text>
              <Text className={styles.keyPointText}>{point}</Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.answerSection}>
        <View className={styles.answerHeader}>
          <Text className={styles.answerLabel}>候选人回答记录</Text>
          <Text className={styles.answerCount}>
            {(answer.answer || '').length} 字
          </Text>
        </View>
        <Textarea
          className={styles.answerInput}
          placeholder="请记录候选人的回答要点、关键信息..."
          value={answer.answer || ''}
          onInput={(e) => onAnswerChange(e.detail.value)}
          maxlength={2000}
          autoHeight
        />
      </View>

      <View className={styles.markSection}>
        <Text className={styles.markLabel}>快速标记</Text>
        <View className={styles.markButtons}>
          <View
            className={classnames(styles.markBtn, hasHighlights && styles.highlight)}
            onClick={onToggleHighlight}
          >
            <Text className={styles.markIcon}>✨</Text>
            <Text className={styles.markText}>亮点</Text>
          </View>
          <View
            className={classnames(styles.markBtn, hasDoubts && styles.doubt)}
            onClick={onToggleDoubt}
          >
            <Text className={styles.markIcon}>❓</Text>
            <Text className={styles.markText}>疑点</Text>
          </View>
          <View
            className={classnames(styles.markBtn, hasRisks && styles.risk)}
            onClick={onToggleRisk}
          >
            <Text className={styles.markIcon}>⚠️</Text>
            <Text className={styles.markText}>风险</Text>
          </View>
        </View>
      </View>

      <View className={styles.aiSuggestion}>
        <View className={styles.aiHeader}>
          <Text className={styles.aiLabel}>🤖 AI 追问建议</Text>
          <TagBadge text="智能" type="primary" size="sm" />
        </View>
        <View className={styles.aiCard}>
          <Text className={styles.aiQuestion}>
            💡 可以追问：请举一个具体的项目案例，说明你是如何解决这个问题的？
          </Text>
          <Text className={styles.aiHint}>
            考察：问题解决能力、项目经验真实性
          </Text>
        </View>
      </View>
    </View>
  );
};

export default QuestionCard;
