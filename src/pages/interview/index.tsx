import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, Button, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import QuestionCard from '@/components/QuestionCard';
import TagBadge from '@/components/TagBadge';
import { useInterviewStore } from '@/store/interview';
import { mockFollowupQuestions } from '@/data/templates';
import classnames from 'classnames';

const InterviewPage: React.FC = () => {
  const {
    currentCandidate,
    currentSession,
    setCurrentQuestionIndex,
    updateAnswer
  } = useInterviewStore();

  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  const questions = currentSession.questions || [];
  const currentIndex = currentSession.currentQuestionIndex || 0;
  const currentQuestion = questions[currentIndex];
  const answers = currentSession.answers || [];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(t => t + 60);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const currentAnswer = useMemo(() => {
    return answers.find(a => a.questionId === currentQuestion?.id) || {
      questionId: currentQuestion?.id || '',
      answer: '',
      highlights: [],
      doubts: [],
      risks: []
    };
  }, [answers, currentQuestion]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}小时${remainMins}分`;
    }
    return `${mins}分钟`;
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentQuestionIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentIndex + 1);
    } else {
      Taro.showModal({
        title: '面试结束',
        content: '确定要结束面试并前往评分吗？',
        confirmText: '去评分',
        success: (res) => {
          if (res.confirm) {
            Taro.switchTab({ url: '/pages/scoring/index' });
          }
        }
      });
    }
  };

  const handleEndInterview = () => {
    Taro.showModal({
      title: '结束面试',
      content: '确定要结束面试吗？结束后将跳转到评分页面。',
      confirmText: '结束并评分',
      success: (res) => {
        if (res.confirm) {
          Taro.switchTab({ url: '/pages/scoring/index' });
        }
      }
    });
  };

  const handleAnswerChange = (value: string) => {
    updateAnswer(currentQuestion.id, { answer: value });
  };

  const toggleHighlight = () => {
    const currentHighlights = currentAnswer.highlights || [];
    if (currentHighlights.length > 0) {
      updateAnswer(currentQuestion.id, {
        highlights: currentHighlights.slice(0, -1)
      });
    } else {
      updateAnswer(currentQuestion.id, {
        highlights: ['回答有亮点']
      });
    }
  };

  const toggleDoubt = () => {
    const currentDoubts = currentAnswer.doubts || [];
    if (currentDoubts.length > 0) {
      updateAnswer(currentQuestion.id, {
        doubts: currentDoubts.slice(0, -1)
      });
    } else {
      updateAnswer(currentQuestion.id, {
        doubts: ['回答存疑']
      });
    }
  };

  const toggleRisk = () => {
    const currentRisks = currentAnswer.risks || [];
    if (currentRisks.length > 0) {
      updateAnswer(currentQuestion.id, {
        risks: currentRisks.slice(0, -1)
      });
    } else {
      updateAnswer(currentQuestion.id, {
        risks: ['存在风险']
      });
    }
  };

  const answeredCount = answers.filter(a => a.answer?.trim()).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <View className={styles.pageContainer}>
      {currentCandidate && (
        <View className={styles.header}>
          <View className={styles.candidateInfo}>
            <Image
              className={styles.avatar}
              src={currentCandidate.avatar}
              mode="aspectFill"
            />
            <View className={styles.info}>
              <Text className={styles.name}>{currentCandidate.name}</Text>
              <Text className={styles.position}>
                {currentCandidate.position} · 第{currentCandidate.interviewRound}轮
              </Text>
            </View>
          </View>
          <View className={styles.timer}>
            <Text className={styles.timerIcon}>⏱</Text>
            <Text className={styles.timerText}>{formatTime(timer)}</Text>
          </View>
        </View>
      )}

      <View className={styles.progressSection}>
        <View className={styles.progressInfo}>
          <Text className={styles.progressText}>
            第 {currentIndex + 1}/{questions.length} 题
          </Text>
          <Text className={styles.progressPercent}>{progress}%</Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      <ScrollView
        className={styles.questionNav}
        scrollX
        showScrollbar={false}
      >
        {questions.map((q, i) => {
          const answered = answers.find(a => a.questionId === q.id && a.answer?.trim());
          return (
            <View
              key={q.id}
              className={classnames(
                styles.navItem,
                i === currentIndex && styles.active,
                answered && styles.answered
              )}
              onClick={() => setCurrentQuestionIndex(i)}
            >
              {i + 1}
            </View>
          );
        })}
      </ScrollView>

      {currentQuestion && (
        <View className={styles.questionContent}>
          <QuestionCard
            question={currentQuestion}
            answer={currentAnswer}
            onAnswerChange={handleAnswerChange}
            onToggleHighlight={toggleHighlight}
            onToggleDoubt={toggleDoubt}
            onToggleRisk={toggleRisk}
          />
        </View>
      )}

      <View className={styles.followupSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            AI 追问建议
            <TagBadge text="智能" type="primary" size="sm" />
          </Text>
        </View>
        <ScrollView
          className={styles.followupScroll}
          scrollX
          showScrollbar={false}
        >
          {mockFollowupQuestions.slice(0, 5).map((q, i) => (
            <View key={i} className={styles.followupCard}>
              <Text className={styles.followupText}>💡 {q.content}</Text>
              <View className={styles.followupHint}>
                <Text className={styles.followupHintText}>
                  考察：{q.competencyIds?.map(id =>
                    mockFollowupQuestions.find(f => f.id === id)?.content?.slice(0, 8) || ''
                  ).filter(Boolean).join('、') || '深度'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.bottomBar}>
        <Button
          className={styles.prevBtn}
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          上一题
        </Button>
        <Button className={styles.endBtn} onClick={handleEndInterview}>
          结束面试
        </Button>
        <Button className={styles.nextBtn} onClick={handleNext}>
          {currentIndex === questions.length - 1 ? '去评分' : '下一题'}
        </Button>
      </View>
    </View>
  );
};

export default InterviewPage;
