import { Goal, WeekEntry, GoalTemplate } from './types';

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { name: 'Zikir Daily', target: 12000, unit: 'count', icon: '🕌' },
  { name: 'Steps Daily', target: 12000, unit: 'steps', icon: '🚶' },
  { name: 'YT Shorts Review', target: 1200, unit: 'videos', icon: '📺' },
  { name: 'Reading', target: 50, unit: 'pages', icon: '📖' },
  { name: 'Exercise', target: 30, unit: 'minutes', icon: '💪' },
  { name: 'Custom Goal', target: 100, unit: 'units', icon: '🎯' },
];

export const TOTAL_WEEKS = 52;
export const WEEKLY_INCREMENT = 2.5;
export const MAX_SKIPS_PER_MONTH = 1;
export const MAX_SKIPS_PER_YEAR = 12;
export const TARGET_PERCENTAGE = 100;

export function calculateWeeklyTarget(weekNumber: number): number {
  return Math.min(weekNumber * WEEKLY_INCREMENT, TARGET_PERCENTAGE);
}

export function calculateDailyTarget(
  goal: Goal,
  weekNumber: number
): number {
  const percentage = calculateWeeklyTarget(weekNumber);
  return Math.round((goal.target * percentage) / 100);
}

export function calculateProgress(goal: Goal): {
  currentWeek: number;
  currentPercentage: number;
  totalSkips: number;
  overallProgress: number;
  dailyTarget: number;
  isOnTrack: boolean;
} {
  const currentWeek = goal.weeklyProgress.length;
  const currentPercentage = calculateWeeklyTarget(currentWeek);
  const totalSkips = goal.weeklyProgress.filter((w) => w.skipped).length;
  const completedWeeks = goal.weeklyProgress.filter((w) => w.completed).length;
  const overallProgress = (completedWeeks / TOTAL_WEEKS) * 100;
  const dailyTarget = calculateDailyTarget(goal, currentWeek);
  const isOnTrack = currentPercentage >= overallProgress;

  return {
    currentWeek,
    currentPercentage,
    totalSkips,
    overallProgress,
    dailyTarget,
    isOnTrack,
  };
}

export function canSkipWeek(goal: Goal): boolean {
  const currentMonth = Math.floor(goal.weeklyProgress.length / 4);
  const skipsThisMonth = goal.weeklyProgress
    .slice(currentMonth * 4, (currentMonth + 1) * 4)
    .filter((w) => w.skipped).length;
  const totalSkips = goal.weeklyProgress.filter((w) => w.skipped).length;

  return skipsThisMonth < MAX_SKIPS_PER_MONTH && totalSkips < MAX_SKIPS_PER_YEAR;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function createGoalFromTemplate(
  template: GoalTemplate,
  startDate?: string
): Goal {
  return {
    id: generateId(),
    name: template.name,
    target: template.target,
    unit: template.unit,
    startDate: startDate || new Date().toISOString().split('T')[0],
    weeklyProgress: [],
    notes: '',
    color: '#000000',
  };
}

export function saveGoals(goals: Goal[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('goal-tracker-goals', JSON.stringify(goals));
  }
}

export function loadGoals(): Goal[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('goal-tracker-goals');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
}
