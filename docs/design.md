# Design Document

## Overview

The Goal Tracker uses a minimalistic black-and-white design language to focus attention on the content and progress.

## Design Principles

### 1. Minimalism
- Black and white color palette only
- No unnecessary decorations
- Clean typography with clear hierarchy

### 2. Progressive Disclosure
- Show essential info first
- Details available on demand
- Modal dialogs for complex actions

### 3. Mobile-First
- Responsive grid system
- Touch-friendly buttons
- Readable on all screen sizes

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Background | #FFFFFF | Main background |
| Foreground | #000000 | Text, borders |
| Muted | #6B7280 | Secondary text |
| Light | #F3F4F6 | Subtle backgrounds |

## Typography

- **Headers**: Bold, tracking tight
- **Body**: Regular weight, good line height
- **Labels**: Small, uppercase, muted

## Layout

### Header
- Fixed width container
- Logo/title left
- Actions right

### Main Content
- Max-width container (4xl)
- Responsive padding
- Clear sections

### Goal Cards
- Grid layout (2 columns on mobile)
- Selected state with black background
- Progress bar at bottom

### Goal Detail
- Full-width card
- Stats grid (2x2 on mobile, 4 columns on desktop)
- Action buttons
- Week grid visualization

## Components

### StatBox
- Rounded border
- Label + value
- Consistent padding

### Week Grid
- 4 columns mobile, 8 tablet, 13 desktop
- Square cells
- Color states: complete (black), skipped (gray), incomplete (light)

### Modals
- Centered on screen
- Black overlay
- White card with border
- Close button top-right

## Accessibility

- High contrast (black on white)
- Focus states on interactive elements
- Semantic HTML structure
- Keyboard navigable
