# Task Management Application

By: Liam Eckert

## Overview
A modern task management application built with:
- Frontend: React + TypeScript
- Backend: Express + TypeScript
- Database: PostgreSQL
- Architecture: Monorepo structure with shared types

## Prerequisites
- Node.js (LTS version recommended)
- PostgreSQL installed and running
- npm or yarn package manager

## Quick Start
For a quick setup of the entire application:

1. Clone the repository
2. Install all dependencies:
   ```bash
   npm run install-all
   ```
3. Follow the configuration steps below
4. Start the entire application:
   ```bash
   npm run dev
   ```

## Project Structure
```
├── frontend/    # React frontend application
├── backend/     # Express backend server
└── shared/      # Shared types and utilities
```

## Detailed Setup Guide

### 1. Database Setup
1. Ensure PostgreSQL is running on your system
2. Navigate to the `backend` directory
3. Create environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your PostgreSQL credentials
5. Initialize the database:
   ```bash
   npx prisma generate    # Generate Prisma client
   npx prisma migrate dev # Apply database migrations
   ```

### 2. Backend Setup
1. Navigate to the `backend` directory
2. Install dependencies (if not done via install-all):
   ```bash
   npm install
   ```
3. Generate authentication keys:
   ```bash
   npm run generate-keys
   ```
4. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Update the following in `.env`:
   - Database connection settings
   - CORS origin settings
   - Any other environment-specific variables

5. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` directory
2. Install dependencies (if not done via install-all):
   ```bash
   npm install
   ```
3. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Update `VITE_API_URL` in `.env` to match your backend URL (default: http://localhost:3000)

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Testing
Run tests for both frontend and backend:
```bash
npm run test
```

Or test individual components:
- Frontend tests: `npm test -w frontend`
- Backend tests: `npm test -w backend`

## Available Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build the entire application
- `npm run test` - Run all tests
- `npm run install-all` - Install dependencies for all workspaces

## Troubleshooting
- Ensure PostgreSQL is running before starting the backend
- Check that all environment variables are properly set
- Verify that the backend is running before starting the frontend
- For database connection issues, verify your PostgreSQL credentials in `.env`

## Additional Resources
- Frontend runs on: http://localhost:5173 (default)
- Backend API runs on: http://localhost:3000 (default)

## Demo
View a demonstration of the application in action: [Watch Demo Video](./example.mov)

## Expected Salary Per Month
$3,000
