# EduLearn - Learning Management System

## Overview

EduLearn is a comprehensive Learning Management System (LMS) built to facilitate online education. The platform supports two primary user roles: Teachers and Students. Teachers can create courses, manage assignments, upload materials, and grade student submissions. Students can browse and enroll in courses, submit assignments, view grades, and participate in course discussions. The system implements real-time notifications via WebSocket connections to keep users informed of important updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript
- **Routing**: Wouter (lightweight routing library)
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens

**Design Philosophy**: Utility-first approach inspired by Canvas LMS, Notion, and Linear. The design emphasizes clarity and information density without overwhelming users. The system implements both light and dark themes with carefully curated color palettes for educational contexts.

**Key Frontend Decisions**:
- Component-based architecture with reusable UI primitives
- Protected routes requiring authentication
- Role-based rendering (separate dashboards for teachers and students)
- Real-time updates through WebSocket integration
- Toast notifications for user feedback

### Backend Architecture

**Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints organized by resource
- **Session Management**: express-session with PostgreSQL session store (connect-pg-simple)
- **Real-time Communication**: WebSocket server for notifications
- **Authentication**: Session-based authentication with bcrypt password hashing

**API Structure**:
- `/api/auth/*` - Authentication endpoints (login, register, logout)
- `/api/courses/*` - Course management
- `/api/enrollments/*` - Student course enrollments
- `/api/assignments/*` - Assignment creation and retrieval
- `/api/submissions/*` - Student assignment submissions
- `/api/grades/*` - Grading functionality
- `/api/discussions/*` - Course discussion forums
- `/api/materials/*` - Course material uploads
- `/api/notifications/*` - Notification management

**Authorization Strategy**: Middleware-based role checking (requireAuth, requireRole) ensures proper access control for teacher and student-specific endpoints.

### Data Storage

**Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migration Strategy**: Schema-first approach with drizzle-kit

**Database Schema Design**:
- **users**: Stores user accounts with role differentiation (student/teacher)
- **courses**: Teacher-created courses with metadata
- **enrollments**: Many-to-many relationship between students and courses
- **assignments**: Course-specific assignments with due dates
- **submissions**: Student assignment submissions linked to assignments
- **grades**: Grading records with feedback
- **discussions**: Course discussion forum posts
- **materials**: Uploaded course materials (PDFs, presentations, etc.)
- **notifications**: User notifications for system events

**Relationship Model**: The schema uses foreign key constraints with cascade deletion to maintain referential integrity. UUIDs are used as primary keys for all entities.

### Authentication & Authorization

**Authentication Mechanism**: Session-based authentication using express-session
- Sessions stored in PostgreSQL for persistence
- Password hashing with bcrypt (6 rounds)
- Session data includes userId and userRole

**Authorization Approach**:
- Middleware functions enforce route-level access control
- Role-based access control (RBAC) separates teacher and student capabilities
- Frontend authentication context manages user state across components

### Real-time Features

**WebSocket Implementation**: 
- WebSocket server runs alongside HTTP server
- Client authentication via user ID message
- Server broadcasts notifications to connected clients
- Client-side hook (useWebSocket) manages WebSocket lifecycle
- Automatic query invalidation on notification receipt

**Notification Flow**: Server-side events (new grades, assignments, enrollments) trigger notification creation and WebSocket broadcast to affected users.

## External Dependencies

### Database
- **Neon Serverless PostgreSQL**: Managed PostgreSQL database with serverless driver
- **Drizzle ORM**: Type-safe database queries and schema management

### UI Framework
- **Radix UI**: Unstyled, accessible component primitives (40+ components including dialogs, dropdowns, tabs, accordions)
- **shadcn/ui**: Pre-configured Radix UI components with Tailwind styling
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens

### State & Data Management
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition

### Authentication & Security
- **bcrypt**: Password hashing library
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **esbuild**: Production server bundling

### Third-party Services
- **Google Fonts**: Typography (Inter for UI, JetBrains Mono for code)
- **Replit Plugins**: Development environment enhancements (error overlay, cartographer, dev banner)

### WebSocket
- **ws**: WebSocket library for Node.js enabling real-time bidirectional communication