import { QueryConfig } from 'pg';
import pool from '../config/database';

export const executeQuery = async <T>(query: QueryConfig): Promise<T> => {
  const client = await pool.connect();

  try {
    const result = await client.query(query);
    return result.rows as T;
  } finally {
    client.release();
  }
};
