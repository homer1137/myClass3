import postgresql from 'pg';

const { Pool } = postgresql;

export const pool = new Pool({
    user: 'postgres',
    database: 'myClass',
    password: '111083rom11',
    host: '127.0.0.1',
    port: 5433,
  });
   