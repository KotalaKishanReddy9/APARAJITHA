# Development Guide

This guide will help you set up TaskMaestro for local development.

## Quick Start

### 1. Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (local, Docker, or cloud)

### 2. Initial Setup
```bash
# Clone and install dependencies
git clone <repository-url>
cd TaskMaestro
npm install
```

### 3. Database Setup

#### Option A: Docker (Recommended)
```bash
# Run our setup script (requires Docker)
./scripts/setup-db.sh
```

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
# or sudo apt-get install postgresql  # Ubuntu

# Create database
createdb taskmaestro

# Update .env
cp .env.example .env
# Edit .env and set: DATABASE_URL="postgresql://username:password@localhost:5432/taskmaestro"
```

#### Option C: Cloud Database (Neon - Recommended for production)
1. Sign up at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string to `.env`

### 4. Initialize Database Schema
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5000` to see the application.

## Development Workflow

### Project Structure
```
TaskMaestro/
├── client/src/           # React frontend
│   ├── components/       # Reusable UI components  
│   ├── pages/           # Page components
│   ├── lib/             # Utilities and hooks
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── db.ts           # Database connection
├── shared/              # Shared code
│   └── schema.ts       # Database schema & types
└── scripts/            # Development scripts
```

### Key Technologies
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express + TypeScript + Drizzle ORM
- **Database**: PostgreSQL
- **Real-time**: WebSocket
- **Authentication**: Session-based with bcrypt

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push schema changes to database

### Database Management

#### Making Schema Changes
1. Edit `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Test your changes

#### Drizzle ORM Usage
```typescript
// Query examples
const users = await db.select().from(users).where(eq(users.email, email));
const course = await db.insert(courses).values(data).returning();
```

### Authentication Flow
1. User registers/logs in via API endpoints
2. Session created and stored in PostgreSQL
3. Frontend stores user data in localStorage
4. API routes protected with `requireAuth` middleware
5. WebSocket connections authenticated by user ID

### Real-time Features
- WebSocket server runs on same port as HTTP server
- Clients authenticate by sending `{ type: 'auth', userId }` 
- Server broadcasts notifications to connected clients
- Frontend automatically invalidates queries on notification

### Frontend Development

#### Component Guidelines
- Use shadcn/ui components as base
- Add proper TypeScript types
- Include loading and error states
- Follow existing patterns for consistency

#### State Management
- Use TanStack Query for server state
- Use React hooks for local state
- Authentication state in context

#### Styling
- Use Tailwind CSS utility classes
- Follow existing design patterns
- Support both light and dark themes

### Backend Development

#### Adding New API Endpoints
1. Add route to `server/routes.ts`
2. Add validation with Zod schemas
3. Implement database operations in `server/storage.ts`
4. Add proper error handling

#### Database Operations
- Use the storage interface for consistency
- Avoid N+1 queries by using JOINs
- Add proper indexes for performance

### Testing

#### Manual Testing Workflow
1. Register as a teacher and student
2. Create courses as teacher
3. Enroll in courses as student
4. Create assignments and submit them
5. Grade submissions and verify notifications

#### Debugging
- Check browser dev tools for client errors
- Check server logs for API errors
- Verify database state with SQL queries

### Common Issues

#### Database Connection
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection string in .env
echo $DATABASE_URL
```

#### TypeScript Errors
```bash
# Run type checking
npm run check

# Common fixes: check imports, update types
```

#### Build Issues
```bash
# Clear dependencies and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Performance Tips
- Use database indexes for frequently queried columns
- Implement proper pagination for large datasets
- Use React.memo for expensive components
- Optimize bundle size by importing only what's needed

### Security Best Practices
- Never expose sensitive data in frontend
- Validate all inputs on backend
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Keep dependencies updated

### Deployment

#### Production Checklist
- [ ] Set strong `SESSION_SECRET`
- [ ] Use production database
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Configure CORS appropriately

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Getting Help
- Check the README for basic setup
- Review existing code for patterns
- Check GitHub issues for common problems