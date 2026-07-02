export interface Goal {
  id: string;
  name: string;
  target: number;
  unit: string;
  startDate: string;
  weeklyProgress: WeekEntry[];
  notes: string;
  color: string;
}

export interface WeekEntry {
  weekNumber: number;
  percentage: number;
  skipped: boolean;
  completed: boolean;
  note: string;
}

export interface GoalTemplate {
  name: string;
  target: number;
  unit: string;
  icon: string;
}
