/**
 * Secure Error Handling & Information Leakage Prevention
 * Logs full error details to server/browser console for debugging while
 * returning safe, sanitized messages to end users to prevent stack traces,
 * database schema, or internal path leakage.
 */

export function sanitizeErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred. Please try again.'): string {
  // Always log the full error stack/object for developer debugging
  console.error('[Application Error]:', error);

  if (!error) return fallbackMessage;

  const rawMessage = typeof error === 'string' 
    ? error 
    : (error as any)?.message || (error as any)?.error_description || String(error);

  const lowerMsg = rawMessage.toLowerCase();

  // Known safe validation or user action messages that can be directly shown
  if (
    lowerMsg.includes('invalid email') ||
    lowerMsg.includes('password must be') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('please wait') ||
    lowerMsg.includes('future months') ||
    lowerMsg.includes('required field') ||
    lowerMsg.includes('already registered') ||
    lowerMsg.includes('invalid login credentials')
  ) {
    return rawMessage;
  }

  // Sensitive database or technical keywords to block from public view
  const sensitivePatterns = [
    'postgres',
    'pg_',
    'sql',
    'column',
    'relation',
    'foreign key',
    'unique constraint',
    'row-level security',
    'rls',
    'jwt',
    'auth/',
    'schema',
    'table',
    'econnrefused',
    'fetch failed',
    'http 5',
    'node_modules',
  ];

  if (sensitivePatterns.some((pattern) => lowerMsg.includes(pattern))) {
    return fallbackMessage;
  }

  // Clean message length to prevent excessively long error dumps
  if (rawMessage.length > 150) {
    return fallbackMessage;
  }

  return rawMessage;
}
