import { ScrollView, Platform, Linking } from 'react-native';
import { Box, VStack, Heading, Text, Button, ButtonText, Link } from '@gluestack-ui/themed';
import WebContainer from '@/components/WebContainer';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function SupportScreen() {
  const SUPPORT_EMAIL = 'support@journeytocitizen.com';
  
  const handleEmailPress = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support Request - Journey to Citizen`);
  };

  return (
    <WebContainer>
      <ScrollView style={{ flex: 1 }}>
        <Box flex={1} bg="$background" px="$4" py="$6">
          <VStack space="lg" maxWidth={800} alignSelf="center" width="100%">
            <VStack space="sm">
              <Heading size="2xl">Support</Heading>
              <Text size="sm" color="$textLight600">
                We're here to help you on your journey to Canadian citizenship
              </Text>
            </VStack>

            {/* Contact Information */}
            <VStack space="md" bg="$backgroundLight100" p="$4" borderRadius="$lg">
              <Heading size="lg">Contact Us</Heading>
              <Text>
                For any questions, issues, or feedback, please don't hesitate to reach out:
              </Text>
              
              <VStack space="sm" mt="$2">
                <Text fontWeight="$bold">Email Support:</Text>
                <Button 
                  action="primary" 
                  onPress={handleEmailPress}
                  alignSelf="flex-start"
                >
                  <ButtonText>{SUPPORT_EMAIL}</ButtonText>
                </Button>

                <Text fontWeight="$bold" mt="$3">Privacy Questions:</Text>
                <Text>privacy@journeytocitizen.com</Text>
                
                <Text size="xs" color="$textLight500" mt="$2">
                  We typically respond within 24-48 hours
                </Text>
              </VStack>
            </VStack>

            {/* FAQ Section */}
            <VStack space="md">
              <Heading size="lg">Frequently Asked Questions</Heading>

              <VStack space="sm">
                <Heading size="md">How accurate is the eligibility calculator?</Heading>
                <Text>
                  Journey to Citizen uses the official IRCC rules to calculate your eligibility date. 
                  However, this app is for planning purposes only. For official confirmation, please 
                  consult IRCC or a licensed immigration consultant.
                </Text>
              </VStack>

              <VStack space="sm">
                <Heading size="md">Is my data secure?</Heading>
                <Text>
                  Yes! All your data is encrypted and stored securely using Firebase. Only you can 
                  access your information through your authenticated account. We do not share your 
                  data with any third parties.
                </Text>
              </VStack>

              <VStack space="sm">
                <Heading size="md">How do I delete my account?</Heading>
                <Text>
                  To delete your account and all associated data, please contact us at 
                  support@journeytocitizen.com with your request. Your data will be permanently 
                  removed within 30 days.
                </Text>
              </VStack>

              <VStack space="sm">
                <Heading size="md">Do I need to include day trips to the USA?</Heading>
                <Text>
                  Yes! According to IRCC rules, you must log all absences from Canada, including 
                  same-day trips to the United States. The app helps you track these easily.
                </Text>
              </VStack>

              <VStack space="sm">
                <Heading size="md">How is pre-PR time calculated?</Heading>
                <Text>
                  Each day you were physically present in Canada before becoming a permanent resident 
                  counts as half a day, up to a maximum of 365 days (1 year credit). You must have 
                  been authorized to be in Canada during this time.
                </Text>
              </VStack>

              <VStack space="sm">
                <Heading size="md">Can I export my travel history?</Heading>
                <Text>
                  Export functionality is coming soon! This will allow you to download your travel 
                  history in a format suitable for IRCC applications.
                </Text>
              </VStack>

              <VStack space="sm">
                <Heading size="md">The app isn't calculating correctly. What should I do?</Heading>
                <Text>
                  Please double-check that you've entered all information correctly:
                </Text>
                <VStack space="xs" ml="$4" mt="$2">
                  <Text>• PR landing date is accurate</Text>
                  <Text>• All travel absences are logged (including day trips)</Text>
                  <Text>• Pre-PR presence periods are entered if applicable</Text>
                  <Text>• Dates don't overlap or have errors</Text>
                </VStack>
                <Text mt="$2">
                  If the issue persists, please contact support with specific details about your case.
                </Text>
              </VStack>
            </VStack>

            {/* Official Resources */}
            <VStack space="md">
              <Heading size="lg">Official Resources</Heading>
              <Text>For official information about Canadian citizenship:</Text>

              <VStack space="sm" ml="$4">
                <Text>
                  • <Link href="https://www.canada.ca/en/immigration-refugees-citizenship.html" isExternal>
                    <Text color="$primary500">IRCC Official Website</Text>
                  </Link>
                </Text>
                <Text>
                  • <Link href="https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/become-canadian-citizen/eligibility.html" isExternal>
                    <Text color="$primary500">Citizenship Eligibility Requirements</Text>
                  </Link>
                </Text>
                <Text>
                  • <Link href="https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/become-canadian-citizen/apply.html" isExternal>
                    <Text color="$primary500">How to Apply for Citizenship</Text>
                  </Link>
                </Text>
                <Text>
                  • <Link href="https://eservices.cic.gc.ca/rescalc/resCalcStartNew.do?lang=en" isExternal>
                    <Text color="$primary500">IRCC Physical Presence Calculator</Text>
                  </Link>
                </Text>
              </VStack>
            </VStack>

            {/* App Information */}
            <VStack space="md" mb="$8">
              <Heading size="lg">About Journey to Citizen</Heading>
              <Text>
                Journey to Citizen is an independent tool created to help permanent residents track 
                their path to Canadian citizenship. We are not affiliated with IRCC or the Government 
                of Canada.
              </Text>
              <Text mt="$2">
                Version 1.0.0 • Last Updated: December 16, 2025
              </Text>
              <Text mt="$2">
                <Link href="/privacy" isExternal>
                  <Text color="$primary500">Privacy Policy</Text>
                </Link>
              </Text>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </WebContainer>
  );
}
