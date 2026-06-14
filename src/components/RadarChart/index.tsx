import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ScoreDimension } from '@/types';
import { mockCompetencies } from '@/data/templates';

interface RadarChartProps {
  scores: ScoreDimension[];
  compareScores?: ScoreDimension[];
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ scores, compareScores, size = 480 }) => {
  const competencies = mockCompetencies;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 60;
  const sides = competencies.length;
  const angleStep = (Math.PI * 2) / sides;

  const getPoint = (index: number, value: number, maxValue: number = 10) => {
    const r = (value / maxValue) * radius;
    const angle = -Math.PI / 2 + index * angleStep;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  };

  const getLabelPoint = (index: number) => {
    const r = radius + 36;
    const angle = -Math.PI / 2 + index * angleStep;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  };

  const buildPolygon = (data: ScoreDimension[]) => {
    return competencies
      .map((comp, i) => {
        const scoreData = data.find(s => s.competencyId === comp.id);
        const score = scoreData?.score || 0;
        const max = scoreData?.maxScore || 10;
        const p = getPoint(i, score, max);
        return `${p.x},${p.y}`;
      })
      .join(' ');
  };

  const buildGridPolygon = (level: number) => {
    return competencies
      .map((_, i) => {
        const p = getPoint(i, level * 2, 10);
        return `${p.x},${p.y}`;
      })
      .join(' ');
  };

  return (
    <View className={styles.radarChart}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[1, 2, 3, 4, 5].map(level => (
          <polygon
            key={`grid-${level}`}
            points={buildGridPolygon(level)}
            fill="none"
            stroke="#E5E6EB"
            strokeWidth="1"
          />
        ))}

        {competencies.map((_, i) => {
          const p = getPoint(i, 10, 10);
          return (
            <line
              key={`axis-${i}`}
              x1={centerX}
              y1={centerY}
              x2={p.x}
              y2={p.y}
              stroke="#E5E6EB"
              strokeWidth="1"
            />
          );
        })}

        {compareScores && (
          <polygon
            points={buildPolygon(compareScores)}
            fill="rgba(0, 184, 217, 0.1)"
            stroke="#00B8D9"
            strokeWidth="2"
            strokeDasharray="6,4"
          />
        )}

        <polygon
          points={buildPolygon(scores)}
          fill="rgba(30, 94, 255, 0.2)"
          stroke="#1E5EFF"
          strokeWidth="2.5"
        />

        {competencies.map((comp, i) => {
          const scoreData = scores.find(s => s.competencyId === comp.id);
          const score = scoreData?.score || 0;
          const max = scoreData?.maxScore || 10;
          const p = getPoint(i, score, max);
          return (
            <circle
              key={`dot-${i}`}
              cx={p.x}
              cy={p.y}
              r="6"
              fill="#FFFFFF"
              stroke="#1E5EFF"
              strokeWidth="2.5"
            />
          );
        })}

        {competencies.map((comp, i) => {
          const p = getLabelPoint(i);
          const scoreData = scores.find(s => s.competencyId === comp.id);
          const score = scoreData?.score || 0;
          return (
            <g key={`label-${i}`}>
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                fill="#1D2129"
                fontSize="13"
                fontWeight="600"
              >
                {comp.name}
              </text>
              <text
                x={p.x}
                y={p.y + 14}
                textAnchor="middle"
                fill="#1E5EFF"
                fontSize="15"
                fontWeight="700"
              >
                {score}
              </text>
            </g>
          );
        })}
      </svg>

      {compareScores && (
        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.dotPrimary)} />
            <Text className={styles.legendText}>当前候选人</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.dotSecondary)} />
            <Text className={styles.legendText}>对比候选人</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default RadarChart;
