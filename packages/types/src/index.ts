/**
 * Shared types for Journey to Citizen app
 * Used across frontend, backend, and cloud functions
 */

/**
 * Immigration status options
 */
export const IMMIGRATION_STATUS = {
  VISITOR: 'visitor',
  STUDENT: 'student',
  WORKER: 'worker',
  PERMANENT_RESIDENT: 'permanent_resident',
} as const;

export const IMMIGRATION_STATUS_LABELS: Record<string, string> = {
  visitor: 'Visitor',
  student: 'Student (Study Permit)',
  worker: 'Worker (Work Permit)',
  permanent_resident: 'Permanent Resident',
};

/**
 * Purpose of stay options for pre-PR presence
 */
export const PURPOSE_OF_STAY = {
  VISITOR: 'visitor',
  STUDY_PERMIT: 'study_permit',
  WORK_PERMIT: 'work_permit',
  PROTECTED_PERSON: 'protected_person',
  BUSINESS: 'business',
  NO_LEGAL_STATUS: 'no_legal_status',
} as const;

export const PURPOSE_OF_STAY_LABELS: Record<string, string> = {
  visitor: 'Visitor',
  study_permit: 'Study Permit',
  work_permit: 'Work Permit',
  protected_person: 'Protected Person',
  business: 'Business',
  no_legal_status: 'No Legal Status',
};

/**
 * Static eligibility data calculated by backend
 * These values are stored in Firestore and only change when profile is updated
 */
export interface StaticEligibilityData {
  daysInCanadaAsPR: number; // Days as PR minus absences (snapshot at calculation time)
  preDaysCredit: number; // Credit from pre-PR presence (max 365 days)
  totalAbsenceDays: number; // Total days absent from Canada
  earliestEligibilityDate: string; // ISO date string (YYYY-MM-DD) - when user becomes eligible
}

/**
 * Complete eligibility calculation details
 * Combines static backend data with dynamic frontend calculations
 */
export interface EligibilityCalculation extends StaticEligibilityData {
  totalEligibleDays: number; // daysInCanadaAsPR + preDaysCredit (calculated from static data)
  daysRequired: number; // Always 1095 (3 years)
  daysRemaining: number; // Calculated dynamically in frontend based on current date
  isEligible: boolean; // Calculated dynamically: today >= earliestEligibilityDate
  progress: number; // Percentage 0-100 (calculated dynamically)
}

/**
 * Presence in Canada entry before becoming PR
 */
export interface PresenceEntry {
  id: string;
  from: string; // ISO date string (YYYY-MM-DD)
  to: string; // ISO date string (YYYY-MM-DD)
  purpose: 'visitor' | 'study_permit' | 'work_permit' | 'protected_person' | 'business' | 'no_legal_status';
}

/**
 * Travel absence entry (outside Canada)
 */
export interface AbsenceEntry {
  id: string;
  from: string; // ISO date string (YYYY-MM-DD)
  to: string; // ISO date string (YYYY-MM-DD)
  place?: string;
}

/**
 * User profile data structure stored in Firestore
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  immigrationStatus?: 'visitor' | 'student' | 'worker' | 'permanent_resident';
  profileComplete?: boolean;
  prDate?: string; // ISO date string (YYYY-MM-DD)
  presenceInCanada?: PresenceEntry[];
  travelAbsences?: AbsenceEntry[];
  
  // Backend-calculated static eligibility data (updated on profile changes)
  staticEligibility?: StaticEligibilityData;
  
  createdAt?: any; // Firestore Timestamp (keep for audit trail)
  updatedAt?: any; // Firestore Timestamp (keep for audit trail)
}

/**
 * Update profile request data
 * Used when updating user profile via Cloud Functions
 */
export interface UpdateProfileData {
  displayName?: string;
  immigrationStatus?: 'visitor' | 'student' | 'worker' | 'permanent_resident';
  profileComplete?: boolean;
  prDate?: string; // ISO date string (YYYY-MM-DD)
  presenceInCanada?: PresenceEntry[];
  travelAbsences?: AbsenceEntry[];
  [key: string]: any; // Allow additional custom fields
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
