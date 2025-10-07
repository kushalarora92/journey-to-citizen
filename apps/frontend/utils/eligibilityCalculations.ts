import { UserProfile } from '@journey-to-citizen/types';

interface EligibilityCalculation {
  daysInCanadaAsPR: number;
  preDaysCredit: number;
  totalAbsenceDays: number;
  totalEligibleDays: number;
  daysRequired: number;
  daysRemaining: number;
  isEligible: boolean;
  earliestApplicationDate: Date | null;
  progress: number; // Percentage 0-100
}

/**
 * Calculate citizenship eligibility based on user profile
 * 
 * Requirements:
 * - Must be physically present in Canada for 1095 days (3 years) in last 5 years
 * - Each day before PR counts as 0.5 days (max 365 days credit)
 * - Only full days outside Canada count as absences
 * - Day of departure and return count as days IN Canada
 */
export function calculateEligibility(profile: UserProfile | null): EligibilityCalculation {
  const defaultResult: EligibilityCalculation = {
    daysInCanadaAsPR: 0,
    preDaysCredit: 0,
    totalAbsenceDays: 0,
    totalEligibleDays: 0,
    daysRequired: 1095,
    daysRemaining: 1095,
    isEligible: false,
    earliestApplicationDate: null,
    progress: 0,
  };

  if (!profile || !profile.prDate) {
    return defaultResult;
  }

  const today = new Date();
  const prDate = new Date(profile.prDate);
  
  // Calculate days as PR
  const daysSincePR = Math.floor((today.getTime() - prDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate pre-PR credit (max 365 days, each day counts as 0.5)
  let preDaysCredit = 0;
  if (profile.presenceInCanada && profile.presenceInCanada.length > 0) {
    const totalPrePRDays = profile.presenceInCanada.reduce((total, entry) => {
      const from = new Date(entry.from);
      const to = new Date(entry.to);
      const days = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + days;
    }, 0);
    
    // Each day before PR counts as 0.5 days, max 365 days credit
    preDaysCredit = Math.min(Math.floor(totalPrePRDays * 0.5), 365);
  }

  // Calculate absence days
  let totalAbsenceDays = 0;
  if (profile.travelAbsences && profile.travelAbsences.length > 0) {
    totalAbsenceDays = profile.travelAbsences
      .filter(absence => {
        // Only count past absences
        const toDate = new Date(absence.to);
        return toDate <= today;
      })
      .reduce((total, absence) => {
        const from = new Date(absence.from);
        const to = new Date(absence.to);
        
        // Only count full days outside (exclude departure and return days)
        const days = Math.max(0, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) - 1);
        return total + days;
      }, 0);
  }

  // Calculate total eligible days
  const daysInCanadaAsPR = Math.max(0, daysSincePR - totalAbsenceDays);
  const totalEligibleDays = daysInCanadaAsPR + preDaysCredit;
  
  const daysRequired = 1095;
  const daysRemaining = Math.max(0, daysRequired - totalEligibleDays);
  const isEligible = totalEligibleDays >= daysRequired;
  
  // Calculate earliest application date
  let earliestApplicationDate: Date | null = null;
  if (daysRemaining > 0) {
    // Assuming no future absences, calculate when they'll reach 1095 days
    const daysNeeded = daysRemaining;
    earliestApplicationDate = new Date(today.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
  } else {
    // Already eligible
    earliestApplicationDate = today;
  }

  const progress = Math.min(100, (totalEligibleDays / daysRequired) * 100);

  return {
    daysInCanadaAsPR,
    preDaysCredit,
    totalAbsenceDays,
    totalEligibleDays,
    daysRequired,
    daysRemaining,
    isEligible,
    earliestApplicationDate,
    progress,
  };
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
