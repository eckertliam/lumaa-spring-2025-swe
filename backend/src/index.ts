import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/task.routes';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app: Application = express();
const port: number = parseInt(process.env.PORT as string);
const corsOrigin: string = process.env.CORS_ORIGIN as string;

// configure CORS to allow requests from the frontend application
app.use(cors({
    origin: corsOrigin,
    credentials: false, // since no cookies are used, credentials are not needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
}));

app.use(express.json());

// routes for the API
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

