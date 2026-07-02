'use client';

import { useState, useEffect } from 'react';
import { Goal, WeekEntry, GoalTemplate } from '@/lib/types';
import {
  GOAL_TEMPLATES,
  calculateWeeklyTarget,
  calculateProgress,
  canSkipWeek,
  createGoalFromTemplate,
  saveGoals,
  loadGoals,
  TOTAL_WEEKS,
} from '@/lib/goals';

export default function GoalTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    const loaded = loadGoals();
    setGoals(loaded);
    if (loaded.length > 0 && !selectedGoal) {
      setSelectedGoal(loaded[0]);
    }
  }, []);

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  const filteredGoals = goals.filter((goal) =>
    goal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addGoal = (template: GoalTemplate) => {
    const newGoal = createGoalFromTemplate(template);
    setGoals([...goals, newGoal]);
    setSelectedGoal(newGoal);
    setShowAddModal(false);
  };

  const addWeek = (goalId: string, completed: boolean) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const nextWeek = goal.weeklyProgress.length + 1;
        if (nextWeek > TOTAL_WEEKS) return goal;
        const newEntry: WeekEntry = {
          weekNumber: nextWeek,
          percentage: calculateWeeklyTarget(nextWeek),
          skipped: false,
          completed,
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

  const updateNote = (goalId: string, note: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        return { ...goal, notes: note };
      })
    );
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    if (selectedGoal?.id === goalId) {
      setSelectedGoal(goals.length > 1 ? goals[0] : null);
    }
  };

  const resetGoal = (goalId: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;
        const updated = { ...goal, weeklyProgress: [] };
        if (selectedGoal?.id === goalId) setSelectedGoal(updated);
        return updated;
      })
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Goal Tracker
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHelp(true)}
                className="rounded border border-black px-3 py-1.5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
              >
                Help
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                + Add Goal
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-black px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          />
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Your Goals
          </h2>
          {filteredGoals.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">No goals yet. Click + Add Goal to start.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredGoals.map((goal) => {
                const progress = calculateProgress(goal);
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal)}
                    className={`rounded border p-4 text-left transition-all ${
                      selectedGoal?.id === goal.id
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-xs">
                        Week {progress.currentWeek}/{TOTAL_WEEKS}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          selectedGoal?.id === goal.id ? 'bg-white' : 'bg-black'
                        }`}
                        style={{ width: `${progress.overallProgress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs opacity-70">
                      <span>{progress.currentPercentage}% target</span>
                      <span>{Math.round(progress.overallProgress)}% done</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedGoal && (
          <GoalDetail
            goal={selectedGoal}
            onAddWeek={() => addWeek(selectedGoal.id, true)}
            onSkipWeek={() => skipWeek(selectedGoal.id)}
            onDelete={() => deleteGoal(selectedGoal.id)}
            onReset={() => resetGoal(selectedGoal.id)}
            onToggleComplete={(weekNum) => {
              setGoals((prev) =>
                prev.map((g) => {
                  if (g.id !== selectedGoal.id) return g;
                  const updated = {
                    ...g,
                    weeklyProgress: g.weeklyProgress.map((w) =>
                      w.weekNumber === weekNum
                        ? { ...w, completed: !w.completed }
                        : w
                    ),
                  };
                  setSelectedGoal(updated);
                  return updated;
                })
              );
            }}
            onUpdateNote={(note) => updateNote(selectedGoal.id, note)}
            onShowNotes={() => setShowNotes(true)}
          />
        )}
      </div>

      {showAddModal && (
        <AddGoalModal
          templates={GOAL_TEMPLATES}
          onAdd={addGoal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showNotes && selectedGoal && (
        <NotesModal
          goal={selectedGoal}
          onUpdateNote={(note) => updateNote(selectedGoal.id, note)}
          onClose={() => setShowNotes(false)}
        />
      )}
    </div>
  );
}

function GoalDetail({
  goal,
  onAddWeek,
  onSkipWeek,
  onDelete,
  onReset,
  onToggleComplete,
  onUpdateNote,
  onShowNotes,
}: {
  goal: Goal;
  onAddWeek: () => void;
  onSkipWeek: () => void;
  onDelete: () => void;
  onReset: () => void;
  onToggleComplete: (weekNum: number) => void;
  onUpdateNote: (note: string) => void;
  onShowNotes: () => void;
}) {
  const progress = calculateProgress(goal);
  const canSkip = canSkipWeek(goal);
  const isComplete = progress.currentWeek >= TOTAL_WEEKS;

  return (
    <div className="rounded border border-black p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold sm:text-xl">{goal.name}</h3>
          <p className="text-sm text-gray-500">
            Target: {goal.target.toLocaleString()} {goal.unit}/day
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onShowNotes}
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:border-black"
          >
            Notes
          </button>
          <button
            onClick={onReset}
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:border-black"
          >
            Reset
          </button>
          <button
            onClick={onDelete}
            className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:border-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox
          label="Current Week"
          value={`${progress.currentWeek}/${TOTAL_WEEKS}`}
        />
        <StatBox
          label="Target %"
          value={`${progress.currentPercentage}%`}
        />
        <StatBox
          label="Skips Used"
          value={`${progress.totalSkips}/12`}
        />
        <StatBox
          label="Daily Target"
          value={`${progress.dailyTarget.toLocaleString()}`}
        />
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Overall Progress</span>
          <span>{Math.round(progress.overallProgress)}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-black transition-all"
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Weekly Target Progress</span>
          <span>{progress.currentPercentage}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-400 transition-all"
            style={{ width: `${progress.currentPercentage}%` }}
          />
        </div>
      </div>

      {!isComplete && (
        <div className="mb-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onAddWeek}
            className="flex-1 rounded bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            ✓ Complete Week {progress.currentWeek + 1}
          </button>
          <button
            onClick={onSkipWeek}
            disabled={!canSkip}
            className={`flex-1 rounded border px-4 py-2.5 text-sm font-medium transition-colors ${
              canSkip
                ? 'border-black hover:bg-gray-100'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Skip Week {progress.currentWeek + 1}
          </button>
        </div>
      )}

      {isComplete && (
        <div className="mb-6 rounded bg-black p-4 text-center text-white">
          <p className="font-bold">Congratulations!</p>
          <p className="text-sm">You have completed all 52 weeks!</p>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-sm font-semibold">Week History</h4>
        {goal.weeklyProgress.length === 0 ? (
          <p className="text-sm text-gray-500">No weeks recorded yet.</p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8 md:grid-cols-13">
            {goal.weeklyProgress.map((week) => (
              <button
                key={week.weekNumber}
                onClick={() => onToggleComplete(week.weekNumber)}
                className={`aspect-square rounded text-xs font-medium flex items-center justify-center transition-all ${
                  week.skipped
                    ? 'bg-gray-200 text-gray-500'
                    : week.completed
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
                title={`Week ${week.weekNumber}: ${week.percentage}%${week.skipped ? ' (Skipped)' : ''}`}
              >
                {week.weekNumber}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function AddGoalModal({
  templates,
  onAdd,
  onClose,
}: {
  templates: GoalTemplate[];
  onAdd: (template: GoalTemplate) => void;
  onClose: () => void;
}) {
  const [customName, setCustomName] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded border border-black bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Add New Goal</h3>
          <button onClick={onClose} className="text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="mb-4 space-y-2">
          {templates.map((template) => (
            <button
              key={template.name}
              onClick={() => {
                setSelectedTemplate(template.name);
                setCustomName(template.name);
                setCustomTarget(template.target.toString());
                setCustomUnit(template.unit);
              }}
              className={`flex w-full items-center gap-3 rounded border p-3 text-left transition-all ${
                selectedTemplate === template.name
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 hover:border-black'
              }`}
            >
              <span className="text-xl">{template.icon}</span>
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-xs opacity-70">
                  {template.target.toLocaleString()} {template.unit}/day
                </p>
              </div>
            </button>
          ))}
        </div>

        {selectedTemplate && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Goal name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full rounded border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Target"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="flex-1 rounded border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
              <input
                type="text"
                placeholder="Unit"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="flex-1 rounded border border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </div>
            <button
              onClick={() => {
                const template = templates.find((t) => t.name === selectedTemplate);
                if (template) {
                  onAdd({
                    ...template,
                    name: customName,
                    target: parseInt(customTarget) || template.target,
                    unit: customUnit,
                  });
                }
              }}
              className="w-full rounded bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Create Goal
            </button>
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
          <button onClick={onClose} className="text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <section>
            <h4 className="mb-1 font-semibold">The 2.5% Method</h4>
            <p className="text-gray-600">
              Start at just 2.5% of your daily target and increase by 2.5% each week.
              By week 40, you will reach 100% of your goal.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold">Example: 12,000 Steps Daily</h4>
            <ul className="list-disc pl-4 text-gray-600">
              <li>Week 1: 300 steps (2.5%)</li>
              <li>Week 2: 600 steps (5%)</li>
              <li>Week 3: 900 steps (7.5%)</li>
              <li>Week 4: 1,200 steps (10%)</li>
              <li>Week 20: 6,000 steps (50%)</li>
              <li>Week 40: 12,000 steps (100%)</li>
            </ul>
          </section>

          <section>
            <h4 className="mb-1 font-semibold">Skip Weeks</h4>
            <p className="text-gray-600">
              You can skip up to 1 week per month (12 per year). Use these for rest
              weeks, travel, or when life gets busy.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold">Tracking</h4>
            <p className="text-gray-600">
              Click the week number in the grid to toggle completion. Mark weeks as
              complete or incomplete as needed.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold">Search</h4>
            <p className="text-gray-600">
              Use the search bar to quickly find goals by name.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold">Notes</h4>
            <p className="text-gray-600">
              Add notes to any goal to track observations, motivation, or reminders.
            </p>
          </section>

          <section>
            <h4 className="mb-1 font-semibold">Data Storage</h4>
            <p className="text-gray-600">
              All data is stored locally in your browser. No data is sent to any
              server.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function NotesModal({
  goal,
  onUpdateNote,
  onClose,
}: {
  goal: Goal;
  onUpdateNote: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState(goal.notes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded border border-black bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Notes: {goal.name}</h3>
          <button onClick={onClose} className="text-2xl leading-none">
            ×
          </button>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add your notes, observations, or reminders here..."
          className="mb-4 h-48 w-full rounded border border-black p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 resize-none"
        />

        <div className="flex gap-2">
          <button
            onClick={() => {
              onUpdateNote(note);
              onClose();
            }}
            className="flex-1 rounded bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Save Notes
          </button>
          <button
            onClick={onClose}
            className="rounded border border-black px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
