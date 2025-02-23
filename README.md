# Project Overview

By: Liam Eckert

This is a simple task management application built using TypeScript with an Express backend, a React frontend, and a PostgreSQL database.

## Database Setup and Configuration

- Navigate to the backend directory and if you haven't already installed the dependencies, run the following command:
```
npm install
```
- If you haven't already, create a .env and copy from .env.example, alter the variables to match your local database configuration.
- Generate the Prisma client:
```
npx prisma generate
```
- Migrate the database to match the prisma schema:
```
npx prisma migrate dev
```

## Backend Setup and Configuration
- Navigate to the backend directory and install the dependencies if you haven't already:
```
npm install
```
- Generate a private and public key pair. This will create a keys directory with the private and public keys:
```
npm run generate-keys
```
- If you haven't already, create a .env and copy from .env.example, alter the variables to match your local database configuration.
- Ensure you have already setup your databse following the instructions above.
- Start the backend server (NOTE: Ensure the database is running before starting the backend server):
```
npm run dev
```
