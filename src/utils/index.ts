export const formatDate = (dateStr: string, format: string = 'YYYY-MM-DD'): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待面试',
    interviewing: '面试中',
    scoring: '评分中',
    completed: '已完成',
    passed: '已通过',
    rejected: '已拒绝',
    'in-progress': '进行中',
    preparing: '准备中'
  };
  return map[status] || status;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    pending: '#FF7D00',
    interviewing: '#1E5EFF',
    scoring: '#00B8D9',
    completed: '#00B42A',
    passed: '#00B42A',
    rejected: '#F53F3F',
    'in-progress': '#1E5EFF',
    preparing: '#86909C'
  };
  return map[status] || '#86909C';
};

export const getRecommendationText = (rec: string): string => {
  const map: Record<string, string> = {
    'strong-hire': '强烈推荐',
    'hire': '推荐录用',
    'borderline': '待定复核',
    'no-hire': '不予录用'
  };
  return map[rec] || rec;
};

export const getRecommendationColor = (rec: string): string => {
  const map: Record<string, string> = {
    'strong-hire': '#00B42A',
    'hire': '#00B8D9',
    'borderline': '#FF7D00',
    'no-hire': '#F53F3F'
  };
  return map[rec] || '#86909C';
};

export const getRecommendationBgColor = (rec: string): string => {
  const map: Record<string, string> = {
    'strong-hire': '#E8FFEA',
    'hire': '#E6FAFB',
    'borderline': '#FFF7E6',
    'no-hire': '#FFECE8'
  };
  return map[rec] || '#F2F3F5';
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

export const calculateOverallScore = (scores: Array<{ score: number; maxScore: number; weight?: number }>): number => {
  if (scores.length === 0) return 0;
  const totalWeight = scores.reduce((acc, s) => acc + (s.weight || 1), 0);
  const weightedSum = scores.reduce((acc, s) => acc + (s.score / s.maxScore) * 100 * (s.weight || 1), 0);
  return Math.round(weightedSum / totalWeight);
};

export const getSeverityColor = (severity: string): string => {
  const map: Record<string, string> = {
    high: '#F53F3F',
    medium: '#FF7D00',
    low: '#1E5EFF'
  };
  return map[severity] || '#86909C';
};
