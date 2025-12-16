import { ScrollView, Platform } from 'react-native';
import { Box, VStack, Heading, Text, Link } from '@gluestack-ui/themed';
import WebContainer from '@/components/WebContainer';

export default function PrivacyPolicyScreen() {
  return (
    <WebContainer>
      <ScrollView style={{ flex: 1 }}>
        <Box flex={1} bg="$background" px="$4" py="$6">
          <VStack space="lg" maxWidth={800} alignSelf="center" width="100%">
            <VStack space="sm">
              <Heading size="2xl">Privacy Policy</Heading>
              <Text size="sm" color="$textLight600">Last Updated: December 16, 2025</Text>
              <Text size="sm" color="$textLight600">Version: 1.0.0</Text>
            </VStack>

            {/* Introduction */}
            <VStack space="sm">
              <Heading size="lg">Introduction</Heading>
              <Text>
                Journey to Citizen ("we", "our", or "the app") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, and safeguard your personal information 
                when you use our mobile application.
              </Text>
            </VStack>

            {/* Information We Collect */}
            <VStack space="sm">
              <Heading size="lg">Information We Collect</Heading>
              
              <Heading size="md">Personal Information You Provide</Heading>
              <Text>When you use Journey to Citizen, you may provide:</Text>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Account Information:</Text> Email address, display name</Text>
                <Text>• <Text fontWeight="$bold">Immigration Details:</Text> PR date, immigration status, country of origin</Text>
                <Text>• <Text fontWeight="$bold">Travel History:</Text> Dates of travel outside Canada, destinations</Text>
                <Text>• <Text fontWeight="$bold">Presence History:</Text> Dates of presence in Canada before PR, purpose of stay</Text>
              </VStack>

              <Heading size="md" mt="$2">Automatically Collected Information</Heading>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Usage Data:</Text> App features used, screens viewed, session duration</Text>
                <Text>• <Text fontWeight="$bold">Device Information:</Text> Device type, operating system, app version</Text>
                <Text>• <Text fontWeight="$bold">Analytics Data:</Text> Anonymous usage patterns to improve the app</Text>
              </VStack>
            </VStack>

            {/* How We Use Your Information */}
            <VStack space="sm">
              <Heading size="lg">How We Use Your Information</Heading>
              <Text>We use your information to:</Text>

              <Heading size="md">1. Provide Core Services</Heading>
              <VStack space="xs" ml="$4">
                <Text>• Calculate citizenship eligibility</Text>
                <Text>• Track physical presence in Canada</Text>
                <Text>• Store and manage your travel history</Text>
                <Text>• Display personalized dashboard and insights</Text>
              </VStack>

              <Heading size="md" mt="$2">2. Improve the App</Heading>
              <VStack space="xs" ml="$4">
                <Text>• Analyze usage patterns</Text>
                <Text>• Fix bugs and improve performance</Text>
                <Text>• Develop new features</Text>
              </VStack>

              <Heading size="md" mt="$2">3. Communicate with You</Heading>
              <VStack space="xs" ml="$4">
                <Text>• Send important updates about the app</Text>
                <Text>• Respond to support requests</Text>
                <Text>• Provide service-related notifications</Text>
              </VStack>
            </VStack>

            {/* Data Storage and Security */}
            <VStack space="sm">
              <Heading size="lg">Data Storage and Security</Heading>

              <Heading size="md">Where Your Data is Stored</Heading>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Firebase Firestore:</Text> All personal data is stored securely on Google Cloud Platform servers located in the United States</Text>
                <Text>• <Text fontWeight="$bold">Encryption:</Text> Data is encrypted both in transit (HTTPS) and at rest</Text>
              </VStack>

              <Heading size="md" mt="$2">Security Measures</Heading>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Authentication:</Text> Firebase Authentication with email/password</Text>
                <Text>• <Text fontWeight="$bold">Access Control:</Text> Only you can access your data through authenticated sessions</Text>
                <Text>• <Text fontWeight="$bold">Firestore Security Rules:</Text> Database-level security prevents unauthorized access</Text>
                <Text>• <Text fontWeight="$bold">No Third-Party Access:</Text> We do not share your data with third parties</Text>
              </VStack>

              <Heading size="md" mt="$2">Data Retention</Heading>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Active Accounts:</Text> Data retained as long as your account is active</Text>
                <Text>• <Text fontWeight="$bold">Account Deletion:</Text> You can request account deletion at any time by contacting support</Text>
                <Text>• <Text fontWeight="$bold">Deleted Data:</Text> Permanently removed within 30 days of deletion request</Text>
              </VStack>
            </VStack>

            {/* Your Rights */}
            <VStack space="sm">
              <Heading size="lg">Your Rights</Heading>
              <Text>You have the right to:</Text>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Access:</Text> View all data we have about you</Text>
                <Text>• <Text fontWeight="$bold">Correction:</Text> Update or correct your information</Text>
                <Text>• <Text fontWeight="$bold">Deletion:</Text> Request deletion of your account and data</Text>
                <Text>• <Text fontWeight="$bold">Export:</Text> Request a copy of your data (coming soon)</Text>
                <Text>• <Text fontWeight="$bold">Opt-Out:</Text> Disable analytics tracking in app settings</Text>
              </VStack>
            </VStack>

            {/* Third-Party Services */}
            <VStack space="sm">
              <Heading size="lg">Third-Party Services</Heading>
              <Text>We use the following third-party services:</Text>

              <Heading size="md">Firebase (Google)</Heading>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Purpose:</Text> Authentication, database, analytics, hosting</Text>
                <Text>• <Text fontWeight="$bold">Data Collected:</Text> Email, user ID, usage data</Text>
                <Text>• <Text fontWeight="$bold">Privacy Policy:</Text> <Link href="https://firebase.google.com/support/privacy" isExternal>
                  <Text color="$primary500">https://firebase.google.com/support/privacy</Text>
                </Link></Text>
              </VStack>

              <Heading size="md" mt="$2">Expo</Heading>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Purpose:</Text> App development platform</Text>
                <Text>• <Text fontWeight="$bold">Data Collected:</Text> Crash reports, performance metrics</Text>
                <Text>• <Text fontWeight="$bold">Privacy Policy:</Text> <Link href="https://expo.dev/privacy" isExternal>
                  <Text color="$primary500">https://expo.dev/privacy</Text>
                </Link></Text>
              </VStack>
            </VStack>

            {/* Children's Privacy */}
            <VStack space="sm">
              <Heading size="lg">Children's Privacy</Heading>
              <Text>
                Journey to Citizen is not intended for users under 18 years of age. We do not knowingly 
                collect information from children. If you believe a child has provided us with personal 
                information, please contact us immediately.
              </Text>
            </VStack>

            {/* Analytics */}
            <VStack space="sm">
              <Heading size="lg">Analytics</Heading>
              <Text>We use Firebase Analytics to understand how users interact with the app:</Text>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Data Collected:</Text> Screen views, button clicks, feature usage</Text>
                <Text>• <Text fontWeight="$bold">Purpose:</Text> Improve user experience and fix issues</Text>
                <Text>• <Text fontWeight="$bold">Anonymous:</Text> Analytics data is not linked to your personal information</Text>
                <Text>• <Text fontWeight="$bold">Opt-Out:</Text> Available in app settings (coming soon)</Text>
              </VStack>
            </VStack>

            {/* Cookies and Tracking */}
            <VStack space="sm">
              <Heading size="lg">Cookies and Tracking</Heading>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Web Version:</Text> Uses browser local storage for authentication persistence</Text>
                <Text>• <Text fontWeight="$bold">Mobile Apps:</Text> Uses secure device storage for session management</Text>
                <Text>• <Text fontWeight="$bold">No Advertising Cookies:</Text> We do not use advertising or tracking cookies</Text>
              </VStack>
            </VStack>

            {/* International Users */}
            <VStack space="sm">
              <Heading size="lg">International Users</Heading>
              <Text>
                Your data may be transferred to and stored on servers in the United States. By using 
                Journey to Citizen, you consent to this transfer.
              </Text>
              <Text mt="$2">For users in the European Economic Area (EEA):</Text>
              <VStack space="xs" ml="$4">
                <Text>• We comply with GDPR requirements</Text>
                <Text>• You have additional rights under GDPR (contact us for details)</Text>
              </VStack>
            </VStack>

            {/* Changes to This Policy */}
            <VStack space="sm">
              <Heading size="lg">Changes to This Policy</Heading>
              <Text>We may update this Privacy Policy from time to time. We will notify you of significant changes by:</Text>
              <VStack space="xs" ml="$4">
                <Text>• Updating the "Last Updated" date</Text>
                <Text>• Displaying an in-app notice</Text>
                <Text>• Sending an email notification (for major changes)</Text>
              </VStack>
            </VStack>

            {/* Contact Us */}
            <VStack space="sm">
              <Heading size="lg">Contact Us</Heading>
              <Text>For privacy-related questions or requests:</Text>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Email:</Text> privacy@journeytocitizen.com</Text>
                <Text>• <Text fontWeight="$bold">Support:</Text> support@journeytocitizen.com</Text>
              </VStack>
            </VStack>

            {/* Legal Disclaimer */}
            <VStack space="sm">
              <Heading size="lg">Legal Disclaimer</Heading>
              <Text>
                Journey to Citizen is an informational tool for planning purposes only. We do not provide 
                legal or immigration advice. For official guidance:
              </Text>
              <VStack space="xs" ml="$4" mt="$2">
                <Text>• Visit IRCC: <Link href="https://www.canada.ca/en/immigration-refugees-citizenship.html" isExternal>
                  <Text color="$primary500">https://www.canada.ca/en/immigration-refugees-citizenship.html</Text>
                </Link></Text>
                <Text>• Consult a licensed immigration consultant</Text>
                <Text>• Refer to official government resources</Text>
              </VStack>
            </VStack>

            {/* Consent */}
            <VStack space="sm" mb="$8">
              <Heading size="lg">Consent</Heading>
              <Text>
                By using Journey to Citizen, you consent to this Privacy Policy and our collection and use 
                of information as described.
              </Text>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </WebContainer>
  );
}
