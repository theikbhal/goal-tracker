# UI/UX Design Document

## User Interface

### Layout Structure

```
┌─────────────────────────────────────┐
│ Header: [Logo] [Search] [Help] [+Add]│
├─────────────────────────────────────┤
│ Search Bar                          │
├─────────────────────────────────────┤
│ Goal Cards Grid                     │
│ ┌─────────┐ ┌─────────┐            │
│ │ Goal 1  │ │ Goal 2  │            │
│ └─────────┘ └─────────┘            │
├─────────────────────────────────────┤
│ Goal Detail                         │
│ ┌─────────────────────────────────┐ │
│ │ Stats: Week | Target | Skips   │ │
│ │ Progress Bar                    │ │
│ │ [Complete Week] [Skip Week]     │ │
│ │ Week Grid: 1 2 3 4 5 ... 52    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Mobile Layout

- Single column for goal cards
- Full-width detail card
- Stacked action buttons
- Compact week grid (4 columns)

### Desktop Layout

- Two-column goal cards
- Max-width container
- Wider week grid (13 columns)

## User Experience Flow

### 1. First Visit
- Empty state with clear CTA
- "No goals yet. Click + Add Goal to start."

### 2. Adding a Goal
- Click "+ Add Goal"
- Modal with templates
- Select template or customize
- Click "Create Goal"

### 3. Weekly Tracking
- View current week number
- See daily target
- Click "Complete Week" or "Skip Week"
- Week number appears in grid

### 4. Reviewing Progress
- Overall progress bar
- Weekly target progress
- Week grid with color coding
- Stats at a glance

### 5. Adding Notes
- Click "Notes" button
- Modal with textarea
- Save notes for future reference

## Interaction Patterns

### Buttons
- Primary: Black background, white text
- Secondary: Border only, hover fill
- Destructive: Red border/text

### Inputs
- Black border
- Focus ring with offset
- Clear placeholders

### Grid Items
- Click to toggle state
- Hover effect
- Clear visual states

## Responsive Breakpoints

- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md)
- Desktop: > 1024px (lg)

## Animation

- Subtle transitions (150ms)
- Progress bar animations
- Modal fade in/out
- No unnecessary motion
