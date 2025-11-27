# Civic Grid Governance Platform

## Overview

Civic Grid is a community governance platform that combines spatial interaction with democratic participation. Users place houses on a 500x500 grid and participate in governance through voting on laws and submitting proposals. The platform emphasizes civic engagement through a unique spatial mechanic where house placement creates a sense of place and community.

The application is built as a full-stack web application with a React frontend and Express backend, using PostgreSQL for data persistence and session-based authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI System**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling. The design follows Material Design principles with GOV.UK-inspired clarity for civic trust. Typography uses Inter for body text and Space Grotesk for headings.

**State Management**: TanStack Query (React Query) for server state management with optimistic updates. No global client state management library - component-level state via React hooks.

**Routing**: Wouter for lightweight client-side routing.

**Key Features**:
- Interactive canvas-based grid visualization with zoom and pan controls
- Real-time cooldown timer for house relocation (24-hour constraint)
- Law voting interface with upvote/downvote mechanics
- Suggestion submission form for community proposals
- Responsive layout with sidebar navigation for governance features

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**Session Management**: Express-session with MemoryStore for session persistence. Session-based authentication where users are identified by session IDs rather than traditional accounts.

**Data Access Layer**: Custom storage interface (`IStorage`) implemented with `DatabaseStorage` class, providing abstraction over database operations. This pattern allows for easy testing and potential migration to different storage backends.

**API Design**: RESTful endpoints organized by resource:
- `/api/houses` - Grid house placement and retrieval
- `/api/laws` - Law management and voting
- `/api/user/status` - User state and house ownership
- `/api/suggestions` - Community proposal submissions

**Key Constraints**:
- 24-hour cooldown period between house relocations enforced server-side
- One house per user on the 500x500 grid
- Coordinate uniqueness enforced at database level
- Users must have a placed house to vote or submit suggestions

### Data Storage

**Database**: PostgreSQL accessed via Neon serverless driver with WebSocket connections.

**ORM**: Drizzle ORM for type-safe database queries and schema management.

**Schema Design**:
- `users` - Session-based user records (no passwords)
- `houses` - One-to-one relationship with users, stores grid coordinates and movement timestamps
- `laws` - Published laws with title, description, full text, and status
- `votes` - Many-to-many relationship between users and laws
- `suggestions` - User-submitted proposals for community review

**Migrations**: Managed through Drizzle Kit with schema defined in TypeScript.

**Indexing**: Unique composite index on house coordinates (x, y) to prevent placement conflicts.

### External Dependencies

**UI Component Library**: Radix UI for accessible, unstyled primitives (dialogs, tooltips, dropdowns, etc.)

**Styling**: Tailwind CSS with custom theme configuration supporting light/dark modes

**Database**: 
- Neon PostgreSQL serverless database
- Connection pooling via `@neondatabase/serverless`
- WebSocket support for serverless environments

**Fonts**: Google Fonts (Inter, Space Grotesk, Fira Code) loaded from CDN

**Validation**: Zod for runtime type validation, integrated with Drizzle for schema validation

**Date Handling**: date-fns for date formatting and manipulation

**Development Tools**:
- Vite for fast development and optimized production builds
- esbuild for server bundling
- tsx for TypeScript execution in development
- Replit-specific plugins for runtime error handling and development banner