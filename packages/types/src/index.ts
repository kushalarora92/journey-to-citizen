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
 * User profile data structure stored in Firestore
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  immigrationStatus?: 'visitor' | 'student' | 'worker' | 'permanent_resident';
  profileComplete?: boolean;
  prDate?: any; // Firestore Timestamp
  presenceInCanada?: PresenceEntry[];
  travelAbsences?: AbsenceEntry[];
  eligibility?: EligibilityCalculation; // Calculated eligibility data
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

/**
 * Presence in Canada entry before becoming PR
 */
export interface PresenceEntry {
  id: string;
  from: any; // Firestore Timestamp
  to: any; // Firestore Timestamp
  purpose: 'visitor' | 'study_permit' | 'work_permit' | 'protected_person' | 'business' | 'no_legal_status';
}

/**
 * Travel absence entry (outside Canada)
 */
export interface AbsenceEntry {
  id: string;
  from: any; // Firestore Timestamp
  to: any; // Firestore Timestamp
  place?: string;
}

/**
 * Eligibility calculation result
 * Stored with user profile for citizenship application tracking
 */
export interface EligibilityCalculation {
  daysInCanadaAsPR: number;
  preDaysCredit: number;
  totalAbsenceDays: number;
  totalEligibleDays: number;
  daysRequired: number;
  daysRemaining: number;
  isEligible: boolean;
  earliestApplicationDate: any; // Firestore Timestamp or null
  progress: number; // Percentage 0-100
  calculatedAt: any; // Firestore Timestamp - when this calculation was performed
}

/**
 * Update profile request data
 * Used when updating user profile via Cloud Functions
 */
export interface UpdateProfileData {
  displayName?: string;
  immigrationStatus?: 'visitor' | 'student' | 'worker' | 'permanent_resident';
  profileComplete?: boolean;
  prDate?: any;
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
