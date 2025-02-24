# Project Overview

By: Liam Eckert

This is a simple task management application built using TypeScript with an Express backend, a React frontend, and a PostgreSQL database.

## Running the project
- Follow the instructions below to run the project locally
- First follow the database setup instructions below
- Then follow the backend setup instructions below
- Then follow the frontend setup instructions below
- Finally in the root directory run the following command to start the project:
```
npm run dev
```
- To test both frontend and backend, run the following command:
```
npm run test
```
- To quickly install all dependencies, run the following command:
```
npm install-all
```

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
- If you haven't already, create a .env and copy from .env.example, alter the variables to match your local database configuration and cors origin.
- Ensure you have already setup your databse following the instructions above.
- Start the backend server (NOTE: Ensure the database is running before starting the backend server):
```
npm run dev
```

### Testing the backend
- Run the following command to test the backend:
```
npm run test
```

## Frontend Setup and Configuration
- Navigate to the frontend directory and install the dependencies if you haven't already:
```
npm install
```
- To setup the frontend to connect to your local backend, you will need to update the VITE_API_URL in the .env file to match your local backend URL, using .env.example as a reference.
- Start the frontend server:
```
npm run dev
```

### Testing the frontend
- Run the following command to test the frontend:
```
npm run test
```
