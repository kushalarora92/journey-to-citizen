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
 * Purpose of stay options for pre-PR presence (LEGACY - kept for backward compatibility)
 * @deprecated Use STATUS_TYPES instead for new implementations
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
 * Status types for immigration timeline
 * Used in StatusEntry for tracking immigration history
 */
export const STATUS_TYPES = {
  VISITOR: 'visitor',
  STUDY_PERMIT: 'study_permit',
  WORK_PERMIT: 'work_permit',
  PROTECTED_PERSON: 'protected_person',
  PERMANENT_RESIDENT: 'permanent_resident',
} as const;

export type StatusType = typeof STATUS_TYPES[keyof typeof STATUS_TYPES];

export const STATUS_TYPE_LABELS: Record<StatusType, string> = {
  visitor: 'Visitor',
  study_permit: 'Study Permit',
  work_permit: 'Work Permit',
  protected_person: 'Protected Person',
  permanent_resident: 'Permanent Resident',
};

/**
 * Account deletion status
 */
export const DELETION_STATUS = {
  ACTIVE: 'active',
  SCHEDULED_FOR_DELETION: 'scheduled_for_deletion',
  DELETED: 'deleted',
} as const;

export type DeletionStatus = typeof DELETION_STATUS[keyof typeof DELETION_STATUS];

/**
 * Immigration status entry for timeline
 * Represents a period with a specific immigration status
 */
export interface StatusEntry {
  id: string;
  status: StatusType;
  from: string; // ISO date string (YYYY-MM-DD) - when this status started
  to?: string;  // ISO date string (YYYY-MM-DD) - when this status ended (undefined = current/ongoing)
}

/**
 * Static eligibility data calculated by backend
 * These values are stored in Firestore and only change when profile is updated
 */
export interface StaticEligibilityData {
  daysInCanadaAsPR: number; // Raw days as PR (NOT reduced by absences)
  preDaysCredit: number; // Credit from pre-PR presence (max 365 days)
  totalAbsenceDays: number; // Total days absent from Canada
  earliestEligibilityDate: string; // ISO date string (YYYY-MM-DD) - when user becomes eligible
}

/**
 * Complete eligibility calculation details
 * Combines static backend data with dynamic frontend calculations
 */
export interface EligibilityCalculation extends StaticEligibilityData {
  totalEligibleDays: number; // daysInCanadaAsPR + preDaysCredit - totalAbsenceDays
  daysRequired: number; // Always 1095 (3 years)
  daysRemaining: number; // Calculated dynamically in frontend based on current date
  isEligible: boolean; // Calculated dynamically: today >= earliestEligibilityDate
  progress: number; // Percentage 0-100 (calculated dynamically)
}

/**
 * Presence in Canada entry before becoming PR
 * @deprecated Use statusHistory instead for new implementations
 * Kept for backward compatibility with existing user data
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
  profileComplete?: boolean;
  
  // Account deletion tracking
  deletionStatus?: DeletionStatus; // Current deletion status (default: 'active')
  deletionScheduledAt?: any; // Firestore Timestamp - when deletion was requested
  deletionExecutionDate?: string; // ISO date string - when deletion will execute (30 days after request)
  
  // NEW: Timeline-based immigration history (preferred)
  // Represents complete immigration journey with status changes
  statusHistory?: StatusEntry[];
  
  // LEGACY: Keep for backward compatibility (will be migrated to statusHistory)
  immigrationStatus?: 'visitor' | 'student' | 'worker' | 'permanent_resident';
  prDate?: string; // ISO date string (YYYY-MM-DD)
  presenceInCanada?: PresenceEntry[];
  
  // Travel absences (separate concern - not part of status)
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
  profileComplete?: boolean;
  
  // NEW: Timeline-based approach (preferred)
  statusHistory?: StatusEntry[];
  
  // LEGACY: Keep for backward compatibility
  immigrationStatus?: 'visitor' | 'student' | 'worker' | 'permanent_resident';
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

// ============================================================================
// HELPER FUNCTIONS
// These provide backward-compatible access to profile data
// They work with both new statusHistory and legacy fields
// ============================================================================

/**
 * Get current immigration status from profile
 * Prefers statusHistory, falls back to legacy immigrationStatus
 */
export function getCurrentStatus(profile: UserProfile | null | undefined): StatusType | undefined {
  if (!profile) return undefined;
  
  // Prefer statusHistory if available
  if (profile.statusHistory && profile.statusHistory.length > 0) {
    // Find the current status (no 'to' date means ongoing)
    const currentEntry = profile.statusHistory.find(entry => !entry.to);
    if (currentEntry) return currentEntry.status;
    
    // If all entries have end dates, return the most recent one
    const sorted = [...profile.statusHistory].sort(
      (a, b) => new Date(b.from).getTime() - new Date(a.from).getTime()
    );
    return sorted[0]?.status;
  }
  
  // Fall back to legacy field
  if (profile.immigrationStatus) {
    // Map legacy 'permanent_resident' to new format
    if (profile.immigrationStatus === 'permanent_resident') {
      return 'permanent_resident';
    }
    // Map legacy statuses to new STATUS_TYPES
    const legacyToNew: Record<string, StatusType> = {
      'visitor': 'visitor',
      'student': 'study_permit',
      'worker': 'work_permit',
    };
    return legacyToNew[profile.immigrationStatus] || profile.immigrationStatus as StatusType;
  }
  
  return undefined;
}

/**
 * Get PR date from profile
 * Prefers statusHistory, falls back to legacy prDate
 */
export function getPRDate(profile: UserProfile | null | undefined): string | undefined {
  if (!profile) return undefined;
  
  // Prefer statusHistory if available
  if (profile.statusHistory && profile.statusHistory.length > 0) {
    const prEntry = profile.statusHistory.find(entry => entry.status === 'permanent_resident');
    return prEntry?.from;
  }
  
  // Fall back to legacy field
  return profile.prDate;
}

/**
 * Check if user currently has PR status
 */
export function hasPRStatus(profile: UserProfile | null | undefined): boolean {
  const currentStatus = getCurrentStatus(profile);
  return currentStatus === 'permanent_resident';
}

/**
 * Check if user has any time counting toward citizenship
 * (PR holders or those with work/study permits whose days will count as pre-PR credit)
 */
export function hasCountableDays(profile: UserProfile | null | undefined): boolean {
  const currentStatus = getCurrentStatus(profile);
  if (!currentStatus) return false;
  
  // All statuses except visitor can count days
  return currentStatus !== 'visitor';
}

/**
 * Get all pre-PR presence entries from profile
 * Combines statusHistory (non-PR statuses) with legacy presenceInCanada
 */
export function getPrePRPresence(profile: UserProfile | null | undefined): Array<{from: string; to: string; status: StatusType}> {
  if (!profile) return [];
  
  const entries: Array<{from: string; to: string; status: StatusType}> = [];
  
  // From statusHistory: get all non-PR statuses that have ended
  if (profile.statusHistory && profile.statusHistory.length > 0) {
    const prDate = getPRDate(profile);
    
    profile.statusHistory.forEach(entry => {
      if (entry.status !== 'permanent_resident' && entry.to) {
        entries.push({
          from: entry.from,
          to: entry.to,
          status: entry.status,
        });
      }
    });
  }
  
  // From legacy presenceInCanada (if no statusHistory or for additional entries)
  if ((!profile.statusHistory || profile.statusHistory.length === 0) && profile.presenceInCanada) {
    profile.presenceInCanada.forEach(entry => {
      // Map legacy purpose to StatusType
      const purposeToStatus: Record<string, StatusType> = {
        'visitor': 'visitor',
        'study_permit': 'study_permit',
        'work_permit': 'work_permit',
        'protected_person': 'protected_person',
        'business': 'visitor', // Business visitors count as visitor
        'no_legal_status': 'visitor', // Map to visitor for counting purposes
      };
      
      entries.push({
        from: entry.from,
        to: entry.to,
        status: purposeToStatus[entry.purpose] || 'visitor',
      });
    });
  }
  
  return entries;
}

/**
 * Convert legacy profile data to statusHistory format
 * Useful for migration
 */
export function convertLegacyToStatusHistory(profile: UserProfile): StatusEntry[] {
  const entries: StatusEntry[] = [];
  
  // Add pre-PR presence entries
  if (profile.presenceInCanada && profile.presenceInCanada.length > 0) {
    profile.presenceInCanada.forEach(presence => {
      // Map legacy purpose to StatusType
      const purposeToStatus: Record<string, StatusType> = {
        'visitor': 'visitor',
        'study_permit': 'study_permit',
        'work_permit': 'work_permit',
        'protected_person': 'protected_person',
        'business': 'visitor',
        'no_legal_status': 'visitor',
      };
      
      entries.push({
        id: presence.id,
        status: purposeToStatus[presence.purpose] || 'visitor',
        from: presence.from,
        to: presence.to,
      });
    });
  }
  
  // Add PR entry if exists
  if (profile.prDate && profile.immigrationStatus === 'permanent_resident') {
    entries.push({
      id: `pr-${Date.now()}`,
      status: 'permanent_resident',
      from: profile.prDate,
      to: undefined, // Current/ongoing
    });
  } else if (profile.immigrationStatus && profile.immigrationStatus !== 'permanent_resident') {
    // Add current non-PR status
    const legacyToStatus: Record<string, StatusType> = {
      'visitor': 'visitor',
      'student': 'study_permit',
      'worker': 'work_permit',
    };
    
    // We don't have a start date for legacy status, so we'll use today
    entries.push({
      id: `current-${Date.now()}`,
      status: legacyToStatus[profile.immigrationStatus] || 'visitor',
      from: new Date().toISOString().split('T')[0],
      to: undefined, // Current/ongoing
    });
  }
  
  // Sort by date (oldest first)
  return entries.sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// App version configuration types (for force update feature)
export * from './appVersion';
