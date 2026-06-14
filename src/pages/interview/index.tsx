import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import QuestionCard from '@/components/QuestionCard';
import { useInterviewStore } from '@/store/interview';
import { mockTemplates } from '@/data/templates';
import classnames from 'classnames';

const InterviewPage: React.FC = () => {
  const { currentCandidate, currentSession, setCurrentQuestionIndex } = useInterviewStore();
  const [timer, setTimer] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const questions = currentSession.questions;
  const currentIndex = currentSession.currentQuestionIndex;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const template = mockTemplates.find(t => t.id === currentSession.templateId);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentQuestionIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const currentQ = questions[currentIndex];
      setAnsweredQuestions(prev => new Set(prev).add(currentQ.id));
      setCurrentQuestionIndex(currentIndex + 1);
      Taro.pageScrollTo({ scrollTop: 0, duration: 300 });
    }
  };

  const handleFinish = () => {
    Taro.showModal({
      title: '结束面试',
      content: '确定要结束本场面试吗？结束后将进入评分环节。',
      confirmText: '结束面试',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '面试已结束，请进行评分', icon: 'success' });
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/scoring/index' });
          }, 1500);
        }
      }
    });
  };

  const handleQuestionClick = (index: number) => {
    if (index !== currentIndex) {
      const currentQ = questions[currentIndex];
      setAnsweredQuestions(prev => new Set(prev).add(currentQ.id));
      setCurrentQuestionIndex(index);
      Taro.pageScrollTo({ scrollTop: 0, duration: 300 });
    }
  };

  if (!currentCandidate) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: `0 ${32}rpx`, paddingTop: 32 }}>
          <Text className="pageTitle">结构化面试</Text>
          <View className="card" style={{ textAlign: 'center', padding: '64rpx 32rpx' }}>
            <Text style={{ fontSize: '80rpx', display: 'block', marginBottom: 32 }}>👤</Text>
            <Text style={{ fontSize: 32, color: '#4E5969', lineHeight: 1.6 }}>
              请先到「候选人」页面选择一位候选人开始面试
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <View style={{ padding: `0 ${32}rpx`, paddingTop: 32 }}>
        <Text className="pageTitle">结构化面试</Text>

        <View className={styles.candidateHeader}>
          <View className={styles.headerTop}>
            <Image
              className={styles.avatar}
              src={currentCandidate.avatar}
              mode="aspectFill"
            />
            <View className={styles.headerInfo}>
              <Text className={styles.name}>{currentCandidate.name}</Text>
              <Text className={styles.position}>{currentCandidate.position}</Text>
            </View>
            <View className={styles.timerBadge}>
              <Text className={styles.timerLabel}>面试时长</Text>
              <Text className={styles.timerValue}>{formatTimer(timer)}</Text>
            </View>
          </View>
          <View className={styles.headerMeta}>
            <View className={styles.metaItem}>
              <Text>📋</Text>
              <Text>第 {currentCandidate.interviewRound}/{currentCandidate.totalRounds} 轮</Text>
            </View>
            <View className={styles.metaItem}>
              <Text>👔</Text>
              <Text>{currentCandidate.experience}年经验</Text>
            </View>
            <View className={styles.metaItem}>
              <Text>🎓</Text>
              <Text>{currentCandidate.education}</Text>
            </View>
            <View className={styles.metaItem}>
              <Text>📝</Text>
              <Text>{template?.name || '标准面试模板'}</Text>
            </View>
          </View>
        </View>

        <View className={styles.progressSection}>
          <View className={styles.progressHeader}>
            <Text className={styles.progressTitle}>面试进度</Text>
            <Text className={styles.progressText}>
              {currentIndex + 1} / {questions.length}
            </Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </View>
          <View className={styles.questionNav}>
            {questions.map((q, i) => (
              <View
                key={q.id}
                className={classnames(
                  styles.navDot,
                  i === currentIndex && styles.active,
                  answeredQuestions.has(q.id) && i !== currentIndex && styles.answered
                )}
                onClick={() => handleQuestionClick(i)}
              >
                {i + 1}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.questionSection}>
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              isActive={i === currentIndex}
              onClick={() => handleQuestionClick(i)}
            />
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button
          className={classnames(styles.navButton, styles.prevBtn)}
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          上一题
        </Button>
        {currentIndex < questions.length - 1 ? (
          <Button
            className={classnames(styles.navButton, styles.nextBtn)}
            onClick={handleNext}
          >
            下一题
          </Button>
        ) : (
          <Button
            className={classnames(styles.navButton, styles.finishBtn)}
            onClick={handleFinish}
          >
            结束面试
          </Button>
        )}
      </View>
    </View>
  );
};

export default InterviewPage;
