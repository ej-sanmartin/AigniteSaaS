/**
 * Type conversion utilities for PostgreSQL data types
 * 
 * These converters handle the transformation of raw PostgreSQL data into the expected JavaScript types.
 * PostgreSQL returns dates as ISO strings and JSONB as objects, but our validation expects specific types.
 */

/**
 * Converts PostgreSQL date string to JavaScript Date object
 * Handles format: YYYY-MM-DD HH:MM:SS.MS-TZ
 * 
 * Note: PostgreSQL returns dates as ISO strings, but our validation expects Date objects.
 * This function ensures consistent date handling across the application.
 */
export function convertPostgresDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  // PostgreSQL returns dates in ISO format, which JavaScript can parse directly
  return new Date(dateStr);
}

/**
 * Converts PostgreSQL JSONB to JavaScript object
 * 
 * Note: PostgreSQL returns JSONB fields as objects, but they might be strings in some cases.
 * This function handles both cases to ensure consistent object handling.
 */
export function convertPostgresJsonb(jsonData: string | Record<string, any> | null): Record<string, any> | null {
  if (!jsonData) return null;
  // If it's already an object (PostgreSQL JSONB), return it directly
  if (typeof jsonData === 'object') return jsonData;
  // If it's a string, parse it
  return JSON.parse(jsonData);
}

/**
 * Converts PostgreSQL INET to string
 * 
 * Note: PostgreSQL INET type is returned as a string, but we ensure consistent string handling.
 */
export function convertPostgresInet(inetStr: string | null): string | null {
  if (!inetStr) return null;
  return inetStr;
}

/**
 * Converts a raw OAuth session row to the expected type
 * 
 * This function handles the conversion of all PostgreSQL-specific types in an OAuth session row.
 * It ensures that dates are Date objects and JSONB fields are properly handled.
 */
export function convertOAuthSessionRow(row: any) {
  return {
    ...row,
    // Convert date strings to Date objects
    created_at: convertPostgresDate(row.created_at),
    expires_at: convertPostgresDate(row.expires_at),
    revoked_at: convertPostgresDate(row.revoked_at),
    // Handle device_info which might be an object or string
    device_info: convertPostgresJsonb(row.device_info),
    // Handle metadata which might be an object or string
    metadata: convertPostgresJsonb(row.metadata)
  };
}

/**
 * Converts a raw user session row to the expected type
 * 
 * Similar to OAuth session conversion, but handles user session specific fields.
 * Ensures consistent type handling across all session types.
 */
export function convertUserSessionRow(row: any) {
  return {
    ...row,
    // Convert date strings to Date objects
    created_at: convertPostgresDate(row.created_at),
    expires_at: convertPostgresDate(row.expires_at),
    revoked_at: convertPostgresDate(row.revoked_at),
    last_activity_at: convertPostgresDate(row.last_activity_at),
    // Handle device_info which might be an object or string
    device_info: convertPostgresJsonb(row.device_info)
  };
} 