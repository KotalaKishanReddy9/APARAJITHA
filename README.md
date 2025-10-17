# TaskMaestro - Learning Management System

A comprehensive Learning Management System (LMS) built with React, Node.js, and PostgreSQL. TaskMaestro facilitates online education by supporting both teachers and students with course management, assignments, grading, and real-time notifications.

## Features

### For Teachers
- Create and manage courses
- Create assignments with due dates
- Grade student submissions with feedback
- Upload course materials
- View enrolled students
- Real-time notifications for new submissions

### For Students
- Browse and enroll in courses
- View course materials and discussions
- Submit assignments
- Check grades and feedback
- Real-time notifications for new assignments and grades

### General Features
- Session-based authentication with PostgreSQL storage
- Real-time notifications via WebSockets
- Responsive design with dark/light themes
- Type-safe API with validation
- Comprehensive error handling

## Technology Stack

### Frontend
- **React** with TypeScript
- **Wouter** for routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Radix UI** + **shadcn/ui** for components
- **Tailwind CSS** for styling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL
- **bcrypt** for password hashing
- **WebSocket** for real-time features
- **express-session** with PostgreSQL store

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskMaestro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A secure secret for session encryption

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`.

### Database Setup

You'll need a PostgreSQL database. Here are some options:

#### Option 1: Local PostgreSQL
Install PostgreSQL locally and create a database:
```sql
CREATE DATABASE taskmaestro;
```

#### Option 2: Docker
```bash
docker run --name taskmaestro-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=taskmaestro -p 5432:5432 -d postgres
```

#### Option 3: Neon (Recommended for deployment)
1. Sign up at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string to your `.env` file

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push schema changes to database

## Project Structure

```
TaskMaestro/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities and hooks
│   │   └── hooks/        # Custom React hooks
├── server/                # Backend Express application
│   ├── db.ts            # Database connection
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── index.ts         # Server entry point
├── shared/                # Shared code between client and server
│   └── schema.ts        # Database schema and types
└── README.md
```

## Key Features Implemented

### Backend Improvements
- ✅ Fixed TypeScript compilation errors
- ✅ Added comprehensive input validation with Zod
- ✅ Improved database schema with unique constraints
- ✅ Enhanced session management with PostgreSQL store
- ✅ Added proper error handling and validation
- ✅ Fixed database query issues for multiple records
- ✅ Improved WebSocket authentication
- ✅ Added logout endpoint with cleanup

### Frontend Improvements
- ✅ Fixed type issues and API integration
- ✅ Added ErrorBoundary for better error handling
- ✅ Improved authentication flow
- ✅ Enhanced UI components and validation
- ✅ Added comprehensive form validation
- ✅ Improved user experience with loading states

### Database Schema
- ✅ Added unique constraints to prevent duplicate enrollments
- ✅ Added unique constraints for assignments and submissions
- ✅ Improved relationships and foreign key constraints
- ✅ Added proper cascading deletes

## Authentication

The application uses session-based authentication:
- Passwords are hashed with bcrypt (12 rounds)
- Sessions are stored in PostgreSQL
- WebSocket connections are authenticated via user ID
- Session cookies are secured for production

## Real-time Features

WebSocket integration provides real-time notifications for:
- New course enrollments
- Assignment submissions
- Grade updates
- Course announcements

## Security Features

- Input validation on all endpoints
- SQL injection protection via Drizzle ORM
- Session-based authentication
- Password hashing with bcrypt
- CSRF protection via SameSite cookies
- XSS protection via React's built-in sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the GitHub repository.