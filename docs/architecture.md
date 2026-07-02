# Architecture Document

## System Architecture

```
┌─────────────────────────────────────────┐
│              Client (Browser)            │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │         Next.js App             │   │
│  ├─────────────────────────────────┤   │
│  │  Pages:                         │   │
│  │  - / (Home - Goal Tracker)      │   │
│  │  - /help (Help Documentation)   │   │
│  ├─────────────────────────────────┤   │
│  │  Components:                    │   │
│  │  - GoalTracker (main)           │   │
│  │  - GoalDetail                   │   │
│  │  - AddGoalModal                 │   │
│  │  - HelpModal                    │   │
│  │  - NotesModal                   │   │
│  │  - StatBox                      │   │
│  ├─────────────────────────────────┤   │
│  │  Lib:                           │   │
│  │  - goals.ts (business logic)    │   │
│  │  - types.ts (TypeScript types)  │   │
│  ├─────────────────────────────────┤   │
│  │  Storage:                       │   │
│  │  - localStorage (browser)       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.10 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Storage | localStorage | - |
| Deployment | Vercel | - |

## Data Model

### Goal
```typescript
{
  id: string;
  name: string;
  target: number;
  unit: string;
  startDate: string;
  weeklyProgress: WeekEntry[];
  notes: string;
  color: string;
}
```

### WeekEntry
```typescript
{
  weekNumber: number;
  percentage: number;
  skipped: boolean;
  completed: boolean;
  note: string;
}
```

## Business Logic

### Weekly Calculation
```
weekPercentage = weekNumber × 2.5%
dailyTarget = (goal.target × weekPercentage) / 100
```

### Skip Rules
```
skipsThisMonth ≤ 1
totalSkips ≤ 12
```

## State Management

- React useState for local state
- useEffect for localStorage sync
- Props drilling for component communication

## File Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── help/
│       └── page.tsx
├── components/
│   └── GoalTracker.tsx
└── lib/
    ├── goals.ts
    └── types.ts
```

## Deployment

- Build: `npm run build`
- Deploy: Vercel auto-deploy from GitHub
- Environment: Serverless functions (unused)
- CDN: Vercel Edge Network

## Security

- No server-side storage
- No authentication required
- No sensitive data collection
- Client-side only
