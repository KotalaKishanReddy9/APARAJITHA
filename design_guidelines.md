# Learning Management System - Design Guidelines

## Design Approach: Utility-First Education Platform

**Selected Approach**: Design System with Educational Platform References
- **Primary Inspiration**: Canvas LMS, Notion, Linear
- **Design Philosophy**: Clean, organized, information-dense without overwhelm
- **Key Principle**: Clarity and efficiency over decoration

---

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Primary: 217 91% 60% (Trustworthy blue - education standard)
- Primary Hover: 217 91% 50%
- Background: 0 0% 100%
- Surface: 210 20% 98%
- Text Primary: 222 47% 11%
- Text Secondary: 215 16% 47%
- Border: 214 32% 91%
- Success: 142 71% 45% (grades, completions)
- Warning: 38 92% 50% (pending submissions)
- Error: 0 84% 60% (overdue assignments)

**Dark Mode**:
- Primary: 217 91% 60%
- Primary Hover: 217 91% 70%
- Background: 222 47% 11%
- Surface: 217 33% 17%
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%
- Border: 217 33% 24%

**Role Indicators**:
- Teacher Badge: 271 76% 53% (Purple accent)
- Student Badge: 142 71% 45% (Green accent)

### B. Typography

**Font Stack**:
- Primary: 'Inter' (Google Fonts) - Clean, professional, excellent readability
- Monospace: 'JetBrains Mono' (code snippets, assignment IDs)

**Hierarchy**:
- Page Titles: text-3xl font-bold (Dashboard headers)
- Section Headers: text-2xl font-semibold (Course titles)
- Card Titles: text-lg font-semibold (Assignment names)
- Body Text: text-base font-normal (Descriptions, content)
- Meta Info: text-sm font-medium (Dates, submission counts)
- Labels: text-xs font-medium uppercase tracking-wide (Status badges)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** exclusively
- Micro spacing: p-2, gap-2 (tight groups)
- Component spacing: p-4, gap-4 (cards, forms)
- Section spacing: p-6, gap-6 (page sections)
- Major spacing: p-8, gap-8 (dashboards, layouts)
- Page margins: p-12, p-16 (outer containers)

**Grid System**:
- Sidebar + Main: `grid-cols-[256px_1fr]` (desktop navigation)
- Dashboard Cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Assignment List: Single column with max-w-4xl
- Course Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`

### D. Component Library

**Navigation**:
- **Sidebar Navigation** (Desktop): Fixed left sidebar, 256px wide, role-specific menu items
  - Teacher: Dashboard, My Courses, Create Course, Students, Grades
  - Student: Dashboard, My Courses, Browse Courses, Assignments, Grades
- **Top Bar**: User profile dropdown, notifications bell, role indicator badge
- **Mobile**: Hamburger menu with slide-out drawer

**Dashboard Components**:
- **Stats Cards**: Grid of metric cards (enrolled courses, pending assignments, average grade)
  - Icon + Number + Label layout
  - Colored left border indicating status
- **Activity Feed**: Timeline-style list of recent actions
- **Quick Actions**: Role-specific primary CTAs (Create Course for teachers, Browse Courses for students)

**Course Cards**:
- Thumbnail image placeholder (300x180px)
- Course title, instructor name, duration
- Enrollment count (teacher view) or progress bar (student view)
- Action button (Manage/Enroll/Continue)

**Assignment Interface**:
- **Teacher View**: Table with student names, submission status, grade column, action buttons
- **Student View**: Card-based with title, description, due date, submission status, upload area
- File upload zone with drag-and-drop (dotted border, cloud icon)

**Discussion Forum**:
- Threaded comment system with indentation (pl-8 per level)
- Avatar + Name + Timestamp header
- Reply/React buttons (text-sm)
- Markdown support indicator

**Forms**:
- Consistent input styling: border, rounded-lg, p-3, focus ring
- Label above input pattern
- Helper text below in text-sm text-secondary
- Error states with red border and error message

**Notifications Panel**:
- Slide-out from right (fixed right-0)
- Categorized by type (Assignment, Grade, Forum)
- Unread indicator (blue dot)
- Mark as read/dismiss actions

### E. Data Display

**Tables**:
- Striped rows for readability (even:bg-surface)
- Sticky header on scroll
- Action column fixed to right
- Responsive: Stack to cards on mobile

**Grade Display**:
- Circular progress indicators for course averages
- Color-coded grade ranges: 
  - A (90-100): Success green
  - B (80-89): Primary blue  
  - C (70-79): Warning orange
  - Below 70: Error red
- Grade breakdown accordion showing individual assignments

**File Attachments**:
- Icon + filename + size layout
- Download button (outline variant)
- Preview for images/PDFs

### F. Interactions & States

**Minimal Animations**:
- Page transitions: fade-in (200ms)
- Modal/drawer: slide-in (300ms)
- Hover states: opacity-90 or bg-opacity change
- NO scroll animations, parallax, or decorative motion

**Loading States**:
- Skeleton screens for dashboard cards
- Spinner for form submissions
- Progress bar for file uploads

**Empty States**:
- Centered icon + message + CTA
- "No courses yet" with "Browse Courses" button
- "No submissions" with encouraging message

---

## Images

**Course Thumbnails**: 
- Use educational imagery (books, classroom, digital learning)
- Dimensions: 300x180px (16:9 aspect ratio)
- Placeholder: Colored gradient with course initials

**User Avatars**:
- Circular, 40px for lists, 64px for profiles
- Fallback: Initials on colored background (derived from name)

**Dashboard Hero**: 
- NO large hero image
- Use stats/quick actions grid instead
- Welcome message with user's name and role

---

## Responsive Behavior

- **Desktop (1024px+)**: Sidebar + Main layout, multi-column grids
- **Tablet (768-1023px)**: Collapsible sidebar, 2-column grids
- **Mobile (<768px)**: Hidden sidebar (hamburger), single column, stacked navigation

---

## Accessibility

- Maintain WCAG AA contrast ratios
- Consistent dark mode across all inputs and forms
- Keyboard navigation for all interactive elements
- Screen reader labels for icon-only buttons
- Focus indicators on all form elements