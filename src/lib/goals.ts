import { Goal, WeekEntry, DayEntry, GoalTemplate } from './types';
import { supabase } from './supabase';

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

export function calculateDailyTarget(goal: Goal, weekNumber: number): number {
  const percentage = calculateWeeklyTarget(weekNumber);
  return Math.round((goal.target * percentage) / 100);
}

export function calculatePlanNumber(goal: Goal, date: string): number {
  const weekNum = getWeekNumberFromDate(goal.startDate, date);
  if (weekNum < 1) return 0;
  return calculateDailyTarget(goal, weekNum);
}

export function calculatePercentExpected(goal: Goal, date: string): number {
  const weekNum = getWeekNumberFromDate(goal.startDate, date);
  if (weekNum < 1) return 0;
  return calculateWeeklyTarget(weekNum);
}

export function getWeekNumberFromDate(startDate: string, date: string): number {
  const start = new Date(startDate);
  const current = new Date(date);
  const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

export function getDateRangeForWeek(startDate: string, weekNumber: number): { start: string; end: string } {
  const start = new Date(startDate);
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (weekNumber - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
  };
}

export function getDateRangeForMonth(startDate: string, month: number): { start: string; end: string } {
  const weekStart = (month - 1) * 4 + 1;
  const weekEnd = Math.min(month * 4, TOTAL_WEEKS);
  const start = getDateRangeForWeek(startDate, weekStart).start;
  const end = getDateRangeForWeek(startDate, weekEnd).end;
  return { start, end };
}

export function getDaysInMonth(startDate: string, month: number): string[] {
  const range = getDateRangeForMonth(startDate, month);
  const days: string[] = [];
  const current = new Date(range.start);
  const end = new Date(range.end);
  while (current <= end) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function getDaysInWeek(startDate: string, weekNumber: number): string[] {
  const range = getDateRangeForWeek(startDate, weekNumber);
  const days: string[] = [];
  const current = new Date(range.start);
  const end = new Date(range.end);
  while (current <= end) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function getDayOfWeek(date: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(date).getDay()];
}

export function calculateProgress(goal: Goal): {
  currentWeek: number;
  currentPercentage: number;
  totalSkips: number;
  overallProgress: number;
  dailyTarget: number;
  isOnTrack: boolean;
  totalDaysTracked: number;
  totalActual: number;
} {
  const currentWeek = goal.weeklyProgress.length;
  const currentPercentage = calculateWeeklyTarget(currentWeek);
  const totalSkips = goal.weeklyProgress.filter((w) => w.skipped).length;
  const completedWeeks = goal.weeklyProgress.filter((w) => w.completed).length;
  const overallProgress = (completedWeeks / TOTAL_WEEKS) * 100;
  const dailyTarget = calculateDailyTarget(goal, currentWeek);
  const isOnTrack = currentPercentage >= overallProgress;
  const totalDaysTracked = goal.dailyProgress.length;
  const totalActual = goal.dailyProgress.reduce((sum, d) => sum + d.actual, 0);

  return {
    currentWeek,
    currentPercentage,
    totalSkips,
    overallProgress,
    dailyTarget,
    isOnTrack,
    totalDaysTracked,
    totalActual,
  };
}

export function canSkipWeek(goal: Goal): boolean {
  const currentWeek = goal.weeklyProgress.length;
  const currentMonth = Math.floor((currentWeek) / 4);
  const skipsThisMonth = goal.weeklyProgress
    .slice(currentMonth * 4, (currentMonth + 1) * 4)
    .filter((w) => w.skipped).length;
  const totalSkips = goal.weeklyProgress.filter((w) => w.skipped).length;
  return skipsThisMonth < MAX_SKIPS_PER_MONTH && totalSkips < MAX_SKIPS_PER_YEAR;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function createGoalFromTemplate(template: GoalTemplate, startDate?: string): Goal {
  return {
    id: generateId(),
    name: template.name,
    target: template.target,
    unit: template.unit,
    startDate: startDate || new Date().toISOString().split('T')[0],
    weeklyProgress: [],
    dailyProgress: [],
    monthNotes: {},
    notes: '',
  };
}

// Supabase storage
export async function saveGoals(goals: Goal[]): Promise<void> {
  try {
    for (const goal of goals) {
      const { error } = await supabase
        .from('goals')
        .upsert({
          id: goal.id,
          name: goal.name,
          target: goal.target,
          unit: goal.unit,
          start_date: goal.startDate,
          weekly_progress: goal.weeklyProgress,
          daily_progress: goal.dailyProgress,
          month_notes: goal.monthNotes,
          notes: goal.notes,
        }, { onConflict: 'id' });
      if (error) throw error;
    }
  } catch (e) {
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('goal-tracker-goals', JSON.stringify(goals));
    }
  }
}

export async function loadGoals(): Promise<Goal[]> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        target: row.target,
        unit: row.unit,
        startDate: row.start_date,
        weeklyProgress: row.weekly_progress || [],
        dailyProgress: row.daily_progress || [],
        monthNotes: row.month_notes || {},
        notes: row.notes || '',
      }));
    }
  } catch (e) {
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('goal-tracker-goals');
      if (stored) return JSON.parse(stored);
    }
  }
  return [];
}

export async function deleteGoalFromSupabase(goalId: string): Promise<void> {
  try {
    await supabase.from('goals').delete().eq('id', goalId);
  } catch (e) {
    // silent
  }
}
