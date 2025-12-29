import { StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useAnalytics, useScreenTracking } from '@/hooks/useAnalytics';
import { 
  getEligibility, 
  getUpcomingTrips, 
  formatDate, 
  formatDaysRemaining 
} from '@/utils/eligibilityCalculations';
import { useIsDesktop } from '@/utils/responsive';

export default function TabOneScreen() {
  const router = useRouter();
  const { user, userProfile, profileLoading } = useAuth();
  const { trackEvent } = useAnalytics();
  const isDesktop = useIsDesktop('md');
  
  // Track screen view
  useScreenTracking('Dashboard');

  // Analytics tracking helpers
  const trackDashboardClick = (element: string, additionalParams?: Record<string, any>) => {
    trackEvent('dashboard_click', {
      element,
      has_complete_profile: hasCompleteProfile,
      is_eligible: eligibility?.isEligible,
      ...additionalParams,
    });
  };

  // Get display name or fallback to email
  const displayName = userProfile?.displayName || user?.email?.split('@')[0] || 'User';

  // Get backend-calculated eligibility
  const eligibility = getEligibility(userProfile);
  const upcomingTrips = getUpcomingTrips(userProfile);

  // Check if profile is complete enough to show calculations
  const hasCompleteProfile = userProfile?.prDate != null;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Pressable 
        style={[styles.header, { cursor: 'auto' }]}
        onPress={() => trackDashboardClick('greeting_section', {
          has_display_name: !!displayName,
        })}
      >
        <Text style={styles.greeting}>Welcome, eh! 🍁</Text>
        <Text style={styles.name}>
          {profileLoading ? '...' : displayName} 👋
        </Text>
      </Pressable>

      {/* Email Verification Warning */}
      {!user?.emailVerified && (
        <Pressable 
          style={[styles.warningBox, { cursor: 'auto' }]}
          onPress={() => trackDashboardClick('email_verification_warning')}
        >
          <FontAwesome name="exclamation-triangle" size={16} color="#92400e" />
          <Text style={styles.warningText}>
            Please verify your email to access all features
          </Text>
        </Pressable>
      )}

      {/* Upcoming Trips Alert */}
      {upcomingTrips > 0 && (
        <TouchableOpacity 
          style={styles.upcomingBox}
          onPress={() => {
            trackDashboardClick('upcoming_trips_alert', { trip_count: upcomingTrips });
            router.push('/(tabs)/absences' as any);
          }}
        >
          <FontAwesome name="plane" size={18} color="#f59e0b" />
          <View style={styles.upcomingContent}>
            <Text style={styles.upcomingText}>
              You have {upcomingTrips} upcoming {upcomingTrips === 1 ? 'trip' : 'trips'}
            </Text>
            <Text style={styles.upcomingSubtext}>
              Tap to view details
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color="#f59e0b" />
        </TouchableOpacity>
      )}

      {/* Main Content */}
      {!hasCompleteProfile ? (
        /* Incomplete Profile State */
        <View style={styles.section}>
          <View style={styles.incompleteCard}>
            <FontAwesome name="info-circle" size={32} color="#3b82f6" style={{ marginBottom: 12 }} />
            <Text style={styles.incompleteTitle}>Complete Your Profile</Text>
            <Text style={styles.incompleteText}>
              Add your PR date (even tentative) and immigration details to see your citizenship eligibility.
              {!isDesktop && '\n\n'}
              {isDesktop && ' '}
              This app is designed for permanent residents working towards Canadian citizenship.
              {'\n\n'}
              <Text style={styles.comingSoonText}>Other statuses (visitor, student, worker) coming soon!</Text>
            </Text>
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => {
                trackDashboardClick('complete_profile_button');
                router.push('/(tabs)/profile' as any);
              }}
            >
              <Text style={styles.completeButtonText}>Go to Profile</Text>
              <FontAwesome name="arrow-right" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Eligibility Dashboard */
        <View style={styles.section}>
          {/* Eligibility Status Card */}
          <Pressable 
            style={[
              styles.statusCard,
              eligibility.isEligible ? styles.statusCardEligible : styles.statusCardPending,
              { cursor: 'auto' }
            ]}
            onPress={() => trackDashboardClick('eligibility_status_card', {
              is_eligible: eligibility.isEligible,
              days_eligible: eligibility.totalEligibleDays,
            })}
          >
            <View style={styles.statusHeader}>
              <FontAwesome 
                name={eligibility.isEligible ? "check-circle" : "clock-o"} 
                size={24} 
                color={eligibility.isEligible ? "#10b981" : "#3b82f6"}
              />
              <Text style={styles.statusTitle}>
                {eligibility.isEligible ? 'Eligible to Apply!' : 'Building Eligibility'}
              </Text>
            </View>
            
            {eligibility.isEligible ? (
              <Text style={styles.statusMessage}>
                Congratulations! You've met the residency requirement for Canadian citizenship.
              </Text>
            ) : (
              <View>
                <Text style={styles.statusMessage}>
                  Keep building your days in Canada. You're on track!
                </Text>
                <Text style={styles.earliestDate}>
                  Earliest application date: <Text style={styles.dateHighlight}>
                    {formatDate(eligibility.earliestApplicationDate)}
                  </Text>
                </Text>
              </View>
            )}
          </Pressable>

          {/* Progress Bar */}
          <Pressable 
            style={[styles.progressCard, { cursor: 'auto' }]}
            onPress={() => trackDashboardClick('progress_card', {
              progress_percentage: Math.round(eligibility.progress),
              days_completed: eligibility.totalEligibleDays,
              days_remaining: eligibility.daysRemaining,
            })}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressPercentage}>
                {Math.round(eligibility.progress)}%
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.min(100, eligibility.progress)}%` }
                ]} 
              />
            </View>

            <View style={styles.progressStats}>
              <Text style={styles.progressDays}>
                {eligibility.totalEligibleDays} / {eligibility.daysRequired} days
              </Text>
              {!eligibility.isEligible && (
                <Text style={styles.progressRemaining}>
                  {formatDaysRemaining(eligibility.daysRemaining)} left
                </Text>
              )}
            </View>
          </Pressable>

          {/* Statistics Grid */}
          <View style={styles.statsGrid}>
            <Pressable 
              style={[styles.statCard, { cursor: 'auto' }]}
              onPress={() => trackDashboardClick('stat_card_click', {
                stat_type: 'days_as_pr',
                value: eligibility.daysInCanadaAsPR,
              })}
            >
              <FontAwesome name="home" size={20} color="#3b82f6" />
              <Text style={styles.statValue}>{eligibility.daysInCanadaAsPR}</Text>
              <Text style={styles.statLabel}>Days as PR</Text>
            </Pressable>

            <Pressable 
              style={[styles.statCard, { cursor: 'auto' }]}
              onPress={() => trackDashboardClick('stat_card_click', {
                stat_type: 'pre_pr_credit',
                value: eligibility.preDaysCredit,
              })}
            >
              <FontAwesome name="star" size={20} color="#f59e0b" />
              <Text style={styles.statValue}>{eligibility.preDaysCredit}</Text>
              <Text style={styles.statLabel}>Pre-PR Credit</Text>
            </Pressable>

            <Pressable 
              style={[styles.statCard, { cursor: 'auto' }]}
              onPress={() => trackDashboardClick('stat_card_click', {
                stat_type: 'absence_days',
                value: eligibility.totalAbsenceDays,
              })}
            >
              <FontAwesome name="plane" size={20} color="#ef4444" />
              <Text style={styles.statValue}>{eligibility.totalAbsenceDays}</Text>
              <Text style={styles.statLabel}>Absence Days</Text>
            </Pressable>
          </View>

          {/* How It's Calculated */}
          <Pressable 
            style={[styles.calculationCard, { cursor: 'auto' }]}
            onPress={() => trackDashboardClick('calculation_card', {
              days_as_pr: eligibility.daysInCanadaAsPR,
              pre_pr_credit: eligibility.preDaysCredit,
              absence_days: eligibility.totalAbsenceDays,
              total_eligible: eligibility.totalEligibleDays,
            })}
          >
            <Text style={styles.calculationTitle}>
              <FontAwesome name="calculator" size={14} /> How We Calculate
            </Text>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>+ Days as PR:</Text>
              <Text style={styles.calculationValue}>{eligibility.daysInCanadaAsPR}</Text>
            </View>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>+ Pre-PR credit (max 365):</Text>
              <Text style={styles.calculationValue}>+{eligibility.preDaysCredit}</Text>
            </View>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>- Absence days:</Text>
              <Text style={styles.calculationValue}>-{eligibility.totalAbsenceDays}</Text>
            </View>
            <View style={styles.calculationDivider} />
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabelBold}>Total eligible days:</Text>
              <Text style={styles.calculationValueBold}>{eligibility.totalEligibleDays}</Text>
            </View>
            
            <Text style={styles.calculationNote}>
              Note: Only the last 5 years count toward citizenship eligibility. Each day before PR counts as 0.5 days (max 365). Departure and return days count as present in Canada.
            </Text>
          </Pressable>

          {/* Quick Actions */}
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Quick Actions</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                trackDashboardClick('quick_action_update_profile');
                router.push('/(tabs)/profile' as any);
              }}
            >
              <FontAwesome name="user" size={16} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Update Profile</Text>
              <FontAwesome name="chevron-right" size={12} color="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                trackDashboardClick('quick_action_manage_travel');
                router.push('/(tabs)/absences' as any);
              }}
            >
              <FontAwesome name="plane" size={16} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Manage Travel History</Text>
              <FontAwesome name="chevron-right" size={12} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Disclaimers */}
          <Pressable 
            style={[styles.disclaimerCard, { cursor: 'auto' }]}
            onPress={() => trackDashboardClick('disclaimer_click')}
          >
            <FontAwesome name="info-circle" size={14} color="#64748b" />
            <Text style={styles.disclaimerText}>
              This calculation is based on the information you've provided and is for planning 
              purposes only. For official eligibility determination, consult IRCC or a licensed 
              immigration consultant.
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  warningBox: {
    marginTop: 16,
    marginHorizontal: 20,
    padding: 14,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  warningText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  upcomingBox: {
    margin: 20,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upcomingContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  upcomingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350f',
  },
  upcomingSubtext: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 2,
  },
  section: {
    padding: 20,
    paddingTop: 8,
  },
  incompleteCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  incompleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  incompleteText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  comingSoonText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  statusCardEligible: {
    borderColor: '#10b981',
  },
  statusCardPending: {
    borderColor: '#3b82f6',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusMessage: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  earliestDate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  dateHighlight: {
    fontWeight: '700',
    color: '#3b82f6',
  },
  progressCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    rowGap: 2,
  },
  progressDays: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    flexShrink: 0,
  },
  progressRemaining: {
    fontSize: 13,
    color: '#64748b',
    flexShrink: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  calculationCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  calculationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  calculationLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  calculationValue: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  calculationLabelBold: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  calculationValueBold: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  calculationDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 8,
  },
  calculationNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  actionsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  disclaimerCard: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#94a3b8',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});
