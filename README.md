# Project Overview

By: Liam Eckert

This is a simple task management application built using TypeScript with an Express backend, a React frontend, and a PostgreSQL database.

## Database Setup and Configuration

1. Ensure Docker is installed.
2. Configure the following environment variables in the backend directory:
- POSTGRES_USER
- POSTGRES_PW
- POSTGRES_DB
- POSTGRES_PORT (NOTE: This is the port on which the db will be exposed)
- POSTGRES_HOST (NOTE: This is the host on which the db will be exposed. Probably localhost)
- PGADMIN_MAIL
- PGADMIN_PW
3. Run the following command to start the database:
```
docker compose up
```
4. When finished, run the following command to stop the database:
```
docker compose down
```

## Backend Setup and Configuration
1. Install dependencies:
```
npm install
```
2. Generate a private and public key pair. This will create a keys directory with the private and public keys:
```
npm run generate-keys
```
3. Configure the following environment variables in the backend directory:
- PORT
- CORS_ORIGIN (e.g. the URL of the frontend application)
4. Start the backend server (NOTE: Ensure the database is running before starting the backend server):
```
npm run dev
```
