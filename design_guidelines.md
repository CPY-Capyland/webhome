# Design Guidelines: Civic Grid Governance Platform

## Design Approach

**System Selected**: Material Design principles with GOV.UK-inspired clarity for civic trust and usability.

**Core Philosophy**: Create a professional, authoritative governance platform that balances the playfulness of the spatial grid mechanic with the seriousness of civic participation. Emphasize clarity, accessibility, and functional hierarchy.

## Typography System

**Font Stack**: 
- Primary: Inter (Google Fonts) - body text, UI elements
- Headings: Space Grotesk (Google Fonts) - distinctive for laws and announcements

**Hierarchy**:
- Page Headers: text-4xl font-bold (Space Grotesk)
- Section Headers: text-2xl font-semibold (Space Grotesk)
- Law Titles: text-xl font-semibold
- Body Text: text-base leading-relaxed
- Metadata/Stats: text-sm font-medium
- Grid Coordinates: text-xs font-mono

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, and 16 for consistent rhythm.

**Application Structure**:
- Fixed top navigation bar (h-16)
- Two-panel layout: Left sidebar (w-80) for governance, Right panel (flex-1) for grid canvas
- On mobile: Stack vertically with tab navigation

## Component Library

### Navigation Bar
- Full-width header with app branding
- User profile with house placement status indicator
- Relocation timer countdown badge (when active)
- Quick stats: Total houses placed, Active laws

### Grid Canvas (Primary Feature)
- Interactive 500x500 grid occupying main viewport
- Zoom controls (floating bottom-right): zoom in/out buttons, reset view button
- Minimap overview (bottom-left corner, 120x120px) showing full grid with current viewport highlighted
- Grid cells with subtle borders, houses rendered as simple geometric icons
- Coordinate display on hover
- Empty space highlighting on click (when placement available)
- User's house highlighted with distinct border treatment

### Governance Sidebar

**Published Laws Section**:
- Scrollable list of law cards (mb-4 spacing)
- Each card contains:
  - Law title (font-semibold)
  - Publication date and status badge
  - Brief description (max 2 lines, truncated)
  - Vote counts with upvote/downvote buttons
  - User's vote indicator (if voted)
- Expand button for full law text in modal

**Suggestion Submission**:
- Collapsible form section
- Text area for proposal (min-h-32)
- Character count indicator
- Submit button with confirmation state

### House Placement Modal
- Grid coordinate confirmation
- Placement button
- Cooldown warning if applicable
- Success state with confetti micro-animation

### Law Detail Modal
- Full law text in readable width (max-w-2xl)
- Voting interface with current tallies
- Publication metadata
- Discussion count (future feature placeholder)

## Grid Visualization Specifications

**Grid Rendering**:
- Canvas-based rendering for performance
- 500x500 cells at base zoom level
- Houses represented as 16x16px icons at 100% zoom
- Vacant cells: subtle stroke, no fill
- Occupied cells: house icon centered
- Highlighted vacant space: animated pulse border

**Pan & Zoom**:
- Mousewheel zoom (5 zoom levels: 25%, 50%, 100%, 200%, 400%)
- Click-drag pan
- Double-click to center on location
- Touch gestures supported on mobile

## Icons & Assets

**Icon Library**: Heroicons (outline style)
- Home icon for houses
- Clock icon for cooldown timer
- Document icon for laws
- Arrow-up/down for voting
- Plus icon for suggestions
- Magnifying glass for zoom

**Images**: None required - this is a functional app interface, not a marketing site.

## Interaction Patterns

**Voting**: Single-click toggle between upvote/downvote/neutral with immediate visual feedback and vote count update

**Grid Interaction**: Click empty cell → Highlight → Confirmation modal → Place house with success animation

**Cooldown Display**: Countdown timer in header updates every second, shows days/hours/minutes remaining

**Suggestion Flow**: Expand form → Type → Character validation → Submit → Success toast notification

## Accessibility Standards

- All grid cells keyboard navigable (arrow keys)
- Law voting accessible via keyboard (Tab + Space/Enter)
- Screen reader announcements for vote changes
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- Minimum touch target size: 44x44px

## Responsive Breakpoints

- Mobile (< 768px): Single column, grid canvas full-width, governance in bottom sheet
- Tablet (768px - 1024px): Sidebar at w-64, adjusted grid canvas
- Desktop (> 1024px): Full two-panel layout as described

This design creates a unique civic platform where the spatial grid mechanic feels integrated with serious governance participation, balancing playfulness with authority.