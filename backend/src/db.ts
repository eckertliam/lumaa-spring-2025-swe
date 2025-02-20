import { Pool } from 'pg'

// validate required env vars are set
const requiredEnvVars: string[] = [
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
    'POSTGRES_PORT',
    'POSTGRES_HOST'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`${envVar} is not set`);
        process.exit(1);
    }
}

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    port: parseInt(process.env.POSTGRES_PORT as string),
    host: process.env.POSTGRES_HOST,
    max: 20, // max number of connections in the pool
    idleTimeoutMillis: 30000, // close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // return an error after 2 seconds if a connection is not made
});

export default pool;
