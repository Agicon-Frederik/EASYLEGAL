// Shared utilities and types for EASYLEGAL monorepo

export const APP_NAME = 'EASYLEGAL';

// Example shared type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Example shared utility function
export function formatDate(date: Date): string {
  return date.toISOString();
}

// Export i18n utilities and configuration
export * from './i18n';

// Export email service
export * from './email';

// Export auth utilities
export * from './auth';
