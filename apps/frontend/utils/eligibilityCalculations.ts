import { UserProfile, EligibilityCalculation } from '@journey-to-citizen/types';

/**
 * Helper function to convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000);
  }
  return new Date(timestamp);
}

/**
 * Get complete eligibility data combining backend static values with frontend dynamic calculations
 * 
 * Backend stores (updated on profile changes):
 * - daysInCanadaAsPR: Days as PR minus absences (snapshot)
 * - preDaysCredit: Credit from pre-PR presence (max 365)
 * - totalAbsenceDays: Total days absent
 * - earliestEligibilityDate: When user becomes eligible
 * 
 * Frontend calculates dynamically (based on current date):
 * - daysRemaining: Days until eligibility
 * - isEligible: Whether eligible today
 * - progress: Percentage towards eligibility
 */
export function getEligibility(profile: UserProfile | null): EligibilityCalculation & {
  earliestApplicationDate: Date | null;
} {
  const DAYS_REQUIRED = 1095;
  
  const defaultResult: EligibilityCalculation & { earliestApplicationDate: Date | null } = {
    daysInCanadaAsPR: 0,
    preDaysCredit: 0,
    totalAbsenceDays: 0,
    earliestEligibilityDate: null,
    totalEligibleDays: 0,
    daysRequired: DAYS_REQUIRED,
    daysRemaining: DAYS_REQUIRED,
    isEligible: false,
    earliestApplicationDate: null,
    progress: 0,
  };

  if (!profile || !profile.prDate) {
    return defaultResult;
  }

  // Check if we have backend-calculated static data
  if (!profile.staticEligibility) {
    // No backend data yet (profile just created or calculation failed)
    return defaultResult;
  }

  const staticData = profile.staticEligibility;
  
  // Convert earliest eligibility date from Firestore timestamp
  let earliestDate: Date | null = null;
  if (staticData.earliestEligibilityDate) {
    earliestDate = timestampToDate(staticData.earliestEligibilityDate);
  }

  // Calculate dynamic values based on current date
  const today = new Date();
  const totalEligibleDays = staticData.daysInCanadaAsPR + staticData.preDaysCredit;
  
  // Calculate days remaining until eligibility
  let daysRemaining = 0;
  let isEligible = false;
  if (earliestDate) {
    const msRemaining = earliestDate.getTime() - today.getTime();
    daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    isEligible = today >= earliestDate;
  }

  // Calculate progress percentage
  const progress = Math.min(100, (totalEligibleDays / DAYS_REQUIRED) * 100);

  return {
    // Static data from backend
    daysInCanadaAsPR: staticData.daysInCanadaAsPR,
    preDaysCredit: staticData.preDaysCredit,
    totalAbsenceDays: staticData.totalAbsenceDays,
    earliestEligibilityDate: staticData.earliestEligibilityDate,
    
    // Calculated values
    totalEligibleDays,
    daysRequired: DAYS_REQUIRED,
    daysRemaining,
    isEligible,
    progress,
    earliestApplicationDate: earliestDate,
  };
}

/**
 * DEPRECATED: Use getEligibility() instead
 * This function is kept for backward compatibility but will be removed
 * 
 * @deprecated Backend now calculates eligibility. Use getEligibility() instead.
 */
export function calculateEligibility(profile: UserProfile | null): EligibilityCalculation & {
  earliestApplicationDate: Date | null;
} {
  console.warn('calculateEligibility() is deprecated. Backend now handles calculations. Use getEligibility() instead.');
  return getEligibility(profile);
}

/**
 * Get upcoming trips from user profile
 */
export function getUpcomingTrips(profile: UserProfile | null): number {
  if (!profile || !profile.travelAbsences) {
    return 0;
  }

  const today = new Date();
  return profile.travelAbsences.filter(absence => {
    const fromDate = new Date(absence.from);
    return fromDate > today;
  }).length;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Format days remaining in human-readable format
 */
export function formatDaysRemaining(days: number): string {
  if (days === 0) return 'Eligible now!';
  
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainingDays = days % 30;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (remainingDays > 0 || parts.length === 0) {
    parts.push(`${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`);
  }

  return parts.join(', ');
}
