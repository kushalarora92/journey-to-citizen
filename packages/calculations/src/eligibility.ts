/**
 * Eligibility Calculations for Canadian Citizenship
 * 
 * Shared calculation logic used by both backend (Cloud Functions) and frontend.
 * 
 * Key rules:
 * - Need 1095 days (3 years) of physical presence in Canada within 5 years before applying
 * - Days as PR count fully
 * - Days before PR on work/study permit or protected person count as 0.5 days (max 365 credit)
 * - Absences during pre-PR periods are deducted before applying the 0.5 multiplier
 * - Visitor days do NOT count
 * - Departure and return days count as present in Canada (only full days absent count)
 */

import {
  UserProfile,
  StatusEntry,
  AbsenceEntry,
  PresenceEntry,
  StaticEligibilityData,
  getPRDate,
  getPrePRPresence,
} from '@journey-to-citizen/types';

/** Days required for citizenship eligibility */
export const DAYS_REQUIRED = 1095;

/** Maximum pre-PR credit allowed */
export const MAX_PRE_PR_CREDIT = 365;

/** Status types that count toward citizenship (visitor does NOT count) */
export const COUNTABLE_STATUSES = ['study_permit', 'work_permit', 'protected_person'] as const;

/**
 * Date range with from/to dates
 */
interface DateRange {
  from: string;
  to: string;
}

/**
 * Result of projection calculation for non-PR users
 */
export interface ProjectionResult {
  /** Total countable days in Canada (after deducting absences) */
  totalCountableDays: number;
  /** Gross days before absence deduction */
  grossDays: number;
  /** Days deducted due to absences */
  absenceDaysDeducted: number;
  /** Projected pre-PR credit if user got PR today (50% of days, max 365) */
  projectedCredit: number;
  /** Days user would need as PR to reach 1095 */
  daysNeededAsPR: number;
  /** Projected earliest application date if user got PR today */
  projectedEarliestDate: string;
}

/**
 * Convert date string (YYYY-MM-DD) to Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
}

/**
 * Convert Date object to date string (YYYY-MM-DD)
 */
export function formatDateToString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Merge overlapping date ranges to prevent double-counting
 * Sorts ranges by start date and merges overlapping/adjacent ranges
 */
export function mergeOverlappingDateRanges(
  ranges: DateRange[]
): DateRange[] {
  if (ranges.length === 0) return [];

  // Sort by start date
  const sorted = [...ranges].sort((a, b) => {
    return parseDate(a.from).getTime() - parseDate(b.from).getTime();
  });

  const merged: DateRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    const currentStart = parseDate(current.from);
    const currentEnd = parseDate(current.to);
    const lastEnd = parseDate(last.to);

    // Check if current range overlaps or is adjacent to last merged range
    const oneDayAfterLast = new Date(lastEnd);
    oneDayAfterLast.setDate(oneDayAfterLast.getDate() + 1);

    if (currentStart <= oneDayAfterLast) {
      // Overlapping or adjacent - merge by extending the end date
      if (currentEnd > lastEnd) {
        last.to = current.to;
      }
    } else {
      // No overlap - add as new range
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate static eligibility data for PR users
 * This is the main calculation used by backend to store eligibility data
 * 
 * @param profile - User profile data
 * @param referenceDate - Date to calculate from (defaults to today, useful for testing)
 * @returns Static eligibility data or null if user doesn't have PR
 */
export function calculateStaticEligibility(
  profile: Partial<UserProfile>,
  referenceDate?: Date
): StaticEligibilityData | null {
  // Get PR date using helper (works with both formats)
  const prDateStr = getPRDate(profile as UserProfile);
  
  if (!prDateStr) {
    // No PR date - return null (frontend will handle projection for non-PR users)
    return null;
  }

  const today = referenceDate || new Date();
  const prDate = parseDate(prDateStr);

  // Calculate 5-year eligibility window
  const fiveYearsAgo = new Date(today);
  fiveYearsAgo.setFullYear(today.getFullYear() - 5);

  // Start counting from PR date OR 5 years ago, whichever is later
  const eligibilityWindowStart = prDate > fiveYearsAgo ? prDate : fiveYearsAgo;

  // Calculate days in the eligibility window
  const daysInWindow = daysBetween(eligibilityWindowStart, today);

  // Calculate pre-PR credit
  const preDaysCredit = calculatePrePRCredit(profile, prDateStr);

  // Calculate absence days
  const totalAbsenceDays = calculateAbsenceDays(
    profile.travelAbsences || [],
    eligibilityWindowStart,
    today
  );

  // Days as PR = raw days in the eligibility window
  const daysInCanadaAsPR = daysInWindow;

  // Calculate total eligible days
  const totalEligibleDays = daysInCanadaAsPR + preDaysCredit - totalAbsenceDays;
  const daysRemaining = Math.max(0, DAYS_REQUIRED - totalEligibleDays);

  // Calculate earliest application date
  let earliestDate: Date;
  if (daysRemaining > 0) {
    earliestDate = new Date(today.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
  } else {
    earliestDate = today;
  }

  return {
    daysInCanadaAsPR,
    preDaysCredit,
    totalAbsenceDays,
    earliestEligibilityDate: formatDateToString(earliestDate),
  };
}

/**
 * Calculate pre-PR credit from status history or legacy presence data
 * 
 * @param profile - User profile
 * @param prDateStr - PR date string (entries after this date are excluded)
 * @returns Pre-PR credit (max 365)
 */
export function calculatePrePRCredit(
  profile: Partial<UserProfile>,
  prDateStr?: string
): number {
  // Get pre-PR presence using helper (works with both formats)
  const prePRPresence = getPrePRPresence(profile as UserProfile);
  
  // Filter to only include countable statuses
  const countablePresence = prePRPresence.filter(
    (entry) => COUNTABLE_STATUSES.includes(entry.status as typeof COUNTABLE_STATUSES[number])
  );

  if (countablePresence.length > 0) {
    // Merge overlapping presence entries to prevent double-counting
    const mergedPresence = mergeOverlappingDateRanges(countablePresence);

    // Calculate gross days from countable status periods
    let grossPrePRDays = 0;
    const countableRanges: { from: Date; to: Date }[] = [];
    
    mergedPresence.forEach(entry => {
      const from = parseDate(entry.from);
      const to = parseDate(entry.to);
      const days = daysBetween(from, to) + 1; // +1 to include both start and end days
      grossPrePRDays += days;
      countableRanges.push({ from, to });
    });

    // Deduct absences that occurred during pre-PR countable periods
    let absenceDaysDeducted = 0;
    if (profile.travelAbsences && profile.travelAbsences.length > 0) {
      profile.travelAbsences.forEach((absence: AbsenceEntry) => {
        const absenceFrom = parseDate(absence.from);
        const absenceTo = parseDate(absence.to);

        // Check each countable range for overlap with this absence
        countableRanges.forEach((range) => {
          const overlapStart = new Date(Math.max(absenceFrom.getTime(), range.from.getTime()));
          const overlapEnd = new Date(Math.min(absenceTo.getTime(), range.to.getTime()));

          if (overlapStart < overlapEnd) {
            // Per IRCC rules: departure and return days count as present
            const overlapDays = daysBetween(overlapStart, overlapEnd);
            const fullDaysAbsent = Math.max(0, overlapDays - 1);
            absenceDaysDeducted += fullDaysAbsent;
          }
        });
      });
    }

    const netPrePRDays = Math.max(0, grossPrePRDays - absenceDaysDeducted);

    // Each day before PR counts as 0.5 days, max 365 days credit
    return Math.min(Math.floor(netPrePRDays * 0.5), MAX_PRE_PR_CREDIT);
  }
  
  // Fallback to legacy presenceInCanada if helper returned empty
  if (profile.presenceInCanada && profile.presenceInCanada.length > 0) {
    const countablePurposes = ['study_permit', 'work_permit', 'protected_person'];
    const countableLegacyPresence = profile.presenceInCanada.filter(
      (entry: PresenceEntry) => countablePurposes.includes(entry.purpose)
    );
    
    if (countableLegacyPresence.length > 0) {
      const mergedPresence = mergeOverlappingDateRanges(countableLegacyPresence);

      // Calculate gross days
      let grossPrePRDays = 0;
      const countableRanges: { from: Date; to: Date }[] = [];
      
      mergedPresence.forEach(entry => {
        const from = parseDate(entry.from);
        const to = parseDate(entry.to);
        const days = daysBetween(from, to) + 1;
        grossPrePRDays += days;
        countableRanges.push({ from, to });
      });

      // Deduct absences during legacy presence periods
      let absenceDaysDeducted = 0;
      if (profile.travelAbsences && profile.travelAbsences.length > 0) {
        profile.travelAbsences.forEach((absence: AbsenceEntry) => {
          const absenceFrom = parseDate(absence.from);
          const absenceTo = parseDate(absence.to);

          countableRanges.forEach((range) => {
            const overlapStart = new Date(Math.max(absenceFrom.getTime(), range.from.getTime()));
            const overlapEnd = new Date(Math.min(absenceTo.getTime(), range.to.getTime()));

            if (overlapStart < overlapEnd) {
              const overlapDays = daysBetween(overlapStart, overlapEnd);
              const fullDaysAbsent = Math.max(0, overlapDays - 1);
              absenceDaysDeducted += fullDaysAbsent;
            }
          });
        });
      }

      const netPrePRDays = Math.max(0, grossPrePRDays - absenceDaysDeducted);

      return Math.min(Math.floor(netPrePRDays * 0.5), MAX_PRE_PR_CREDIT);
    }
  }

  return 0;
}

/**
 * Calculate total absence days within a date range
 * Per IRCC rules: departure and return days count as present in Canada
 * 
 * @param absences - Array of absence entries
 * @param windowStart - Start of eligibility window
 * @param windowEnd - End of eligibility window (usually today)
 * @returns Total absence days
 */
export function calculateAbsenceDays(
  absences: AbsenceEntry[],
  windowStart: Date,
  windowEnd: Date
): number {
  if (!absences || absences.length === 0) {
    return 0;
  }

  // Filter absences that overlap with the window
  const relevantAbsences = absences
    .filter((absence) => {
      const fromDate = parseDate(absence.from);
      const toDate = parseDate(absence.to);
      return toDate >= windowStart && fromDate <= windowEnd;
    })
    .map((absence) => ({
      from: absence.from,
      to: absence.to,
    }));

  // Merge overlapping absences to prevent double-counting
  const mergedAbsences = mergeOverlappingDateRanges(relevantAbsences);

  return mergedAbsences.reduce((total, absence) => {
    const from = parseDate(absence.from);
    const to = parseDate(absence.to);

    // Clamp absence to the window
    const effectiveFrom = from < windowStart ? windowStart : from;
    const effectiveTo = to > windowEnd ? windowEnd : to;

    // Only count full days outside (exclude departure and return days)
    const days = Math.max(0, daysBetween(effectiveFrom, effectiveTo) - 1);
    return total + days;
  }, 0);
}

/**
 * Calculate projection for non-PR users (work/study permit holders, visitors)
 * Shows what their eligibility would look like if they got PR today
 * 
 * @param profile - User profile data
 * @param referenceDate - Date to calculate from (defaults to today)
 * @returns Projection result
 */
export function calculateProjection(
  profile: Partial<UserProfile>,
  referenceDate?: Date
): ProjectionResult {
  const today = referenceDate || new Date();
  const fiveYearsAgo = new Date(today);
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  // Default result for users with no status history
  const defaultResult: ProjectionResult = {
    totalCountableDays: 0,
    grossDays: 0,
    absenceDaysDeducted: 0,
    projectedCredit: 0,
    daysNeededAsPR: DAYS_REQUIRED,
    projectedEarliestDate: formatDateToString(
      new Date(today.getTime() + DAYS_REQUIRED * 24 * 60 * 60 * 1000)
    ),
  };

  if (!profile.statusHistory || profile.statusHistory.length === 0) {
    return defaultResult;
  }

  // Build array of countable day ranges (within last 5 years, excluding PR status)
  const countableRanges: { from: Date; to: Date }[] = [];

  profile.statusHistory.forEach((entry: StatusEntry) => {
    // Only count entries with countable statuses (not visitor, not PR)
    if (COUNTABLE_STATUSES.includes(entry.status as typeof COUNTABLE_STATUSES[number])) {
      let from = parseDate(entry.from);
      let to = entry.to ? parseDate(entry.to) : today;

      // Clamp to 5-year window
      if (from < fiveYearsAgo) from = new Date(fiveYearsAgo);
      if (to > today) to = new Date(today);

      // Only add if range is valid
      if (from < to && to > fiveYearsAgo) {
        countableRanges.push({ from, to });
      }
    }
  });

  // Calculate gross days from countable status periods
  let grossDays = 0;
  countableRanges.forEach((range) => {
    const days = daysBetween(range.from, range.to);
    grossDays += Math.max(0, days);
  });

  // Calculate absence days that overlap with countable periods
  let absenceDaysDeducted = 0;
  if (profile.travelAbsences && profile.travelAbsences.length > 0) {
    profile.travelAbsences.forEach((absence: AbsenceEntry) => {
      const absenceFrom = parseDate(absence.from);
      const absenceTo = parseDate(absence.to);

      // Check each countable range for overlap
      countableRanges.forEach((range) => {
        const overlapStart = new Date(Math.max(absenceFrom.getTime(), range.from.getTime()));
        const overlapEnd = new Date(Math.min(absenceTo.getTime(), range.to.getTime()));

        if (overlapStart < overlapEnd) {
          // Per IRCC rules: departure and return days count as present
          const overlapDays = daysBetween(overlapStart, overlapEnd);
          const fullDaysAbsent = Math.max(0, overlapDays - 1);
          absenceDaysDeducted += fullDaysAbsent;
        }
      });
    });
  }

  const totalCountableDays = Math.max(0, grossDays - absenceDaysDeducted);
  const projectedCredit = Math.min(Math.floor(totalCountableDays * 0.5), MAX_PRE_PR_CREDIT);
  const daysNeededAsPR = Math.max(0, DAYS_REQUIRED - projectedCredit);
  
  const projectedEarliestDate = new Date(today.getTime() + daysNeededAsPR * 24 * 60 * 60 * 1000);

  return {
    totalCountableDays,
    grossDays,
    absenceDaysDeducted,
    projectedCredit,
    daysNeededAsPR,
    projectedEarliestDate: formatDateToString(projectedEarliestDate),
  };
}

/**
 * Check if eligibility-relevant fields have changed
 * Used by backend to determine if recalculation is needed
 */
export function hasEligibilityFieldsChanged(
  userData: Record<string, unknown>,
  existingData: Record<string, unknown>,
  isNewUser: boolean
): boolean {
  if (isNewUser) {
    return true;
  }

  return (
    // NEW: statusHistory changes
    (userData.statusHistory !== undefined &&
      JSON.stringify(userData.statusHistory) !==
        JSON.stringify(existingData.statusHistory)) ||
    // LEGACY: prDate changes
    (userData.prDate !== undefined &&
      JSON.stringify(userData.prDate) !==
        JSON.stringify(existingData.prDate)) ||
    // LEGACY: presenceInCanada changes
    (userData.presenceInCanada !== undefined &&
      JSON.stringify(userData.presenceInCanada) !==
        JSON.stringify(existingData.presenceInCanada)) ||
    // Travel absences changes (used by both)
    (userData.travelAbsences !== undefined &&
      JSON.stringify(userData.travelAbsences) !==
        JSON.stringify(existingData.travelAbsences))
  );
}
