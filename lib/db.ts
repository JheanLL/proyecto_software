import mysql from 'mysql2/promise';

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
};

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: { rejectUnauthorized: false },
    connectionLimit: 10,
    timezone: "Z",
    dateStrings: true,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export default pool;