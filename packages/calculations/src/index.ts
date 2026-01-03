/**
 * @journey-to-citizen/calculations
 * 
 * Shared calculation logic for Canadian citizenship eligibility.
 * Used by both backend (Cloud Functions) and frontend (React Native).
 */

export {
  // Constants
  DAYS_REQUIRED,
  MAX_PRE_PR_CREDIT,
  COUNTABLE_STATUSES,
  
  // Types
  type ProjectionResult,
  
  // Core calculation functions
  calculateStaticEligibility,
  calculateProjection,
  calculatePrePRCredit,
  calculateAbsenceDays,
  hasEligibilityFieldsChanged,
  
  // Utility functions
  parseDate,
  formatDateToString,
  mergeOverlappingDateRanges,
  daysBetween,
} from './eligibility';
