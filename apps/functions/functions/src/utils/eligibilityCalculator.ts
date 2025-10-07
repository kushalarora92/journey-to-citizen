/**
 * Eligibility calculation utilities for Canadian citizenship
 * Calculates eligibility based on PR date, pre-PR presence, and travel absences
 */

import * as admin from "firebase-admin";
import {EligibilityCalculation} from "@journey-to-citizen/types";

interface ProfileData {
  prDate?: any; // Firestore Timestamp
  presenceInCanada?: Array<{
    from: any; // Firestore Timestamp
    to: any; // Firestore Timestamp
  }>;
  travelAbsences?: Array<{
    from: any; // Firestore Timestamp
    to: any; // Firestore Timestamp
  }>;
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
export function calculateEligibility(
  profile: ProfileData
): EligibilityCalculation {
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
    calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!profile || !profile.prDate) {
    return defaultResult;
  }

  const today = new Date();
  const prDate = profile.prDate.toDate ? profile.prDate.toDate() : new Date(profile.prDate);

  // Calculate days as PR
  const daysSincePR = Math.floor(
    (today.getTime() - prDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate pre-PR credit (max 365 days, each day counts as 0.5)
  let preDaysCredit = 0;
  if (profile.presenceInCanada && profile.presenceInCanada.length > 0) {
    const totalPrePRDays = profile.presenceInCanada.reduce((total, entry) => {
      const from = entry.from.toDate ? entry.from.toDate() : new Date(entry.from);
      const to = entry.to.toDate ? entry.to.toDate() : new Date(entry.to);
      const days =
        Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      return total + days;
    }, 0);

    // Each day before PR counts as 0.5 days, max 365 days credit
    preDaysCredit = Math.min(Math.floor(totalPrePRDays * 0.5), 365);
  }

  // Calculate absence days
  let totalAbsenceDays = 0;
  if (profile.travelAbsences && profile.travelAbsences.length > 0) {
    totalAbsenceDays = profile.travelAbsences
      .filter((absence) => {
        // Only count past absences
        const toDate = absence.to.toDate ? absence.to.toDate() : new Date(absence.to);
        return toDate <= today;
      })
      .reduce((total, absence) => {
        const from = absence.from.toDate ? absence.from.toDate() : new Date(absence.from);
        const to = absence.to.toDate ? absence.to.toDate() : new Date(absence.to);

        // Only count full days outside (exclude departure and return days)
        const days = Math.max(
          0,
          Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) - 1
        );
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
  let earliestApplicationDate: any = null;
  if (daysRemaining > 0) {
    // Assuming no future absences, calculate when they'll reach 1095 days
    const daysNeeded = daysRemaining;
    const futureDate = new Date(
      today.getTime() + daysNeeded * 24 * 60 * 60 * 1000
    );
    earliestApplicationDate = admin.firestore.Timestamp.fromDate(futureDate);
  } else {
    // Already eligible
    earliestApplicationDate = admin.firestore.Timestamp.fromDate(today);
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
    calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}
