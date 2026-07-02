'use client';

import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">Help & Documentation</h1>
            <Link
              href="/"
              className="rounded border border-black px-3 py-1.5 text-sm font-medium hover:bg-black hover:text-white transition-colors"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-bold">The 2.5% Method</h2>
            <p className="mb-3 text-gray-600">
              The 2.5% Method is a gradual growth approach that starts you at just 2.5% of your
              daily target and increases by 2.5% each week. This makes even the most ambitious
              goals achievable.
            </p>
            <div className="rounded border border-gray-200 p-4">
              <h3 className="mb-2 font-semibold">How It Works</h3>
              <ol className="list-decimal pl-4 space-y-1 text-sm text-gray-600">
                <li>Choose your daily target (e.g., 12,000 steps)</li>
                <li>Week 1: Start at 2.5% = 300 steps</li>
                <li>Week 2: Increase to 5% = 600 steps</li>
                <li>Week 3: Increase to 7.5% = 900 steps</li>
                <li>Continue weekly until Week 40: 100% = 12,000 steps</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Skip Weeks</h2>
            <p className="mb-3 text-gray-600">
              Life happens. You are allowed to skip up to 1 week per month (12 weeks per year).
              These skips are built into the system so you can rest, travel, or handle unexpected events.
            </p>
            <div className="rounded border border-gray-200 p-4">
              <h3 className="mb-2 font-semibold">Skip Rules</h3>
              <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600">
                <li>Maximum 1 skip per month</li>
                <li>Maximum 12 skips per year</li>
                <li>Skipped weeks still count toward your week number</li>
                <li>Use the Skip button when you need a break</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Examples</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded border border-gray-200 p-4">
                <h3 className="mb-2 font-semibold">🕌 Zikir Daily</h3>
                <p className="text-sm text-gray-600">Target: 12,000 count/day</p>
                <p className="text-sm text-gray-600">Week 1: 300 count</p>
                <p className="text-sm text-gray-600">Week 20: 6,000 count</p>
                <p className="text-sm text-gray-600">Week 40: 12,000 count</p>
              </div>
              <div className="rounded border border-gray-200 p-4">
                <h3 className="mb-2 font-semibold">🚶 Steps Daily</h3>
                <p className="text-sm text-gray-600">Target: 12,000 steps/day</p>
                <p className="text-sm text-gray-600">Week 1: 300 steps</p>
                <p className="text-sm text-gray-600">Week 20: 6,000 steps</p>
                <p className="text-sm text-gray-600">Week 40: 12,000 steps</p>
              </div>
              <div className="rounded border border-gray-200 p-4">
                <h3 className="mb-2 font-semibold">📺 YT Shorts Review</h3>
                <p className="text-sm text-gray-600">Target: 1,200 videos/day</p>
                <p className="text-sm text-gray-600">Week 1: 30 videos</p>
                <p className="text-sm text-gray-600">Week 20: 600 videos</p>
                <p className="text-sm text-gray-600">Week 40: 1,200 videos</p>
              </div>
              <div className="rounded border border-gray-200 p-4">
                <h3 className="mb-2 font-semibold">📖 Reading</h3>
                <p className="text-sm text-gray-600">Target: 50 pages/day</p>
                <p className="text-sm text-gray-600">Week 1: 2 pages</p>
                <p className="text-sm text-gray-600">Week 20: 25 pages</p>
                <p className="text-sm text-gray-600">Week 40: 50 pages</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Features</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-gray-200 p-4">
                <h3 className="mb-1 font-semibold">Search</h3>
                <p className="text-sm text-gray-600">Quickly find goals by name using the search bar.</p>
              </div>
              <div className="rounded border border-gray-200 p-4">
                <h3 className="mb-1 font-semibold">Notes</h3>
                <p className="text-sm text-gray-600">Add notes to any goal to track observations.</p>
              </div>
              <div className="rounded border border-gray-200 p-4">
                <h3 className="mb-1 font-semibold">Week Grid</h3>
                <p className="text-sm text-gray-600">Visual grid showing all 52 weeks of progress.</p>
              </div>
              <div className="rounded border border-gray-200 p-4">
                <h3 className="mb-1 font-semibold">Local Storage</h3>
                <p className="text-sm text-gray-600">All data stays in your browser. No servers.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Keyboard Shortcuts</h2>
            <div className="rounded border border-gray-200 p-4">
              <p className="text-sm text-gray-600">
                Use the search bar with <kbd className="rounded border border-gray-300 px-1.5 py-0.5 text-xs font-mono">/</kbd> to focus it quickly.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
