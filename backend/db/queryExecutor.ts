import { QueryConfig } from 'pg';
import pool from '../config/database';

export const executeQuery = async <T>(query: QueryConfig): Promise<T> => {
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    const result = await client.query(query);

    // Commit transaction
    await client.query('COMMIT');

    return result.rows as T;
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
