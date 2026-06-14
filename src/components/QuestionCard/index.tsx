import React, { useState } from 'react';
import { View, Text, Textarea, Button, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import TagBadge from '../TagBadge';
import { Question, AIFollowupSuggestion } from '@/types';
import { mockCompetencies, mockAIFollowups } from '@/data/templates';
import { useInterviewStore } from '@/store/interview';

interface QuestionCardProps {
  question: Question;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, isActive, onClick }) => {
  const { currentSession, updateAnswer, addAnswer } = useInterviewStore();

  const [answer, setAnswer] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [doubtInput, setDoubtInput] = useState('');
  const [riskInput, setRiskInput] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [doubts, setDoubts] = useState<string[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(true);

  const competency = mockCompetencies.find(c => c.id === question.competencyId);

  const existingAnswer = currentSession.answers.find(a => a.questionId === question.id);

  const addItem = (type: 'highlight' | 'doubt' | 'risk') => {
    if (type === 'highlight' && highlightInput.trim()) {
      const newItems = [...highlights, highlightInput.trim()];
      setHighlights(newItems);
      setHighlightInput('');
      saveAnswer({ highlights: newItems });
    } else if (type === 'doubt' && doubtInput.trim()) {
      const newItems = [...doubts, doubtInput.trim()];
      setDoubts(newItems);
      setDoubtInput('');
      saveAnswer({ doubts: newItems });
    } else if (type === 'risk' && riskInput.trim()) {
      const newItems = [...risks, riskInput.trim()];
      setRisks(newItems);
      setRiskInput('');
      saveAnswer({ risks: newItems });
    }
  };

  const removeItem = (type: 'highlight' | 'doubt' | 'risk', idx: number) => {
    if (type === 'highlight') {
      const newItems = highlights.filter((_, i) => i !== idx);
      setHighlights(newItems);
      saveAnswer({ highlights: newItems });
    } else if (type === 'doubt') {
      const newItems = doubts.filter((_, i) => i !== idx);
      setDoubts(newItems);
      saveAnswer({ doubts: newItems });
    } else if (type === 'risk') {
      const newItems = risks.filter((_, i) => i !== idx);
      setRisks(newItems);
      saveAnswer({ risks: newItems });
    }
  };

  const saveAnswer = (updates: Record<string, unknown>) => {
    const answerData = {
      questionId: question.id,
      answer: updates.answer ?? answer,
      highlights: updates.highlights ?? highlights,
      doubts: updates.doubts ?? doubts,
      risks: updates.risks ?? risks
    };

    if (existingAnswer) {
      updateAnswer(question.id, answerData);
    } else {
      addAnswer(answerData as any);
    }
  };

  const handleAnswerChange = (e: any) => {
    const val = e.detail.value;
    setAnswer(val);
    saveAnswer({ answer: val });
  };

  const applyAIFollowup = (content: string) => {
    setAnswer(prev => {
      const newVal = prev ? prev + '\n\n【追问】' + content : '【追问】' + content;
      saveAnswer({ answer: newVal });
      return newVal;
    });
  };

  return (
    <View
      className={classnames(styles.questionCard, isActive && styles.active)}
      onClick={onClick}
    >
      <View className={styles.cardHeader}>
        <View className={styles.questionIndex}>Q{index + 1}</View>
        <View className={styles.questionMeta}>
          {competency && <TagBadge text={competency.name} type="primary" size="sm" />}
          {question.type === 'required' && <TagBadge text="必问" type="error" size="sm" />}
          {question.type === 'ai-generated' && <TagBadge text="AI追问" type="info" size="sm" />}
        </View>
      </View>

      <Text className={styles.questionContent}>{question.content}</Text>

      {question.scoringGuide && (
        <View className={styles.scoringGuide}>
          <Text className={styles.guideLabel}>评分要点：</Text>
          <Text className={styles.guideText}>{question.scoringGuide}</Text>
        </View>
      )}

      {isActive && (
        <View className={styles.answerSection} onClick={(e) => e.stopPropagation()}>
          {showAISuggestions && (
            <View className={styles.aiSection}>
              <View className={styles.aiHeader}>
                <View className={styles.aiBadge}>
                  <Text className={styles.aiIcon}>🤖</Text>
                  <Text className={styles.aiTitle}>AI 追问建议</Text>
                </View>
                <Text
                  className={styles.aiClose}
                  onClick={() => setShowAISuggestions(false)}
                >
                  收起
                </Text>
              </View>
              <ScrollView scrollX className={styles.aiSuggestionScroll}>
                <View className={styles.aiSuggestionList}>
                  {mockAIFollowups.map(sug => (
                    <View
                      key={sug.id}
                      className={styles.aiSuggestionCard}
                      onClick={() => applyAIFollowup(sug.content)}
                    >
                      <View className={styles.aiSugHeader}>
                        <TagBadge text={sug.competency} type="info" size="sm" />
                      </View>
                      <Text className={styles.aiSugContent}>{sug.content}</Text>
                      <Text className={styles.aiSugReason}>💡 {sug.reason}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <View className={styles.answerLabel}>
            <Text>候选人回答要点</Text>
            <Text className={styles.charCount}>{answer.length}/1000</Text>
          </View>
          <Textarea
            className={styles.answerInput}
            placeholder="请记录候选人回答的核心要点..."
            value={answer}
            onInput={handleAnswerChange}
            maxlength={1000}
            autoHeight
          />

          <View className={styles.recordSection}>
            <View className={styles.recordGroup}>
              <View className={styles.recordHeader}>
                <View className={styles.recordTitle}>
                  <Text className={styles.recordIcon} style={{ color: '#FF7D00' }}>★</Text>
                  <Text className={styles.recordText}>亮点</Text>
                </View>
              </View>
              <View className={styles.recordTags}>
                {highlights.map((h, i) => (
                  <View key={i} className={classnames(styles.recordTag, styles.tagHighlight)}>
                    <Text>{h}</Text>
                    <Text className={styles.tagClose} onClick={() => removeItem('highlight', i)}>×</Text>
                  </View>
                ))}
              </View>
              <View className={styles.inputRow}>
                <Textarea
                  className={styles.tagInput}
                  placeholder="添加亮点描述..."
                  value={highlightInput}
                  onInput={(e) => setHighlightInput(e.detail.value)}
                  maxlength={100}
                />
                <Button className={styles.addBtn} onClick={() => addItem('highlight')}>
                  添加
                </Button>
              </View>
            </View>

            <View className={styles.recordGroup}>
              <View className={styles.recordHeader}>
                <View className={styles.recordTitle}>
                  <Text className={styles.recordIcon} style={{ color: '#1E5EFF' }}>?</Text>
                  <Text className={styles.recordText}>疑点</Text>
                </View>
              </View>
              <View className={styles.recordTags}>
                {doubts.map((d, i) => (
                  <View key={i} className={classnames(styles.recordTag, styles.tagDoubt)}>
                    <Text>{d}</Text>
                    <Text className={styles.tagClose} onClick={() => removeItem('doubt', i)}>×</Text>
                  </View>
                ))}
              </View>
              <View className={styles.inputRow}>
                <Textarea
                  className={styles.tagInput}
                  placeholder="添加需进一步确认的疑点..."
                  value={doubtInput}
                  onInput={(e) => setDoubtInput(e.detail.value)}
                  maxlength={100}
                />
                <Button className={styles.addBtn} onClick={() => addItem('doubt')}>
                  添加
                </Button>
              </View>
            </View>

            <View className={styles.recordGroup}>
              <View className={styles.recordHeader}>
                <View className={styles.recordTitle}>
                  <Text className={styles.recordIcon} style={{ color: '#F53F3F' }}>!</Text>
                  <Text className={styles.recordText}>风险项</Text>
                </View>
              </View>
              <View className={styles.recordTags}>
                {risks.map((r, i) => (
                  <View key={i} className={classnames(styles.recordTag, styles.tagRisk)}>
                    <Text>{r}</Text>
                    <Text className={styles.tagClose} onClick={() => removeItem('risk', i)}>×</Text>
                  </View>
                ))}
              </View>
              <View className={styles.inputRow}>
                <Textarea
                  className={styles.tagInput}
                  placeholder="添加潜在风险项..."
                  value={riskInput}
                  onInput={(e) => setRiskInput(e.detail.value)}
                  maxlength={100}
                />
                <Button className={styles.addBtn} onClick={() => addItem('risk')}>
                  添加
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default QuestionCard;
