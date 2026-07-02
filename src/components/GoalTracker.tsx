'use client';

import { useState, useEffect } from 'react';
import { Goal, WeekEntry, DayEntry, GoalTemplate } from '@/lib/types';
import {
  GOAL_TEMPLATES,
  calculateWeeklyTarget,
  calculateDailyTarget,
  calculatePlanNumber,
  calculatePercentExpected,
  calculateProgress,
  canSkipWeek,
  createGoalFromTemplate,
  saveGoals,
  loadGoals,
  deleteGoalFromSupabase,
  TOTAL_WEEKS,
  getDateRangeForWeek,
  getDateRangeForMonth,
  getDaysInWeek,
  getDaysInMonth,
  getDayOfWeek,
  getWeekNumberFromDate,
} from '@/lib/goals';

type ViewMode = 'day' | 'week' | 'month' | 'year';

export default function GoalTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('year');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);

  useEffect(() => {
    loadGoals().then((loaded) => {
      setGoals(loaded);
      if (loaded.length > 0 && !selectedGoal) {
        setSelectedGoal(loaded[0]);
      }
    });
  }, []);

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  const filteredGoals = goals.filter((goal) =>
    goal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addGoal = (template: GoalTemplate, startDate: string) => {
    const newGoal = createGoalFromTemplate(template, startDate);
    setGoals([...goals, newGoal]);
    setSelectedGoal(newGoal);
    setShowAddModal(false);
  };

  const updateGoalStartDate = (goalId: string, date: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        return { ...g, startDate: date };
      })
    );
  };

  const addWeek = (goalId: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const nextWeek = goal.weeklyProgress.length + 1;
        if (nextWeek > TOTAL_WEEKS) return goal;
        const newEntry: WeekEntry = {
          weekNumber: nextWeek,
          percentage: calculateWeeklyTarget(nextWeek),
          skipped: false,
          completed: true,
          note: '',
        };
        const updated = { ...goal, weeklyProgress: [...goal.weeklyProgress, newEntry] };
        if (selectedGoal?.id === goalId) setSelectedGoal(updated);
        return updated;
      })
    );
  };

  const skipWeek = (goalId: string) => {
    if (!selectedGoal || !canSkipWeek(selectedGoal)) return;
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const nextWeek = goal.weeklyProgress.length + 1;
        if (nextWeek > TOTAL_WEEKS) return goal;
        const newEntry: WeekEntry = {
          weekNumber: nextWeek,
          percentage: calculateWeeklyTarget(nextWeek),
          skipped: true,
          completed: false,
          note: 'Skipped',
        };
        const updated = { ...goal, weeklyProgress: [...goal.weeklyProgress, newEntry] };
        if (selectedGoal?.id === goalId) setSelectedGoal(updated);
        return updated;
      })
    );
  };

  const addOrUpdateDay = (goalId: string, date: string, actual: number, note: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const existing = goal.dailyProgress.find((d) => d.date === date);
        let newDaily: DayEntry[];
        if (existing) {
          newDaily = goal.dailyProgress.map((d) =>
            d.date === date ? { ...d, actual, note, completed: actual > 0 } : d
          );
        } else {
          newDaily = [...goal.dailyProgress, { date, actual, completed: actual > 0, note }];
        }
        const updated = { ...goal, dailyProgress: newDaily };
        if (selectedGoal?.id === goalId) setSelectedGoal(updated);
        return updated;
      })
    );
  };

  const updateWeekNote = (goalId: string, weekNum: number, note: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const updated = {
          ...goal,
          weeklyProgress: goal.weeklyProgress.map((w) =>
            w.weekNumber === weekNum ? { ...w, note } : w
          ),
        };
        if (selectedGoal?.id === goalId) setSelectedGoal(updated);
        return updated;
      })
    );
  };

  const updateMonthNote = (goalId: string, month: number, note: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const updated = {
          ...goal,
          monthNotes: { ...goal.monthNotes, [month]: note },
        };
        if (selectedGoal?.id === goalId) setSelectedGoal(updated);
        return updated;
      })
    );
  };

  const updateGoalNotes = (goalId: string, note: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        return { ...goal, notes: note };
      })
    );
  };

  const deleteGoal = async (goalId: string) => {
    await deleteGoalFromSupabase(goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    if (selectedGoal?.id === goalId) {
      setSelectedGoal(goals.length > 1 ? goals[0] : null);
    }
  };

  const resetGoal = (goalId: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const updated = { ...goal, weeklyProgress: [], dailyProgress: [], monthNotes: {} };
        if (selectedGoal?.id === goalId) setSelectedGoal(updated);
        return updated;
      })
    );
  };

  const exportData = () => {
    const data = JSON.stringify(goals, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goal-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) {
          await saveGoals(imported);
          setGoals(imported);
          if (imported.length > 0) setSelectedGoal(imported[0]);
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Goal Tracker</h1>
            <div className="flex gap-2">
              <button onClick={exportData} className="rounded border border-black px-3 py-1.5 text-sm font-medium hover:bg-black hover:text-white transition-colors">Export</button>
              <label className="cursor-pointer rounded border border-black px-3 py-1.5 text-sm font-medium hover:bg-black hover:text-white transition-colors">
                Import
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button onClick={() => setShowHelp(true)} className="rounded border border-black px-3 py-1.5 text-sm font-medium hover:bg-black hover:text-white transition-colors">Help</button>
              <button onClick={() => setShowAddModal(true)} className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">+ Add Goal</button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <input type="text" placeholder="Search goals..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded border border-black px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2" />
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Your Goals</h2>
          {filteredGoals.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">No goals yet. Click + Add Goal to start.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGoals.map((goal) => {
                const progress = calculateProgress(goal);
                return (
                  <button key={goal.id} onClick={() => setSelectedGoal(goal)} className={`rounded border p-4 text-left transition-all ${selectedGoal?.id === goal.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-xs">W{progress.currentWeek}/{TOTAL_WEEKS}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${selectedGoal?.id === goal.id ? 'bg-white' : 'bg-black'}`} style={{ width: `${progress.overallProgress}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-xs opacity-70">
                      <span>Start: {goal.startDate}</span>
                      <span>{Math.round(progress.overallProgress)}% done</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedGoal && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`rounded px-4 py-2 text-sm font-medium transition-colors ${viewMode === mode ? 'bg-black text-white' : 'border border-gray-200 hover:border-black'}`}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)} View
                </button>
              ))}
            </div>

            {viewMode === 'year' && <YearView goal={selectedGoal} selectedMonth={selectedMonth} onSelectMonth={(m) => { setViewMode('month'); setSelectedMonth(m); }} onAddWeek={addWeek} onSkipWeek={skipWeek} onDelete={() => deleteGoal(selectedGoal.id)} onReset={() => resetGoal(selectedGoal.id)} />}
            {viewMode === 'month' && <MonthView goal={selectedGoal} month={selectedMonth} onSelectWeek={(w) => { setViewMode('week'); setSelectedWeek(w); }} onBack={() => setViewMode('year')} onUpdateMonthNote={(note) => updateMonthNote(selectedGoal.id, selectedMonth, note)} />}
            {viewMode === 'week' && <WeekView goal={selectedGoal} weekNumber={selectedWeek} onSelectDay={(d) => { setViewMode('day'); setSelectedDate(d); }} onBack={() => setViewMode('month')} onUpdateWeekNote={(note) => updateWeekNote(selectedGoal.id, selectedWeek, note)} />}
            {viewMode === 'day' && <DayView goal={selectedGoal} date={selectedDate} onBack={() => setViewMode('week')} onAddDay={(actual, note) => addOrUpdateDay(selectedGoal.id, selectedDate, actual, note)} />}
          </>
        )}
      </div>

      {showAddModal && <AddGoalModal templates={GOAL_TEMPLATES} onAdd={addGoal} onClose={() => setShowAddModal(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

// ─── YEAR VIEW ────────────────────────────────────────────────────────
function YearView({ goal, selectedMonth, onSelectMonth, onAddWeek, onSkipWeek, onDelete, onReset }: {
  goal: Goal; selectedMonth: number; onSelectMonth: (m: number) => void;
  onAddWeek: (id: string) => void; onSkipWeek: (id: string) => void;
  onDelete: () => void; onReset: () => void;
}) {
  const progress = calculateProgress(goal);
  const canSkip = canSkipWeek(goal);
  const isComplete = progress.currentWeek >= TOTAL_WEEKS;

  return (
    <div className="rounded border border-black p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{goal.name}</h3>
          <p className="text-sm text-gray-500">Target: {goal.target.toLocaleString()} {goal.unit}/day</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onReset} className="rounded border border-gray-300 px-2 py-1 text-xs hover:border-black">Reset</button>
          <button onClick={onDelete} className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:border-red-600">Delete</button>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium">Start Date</label>
        <input type="date" value={goal.startDate} readOnly className="rounded border border-gray-300 px-3 py-1.5 text-sm" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatBox label="Week" value={`${progress.currentWeek}/${TOTAL_WEEKS}`} />
        <StatBox label="Target %" value={`${progress.currentPercentage}%`} />
        <StatBox label="Skips" value={`${progress.totalSkips}/12`} />
        <StatBox label="Daily Target" value={`${progress.dailyTarget.toLocaleString()}`} />
        <StatBox label="Days Tracked" value={`${progress.totalDaysTracked}`} />
      </div>

      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm"><span className="font-medium">Progress</span><span>{Math.round(progress.overallProgress)}%</span></div>
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-black transition-all" style={{ width: `${progress.overallProgress}%` }} />
        </div>
      </div>

      {!isComplete && (
        <div className="mb-6 flex flex-col gap-2 sm:flex-row">
          <button onClick={() => onAddWeek(goal.id)} className="flex-1 rounded bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">✓ Complete Week {progress.currentWeek + 1}</button>
          <button onClick={() => onSkipWeek(goal.id)} disabled={!canSkip} className={`flex-1 rounded border px-4 py-2.5 text-sm font-medium transition-colors ${canSkip ? 'border-black hover:bg-gray-100' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}>Skip Week {progress.currentWeek + 1}</button>
        </div>
      )}

      <h4 className="mb-3 text-sm font-semibold">Monthly Breakdown (M1–M12)</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 pr-2 font-semibold">Month</th>
              <th className="py-2 px-2 font-semibold">Dates</th>
              <th className="py-2 px-2 font-semibold">Plan %</th>
              <th className="py-2 px-2 font-semibold">Target</th>
              <th className="py-2 px-2 font-semibold">Done</th>
              <th className="py-2 px-2 font-semibold">Skip</th>
              <th className="py-2 pl-2 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const startWeek = (month - 1) * 4 + 1;
              const endWeek = Math.min(month * 4, TOTAL_WEEKS);
              const range = getDateRangeForMonth(goal.startDate, month);
              const monthWeeks = goal.weeklyProgress.filter((w) => w.weekNumber >= startWeek && w.weekNumber <= endWeek);
              const completedCount = monthWeeks.filter((w) => w.completed).length;
              const skippedCount = monthWeeks.filter((w) => w.skipped).length;
              const firstPct = calculateWeeklyTarget(startWeek);
              const lastPct = calculateWeeklyTarget(endWeek);
              const firstTarget = Math.round((goal.target * firstPct) / 100);
              const lastTarget = Math.round((goal.target * lastPct) / 100);
              const isCurrent = progress.currentWeek + 1 >= startWeek && progress.currentWeek + 1 <= endWeek;
              const note = goal.monthNotes[month] || '';

              return (
                <tr key={month} onClick={() => onSelectMonth(month)} className={`border-b border-gray-100 cursor-pointer transition-colors ${isCurrent ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50'}`}>
                  <td className="py-2 pr-2 font-mono text-xs">M{month}</td>
                  <td className="py-2 px-2 text-xs text-gray-500">{range.start} → {range.end}</td>
                  <td className="py-2 px-2 font-mono text-xs text-gray-600">{firstPct}%{firstPct !== lastPct ? `→${lastPct}%` : ''}</td>
                  <td className="py-2 px-2 font-mono text-xs">{firstTarget.toLocaleString()}{firstTarget !== lastTarget ? `→${lastTarget.toLocaleString()}` : ''}</td>
                  <td className="py-2 px-2 text-xs">{completedCount}/4</td>
                  <td className="py-2 px-2 text-xs">{skippedCount}</td>
                  <td className="py-2 pl-2 text-xs max-w-[140px] truncate text-gray-500">{note || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 rounded border border-dashed border-gray-300 p-3 text-xs text-gray-500">
        <p className="mb-1 font-semibold text-gray-700">How to use:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Click any month row to open Month view</li>
          <li><strong>Dates</strong> — Start/end dates for that month</li>
          <li><strong>Plan %</strong> — Expected target range</li>
          <li><strong>Done</strong> — Weeks completed out of 4</li>
          <li><strong>Skip</strong> — Rest weeks used (max 1/month)</li>
        </ul>
      </div>
    </div>
  );
}

// ─── MONTH VIEW ───────────────────────────────────────────────────────
function MonthView({ goal, month, onSelectWeek, onBack, onUpdateMonthNote }: {
  goal: Goal; month: number; onSelectWeek: (w: number) => void;
  onBack: () => void; onUpdateMonthNote: (note: string) => void;
}) {
  const range = getDateRangeForMonth(goal.startDate, month);
  const startWeek = (month - 1) * 4 + 1;
  const endWeek = Math.min(month * 4, TOTAL_WEEKS);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(goal.monthNotes[month] || '');

  return (
    <div className="rounded border border-black p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <button onClick={onBack} className="mb-2 text-xs text-gray-500 hover:text-black">← Back to Year</button>
          <h3 className="text-lg font-bold">Month {month} — {goal.name}</h3>
          <p className="text-sm text-gray-500">{range.start} → {range.end}</p>
        </div>
      </div>

      <div className="mb-4 rounded border border-gray-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold">Month Note</span>
          <button onClick={() => { setEditingNote(!editingNote); if (!editingNote) setNoteText(goal.monthNotes[month] || ''); }} className="text-xs text-gray-500 hover:text-black">{editingNote ? 'Cancel' : 'Edit'}</button>
        </div>
        {editingNote ? (
          <div className="flex gap-2">
            <input value={noteText} onChange={(e) => setNoteText(e.target.value)} className="flex-1 rounded border border-black px-2 py-1 text-sm" placeholder="Add month note..." />
            <button onClick={() => { onUpdateMonthNote(noteText); setEditingNote(false); }} className="rounded bg-black px-3 py-1 text-xs text-white">Save</button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">{goal.monthNotes[month] || 'No notes yet. Click Edit to add.'}</p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 pr-2 font-semibold">Week</th>
              <th className="py-2 px-2 font-semibold">Dates</th>
              <th className="py-2 px-2 font-semibold">Plan %</th>
              <th className="py-2 px-2 font-semibold">Target</th>
              <th className="py-2 px-2 font-semibold">Status</th>
              <th className="py-2 pl-2 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: endWeek - startWeek + 1 }, (_, i) => startWeek + i).map((weekNum) => {
              const wRange = getDateRangeForWeek(goal.startDate, weekNum);
              const entry = goal.weeklyProgress.find((w) => w.weekNumber === weekNum);
              const pct = calculateWeeklyTarget(weekNum);
              const target = Math.round((goal.target * pct) / 100);
              const isCurrent = weekNum === goal.weeklyProgress.length + 1;

              let status = 'Pending';
              let rowClass = '';
              if (entry?.skipped) { status = 'Skipped'; rowClass = 'bg-gray-50'; }
              else if (entry?.completed) { status = 'Done'; rowClass = 'bg-black text-white'; }
              else if (isCurrent) { status = '→ Current'; rowClass = 'bg-gray-50'; }

              return (
                <tr key={weekNum} onClick={() => onSelectWeek(weekNum)} className={`border-b border-gray-100 cursor-pointer transition-colors ${rowClass}`}>
                  <td className="py-2 pr-2 font-mono text-xs">W{weekNum}</td>
                  <td className="py-2 px-2 text-xs text-gray-500">{wRange.start} → {wRange.end}</td>
                  <td className="py-2 px-2 font-mono text-xs">{pct}%</td>
                  <td className="py-2 px-2 font-mono text-xs">{target.toLocaleString()}</td>
                  <td className="py-2 px-2 text-xs">{status}</td>
                  <td className="py-2 pl-2 text-xs max-w-[120px] truncate text-gray-500">{entry?.note || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 rounded border border-dashed border-gray-300 p-3 text-xs text-gray-500">
        <p className="mb-1 font-semibold text-gray-700">How to use:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Click any week row to open Week view with daily breakdown</li>
          <li><strong>Dates</strong> — Start/end dates for that week</li>
          <li><strong>Note</strong> — Add monthly observation via Edit button</li>
        </ul>
      </div>
    </div>
  );
}

// ─── WEEK VIEW ────────────────────────────────────────────────────────
function WeekView({ goal, weekNumber, onSelectDay, onBack, onUpdateWeekNote }: {
  goal: Goal; weekNumber: number; onSelectDay: (d: string) => void;
  onBack: () => void; onUpdateWeekNote: (note: string) => void;
}) {
  const range = getDateRangeForWeek(goal.startDate, weekNumber);
  const days = getDaysInWeek(goal.startDate, weekNumber);
  const pct = calculateWeeklyTarget(weekNumber);
  const target = calculateDailyTarget(goal, weekNumber);
  const entry = goal.weeklyProgress.find((w) => w.weekNumber === weekNumber);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(entry?.note || '');

  return (
    <div className="rounded border border-black p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <button onClick={onBack} className="mb-2 text-xs text-gray-500 hover:text-black">← Back to Month</button>
          <h3 className="text-lg font-bold">Week {weekNumber} — {goal.name}</h3>
          <p className="text-sm text-gray-500">{range.start} → {range.end} | Plan: {pct}% | Target: {target.toLocaleString()} {goal.unit}/day</p>
        </div>
      </div>

      <div className="mb-4 rounded border border-gray-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold">Week Note</span>
          <button onClick={() => { setEditingNote(!editingNote); if (!editingNote) setNoteText(entry?.note || ''); }} className="text-xs text-gray-500 hover:text-black">{editingNote ? 'Cancel' : 'Edit'}</button>
        </div>
        {editingNote ? (
          <div className="flex gap-2">
            <input value={noteText} onChange={(e) => setNoteText(e.target.value)} className="flex-1 rounded border border-black px-2 py-1 text-sm" placeholder="Add week note..." />
            <button onClick={() => { onUpdateWeekNote(noteText); setEditingNote(false); }} className="rounded bg-black px-3 py-1 text-xs text-white">Save</button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">{entry?.note || 'No notes yet. Click Edit to add.'}</p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 pr-2 font-semibold">Day</th>
              <th className="py-2 px-2 font-semibold">Date</th>
              <th className="py-2 px-2 font-semibold">Plan %</th>
              <th className="py-2 px-2 font-semibold">Plan #</th>
              <th className="py-2 px-2 font-semibold">Actual</th>
              <th className="py-2 pl-2 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {days.map((date) => {
              const dayEntry = goal.dailyProgress.find((d) => d.date === date);
              const dayOfWeek = getDayOfWeek(date);
              const isToday = date === new Date().toISOString().split('T')[0];

              return (
                <tr key={date} onClick={() => onSelectDay(date)} className={`border-b border-gray-100 cursor-pointer transition-colors ${dayEntry?.completed ? 'bg-black text-white' : isToday ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  <td className="py-2 pr-2 font-mono text-xs">{dayOfWeek}</td>
                  <td className="py-2 px-2 font-mono text-xs">{date}</td>
                  <td className="py-2 px-2 font-mono text-xs">{pct}%</td>
                  <td className="py-2 px-2 font-mono text-xs">{target.toLocaleString()}</td>
                  <td className="py-2 px-2 font-mono text-xs">{dayEntry ? dayEntry.actual.toLocaleString() : '—'}</td>
                  <td className="py-2 pl-2 text-xs max-w-[120px] truncate text-gray-500">{dayEntry?.note || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 rounded border border-dashed border-gray-300 p-3 text-xs text-gray-500">
        <p className="mb-1 font-semibold text-gray-700">How to use:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Click any day row to log actual count and add a note</li>
          <li><strong>Plan %</strong> — Expected percentage for this week</li>
          <li><strong>Plan #</strong> — Calculated daily target (target × plan %)</li>
          <li><strong>Actual</strong> — What you actually did that day</li>
        </ul>
      </div>
    </div>
  );
}

// ─── DAY VIEW ─────────────────────────────────────────────────────────
function DayView({ goal, date, onBack, onAddDay }: {
  goal: Goal; date: string; onBack: () => void;
  onAddDay: (actual: number, note: string) => void;
}) {
  const weekNum = getWeekNumberFromDate(goal.startDate, date);
  const pct = weekNum >= 1 ? calculateWeeklyTarget(weekNum) : 0;
  const planNum = calculatePlanNumber(goal, date);
  const dayEntry = goal.dailyProgress.find((d) => d.date === date);
  const [actual, setActual] = useState(dayEntry?.actual?.toString() || '');
  const [note, setNote] = useState(dayEntry?.note || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onAddDay(parseInt(actual) || 0, note);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <div className="rounded border border-black p-4 sm:p-6">
      <div className="mb-4">
        <button onClick={onBack} className="mb-2 text-xs text-gray-500 hover:text-black">← Back to Week</button>
        <h3 className="text-lg font-bold">{getDayOfWeek(date)}, {date} — {goal.name}</h3>
        <p className="text-sm text-gray-500">Week {weekNum} | Plan: {pct}% | Daily Target: {planNum.toLocaleString()} {goal.unit}</p>
        {isToday && <span className="mt-1 inline-block rounded bg-black px-2 py-0.5 text-xs text-white">Today</span>}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatBox label="Plan %" value={`${pct}%`} />
        <StatBox label="Plan #" value={planNum.toLocaleString()} />
        <StatBox label="Actual" value={dayEntry ? dayEntry.actual.toLocaleString() : '—'} />
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium">Actual {goal.unit} today</label>
          <input type="number" value={actual} onChange={(e) => setActual(e.target.value)} className="w-full rounded border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2" placeholder={`e.g. ${planNum}`} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 resize-none" placeholder="How did it go today?" />
        </div>
        <button onClick={handleSave} className="w-full rounded bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
          {saved ? '✓ Saved!' : 'Save Entry'}
        </button>
      </div>

      <div className="mt-4 rounded border border-dashed border-gray-300 p-3 text-xs text-gray-500">
        <p className="mb-1 font-semibold text-gray-700">How to use:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li><strong>Plan %</strong> — What percentage of your target is expected today</li>
          <li><strong>Plan #</strong> — The number you should aim for (target × plan %)</li>
          <li><strong>Actual</strong> — Enter what you actually did</li>
          <li><strong>Note</strong> — Track observations, feelings, or reminders</li>
        </ul>
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function AddGoalModal({ templates, onAdd, onClose }: {
  templates: GoalTemplate[]; onAdd: (t: GoalTemplate, startDate: string) => void; onClose: () => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded border border-black bg-white p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Add New Goal</h3>
          <button onClick={onClose} className="text-2xl leading-none">×</button>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2" />
        </div>

        <div className="mb-4 space-y-2">
          {templates.map((template) => (
            <button key={template.name} onClick={() => { setSelectedTemplate(template.name); setCustomName(template.name); setCustomTarget(template.target.toString()); setCustomUnit(template.unit); }} className={`flex w-full items-center gap-3 rounded border p-3 text-left transition-all ${selectedTemplate === template.name ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}>
              <span className="text-xl">{template.icon}</span>
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-xs opacity-70">{template.target.toLocaleString()} {template.unit}/day</p>
              </div>
            </button>
          ))}
        </div>

        {selectedTemplate && (
          <div className="space-y-3">
            <input type="text" placeholder="Goal name" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full rounded border border-black px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <input type="number" placeholder="Target" value={customTarget} onChange={(e) => setCustomTarget(e.target.value)} className="flex-1 rounded border border-black px-3 py-2 text-sm" />
              <input type="text" placeholder="Unit" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className="flex-1 rounded border border-black px-3 py-2 text-sm" />
            </div>
            <button onClick={() => { const t = templates.find((t) => t.name === selectedTemplate); if (t) onAdd({ ...t, name: customName, target: parseInt(customTarget) || t.target, unit: customUnit }, startDate); }} className="w-full rounded bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">Create Goal</button>
          </div>
        )}
      </div>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded border border-black bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">How It Works</h3>
          <button onClick={onClose} className="text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4 text-sm">
          <section>
            <h4 className="mb-1 font-semibold">Calendar Views</h4>
            <ul className="list-disc pl-4 text-gray-600 space-y-1">
              <li><strong>Year View</strong> — Overview of all 12 months, click a month to drill down</li>
              <li><strong>Month View</strong> — See weeks in that month, add month notes, click a week</li>
              <li><strong>Week View</strong> — Daily breakdown for the week, add week notes, click a day</li>
              <li><strong>Day View</strong> — Log actual count, add daily notes, compare plan vs actual</li>
            </ul>
          </section>
          <section>
            <h4 className="mb-1 font-semibold">2.5% Method</h4>
            <p className="text-gray-600">Start at 2.5% of your target, increase by 2.5% each week. By week 40, you reach 100%.</p>
          </section>
          <section>
            <h4 className="mb-1 font-semibold">Notes at Every Level</h4>
            <ul className="list-disc pl-4 text-gray-600 space-y-1">
              <li><strong>Day</strong> — Log observations in Day view</li>
              <li><strong>Week</strong> — Add week summary in Week view</li>
              <li><strong>Month</strong> — Add month note in Month view</li>
            </ul>
          </section>
          <section>
            <h4 className="mb-1 font-semibold">Data Storage</h4>
            <p className="text-gray-600">Data is stored in Supabase cloud. Falls back to localStorage if offline.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
