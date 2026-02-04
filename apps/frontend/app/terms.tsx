import { ScrollView } from 'react-native';
import { Box, VStack, Heading, Text, Link } from '@gluestack-ui/themed';
import WebContainer from '@/components/WebContainer';

export default function TermsOfServiceScreen() {
  return (
    <WebContainer>
      <ScrollView style={{ flex: 1 }}>
        <Box flex={1} bg="$background" px="$4" py="$6">
          <VStack space="lg" maxWidth={800} alignSelf="center" width="100%">
            <VStack space="sm">
              <Heading size="2xl">Terms of Service</Heading>
              <Text size="sm" color="$textLight600">Last Updated: February 2, 2026</Text>
              <Text size="sm" color="$textLight600">Version: 1.0.0</Text>
            </VStack>

            {/* Acceptance of Terms */}
            <VStack space="sm">
              <Heading size="lg">1. Acceptance of Terms</Heading>
              <Text>
                By accessing or using Journey to Citizen ("the App"), you agree to be bound by these 
                Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.
              </Text>
            </VStack>

            {/* Nature of Service */}
            <VStack space="sm" bg="$warning100" p="$4" borderRadius="$lg" borderWidth={1} borderColor="$warning500">
              <Heading size="lg" color="$warning700">2. ⚠️ Nature of Service - Critical Notice</Heading>
              <VStack space="xs" mt="$2">
                <Text><Text fontWeight="$bold">2.1 Side Project:</Text> Journey to Citizen is a personal side project created and maintained by an individual developer. It is NOT a commercial service, professional tool, or government-affiliated application.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">2.2 No Professional Service:</Text> This App does NOT provide legal advice, immigration consulting, or professional services of any kind. It is purely an informational tool.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">2.3 Not Immigration Advice:</Text> The App provides calculations and tracking features based on publicly available IRCC rules. This does NOT constitute legal or immigration advice. Always consult official IRCC resources or licensed immigration consultants.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">2.4 Unofficial Tool:</Text> This App is NOT affiliated with, endorsed by, or connected to Immigration, Refugees and Citizenship Canada (IRCC) or the Government of Canada.</Text>
              </VStack>
            </VStack>

            {/* Disclaimer of Warranties */}
            <VStack space="sm">
              <Heading size="lg">3. Disclaimer of Warranties</Heading>
              <VStack space="xs">
                <Text><Text fontWeight="$bold">3.1 "AS IS" Basis:</Text> THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">3.2 No Guarantee of Accuracy:</Text> We make no warranty that:</Text>
                <VStack space="xs" ml="$4">
                  <Text>• The App will be error-free or uninterrupted</Text>
                  <Text>• Calculations or information will be accurate or current</Text>
                  <Text>• The App will meet your specific needs</Text>
                  <Text>• Any errors or bugs will be corrected</Text>
                </VStack>

                <Text mt="$2"><Text fontWeight="$bold">3.3 Rules Change:</Text> Canadian immigration rules, policies, and requirements change frequently. Information in the App may become outdated without notice. ALWAYS verify with official IRCC sources.</Text>
              </VStack>
            </VStack>

            {/* Limitation of Liability */}
            <VStack space="sm">
              <Heading size="lg">4. Limitation of Liability</Heading>
              <VStack space="xs">
                <Text><Text fontWeight="$bold">4.1 No Liability:</Text> TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE CREATOR, DEVELOPER, AND ANY AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:</Text>
                <VStack space="xs" ml="$4">
                  <Text>• Your use or inability to use the App</Text>
                  <Text>• Any inaccurate calculations or information</Text>
                  <Text>• Reliance on information provided by the App</Text>
                  <Text>• Missed deadlines, incorrect eligibility dates, or application errors</Text>
                  <Text>• Immigration application rejections or delays</Text>
                  <Text>• Any other matter related to the App</Text>
                </VStack>

                <Text mt="$2"><Text fontWeight="$bold">4.2 Maximum Liability:</Text> In no event shall our total liability to you for all damages exceed the amount you paid to use the App (which is $0, as the App is free).</Text>
              </VStack>
            </VStack>

            {/* User Responsibilities */}
            <VStack space="sm">
              <Heading size="lg">5. User Responsibilities</Heading>
              <VStack space="xs">
                <Text><Text fontWeight="$bold">5.1 Verify Information:</Text> You are solely responsible for verifying all information with official IRCC sources before making any decisions or submitting any applications.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">5.2 Own Risk:</Text> You use the App entirely at your own risk. Any decisions you make based on information from the App are your sole responsibility.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">5.3 Account Security:</Text> You are responsible for maintaining the security of your account credentials.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">5.4 Accurate Data Entry:</Text> You are responsible for entering accurate information into the App.</Text>
              </VStack>
            </VStack>

            {/* Indemnification */}
            <VStack space="sm">
              <Heading size="lg">6. Indemnification</Heading>
              <Text>
                You agree to indemnify, defend, and hold harmless the creator, developer, and any affiliates 
                from and against any claims, liabilities, damages, losses, costs, expenses, or fees (including 
                reasonable attorneys' fees) arising from:
              </Text>
              <VStack space="xs" ml="$4">
                <Text>• Your use of the App</Text>
                <Text>• Your violation of these Terms</Text>
                <Text>• Your violation of any rights of another party</Text>
                <Text>• Any immigration application issues or consequences</Text>
              </VStack>
            </VStack>

            {/* Updates and Maintenance */}
            <VStack space="sm">
              <Heading size="lg">7. Updates and Maintenance</Heading>
              <VStack space="xs">
                <Text><Text fontWeight="$bold">7.1 No Guarantee of Updates:</Text> As a side project, updates may be infrequent or delayed. We do not guarantee regular updates, bug fixes, or feature additions.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">7.2 Service Interruption:</Text> The App may be unavailable at any time for maintenance, updates, or other reasons without notice.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">7.3 Discontinuation:</Text> We reserve the right to discontinue the App at any time without notice or liability.</Text>
              </VStack>
            </VStack>

            {/* Governing Law and Jurisdiction */}
            <VStack space="sm">
              <Heading size="lg">8. Governing Law and Jurisdiction</Heading>
              <VStack space="xs">
                <Text><Text fontWeight="$bold">8.1 Governing Law:</Text> These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario, Canada, without regard to its conflict of law provisions.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">8.2 Jurisdiction:</Text> You agree that any legal action or proceeding arising out of or relating to these Terms or the App shall be filed exclusively in the courts located in Ontario, Canada, and you hereby consent to the personal jurisdiction of such courts.</Text>
              </VStack>
            </VStack>

            {/* Dispute Resolution */}
            <VStack space="sm">
              <Heading size="lg">9. Dispute Resolution</Heading>
              <VStack space="xs">
                <Text><Text fontWeight="$bold">9.1 Informal Resolution:</Text> Before filing any formal legal action, you agree to first contact us at support@journeytocitizen.com to attempt to resolve the dispute informally.</Text>
                
                <Text mt="$2"><Text fontWeight="$bold">9.2 No Class Actions:</Text> You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.</Text>
              </VStack>
            </VStack>

            {/* Severability */}
            <VStack space="sm">
              <Heading size="lg">10. Severability</Heading>
              <Text>
                If any provision of these Terms is found to be invalid or unenforceable, the remaining 
                provisions shall continue in full force and effect.
              </Text>
            </VStack>

            {/* Entire Agreement */}
            <VStack space="sm">
              <Heading size="lg">11. Entire Agreement</Heading>
              <Text>
                These Terms, together with our Privacy Policy, constitute the entire agreement between you 
                and Journey to Citizen regarding the use of the App.
              </Text>
            </VStack>

            {/* Termination */}
            <VStack space="sm">
              <Heading size="lg">12. Termination</Heading>
              <Text>
                We reserve the right to suspend or terminate accounts at any time, with or without notice, 
                for any reason including violation of these Terms. Users may request deletion through 
                the app. See our Privacy Policy for details on data retention and deletion.
              </Text>
            </VStack>

            {/* Changes to Terms */}
            <VStack space="sm">
              <Heading size="lg">13. Changes to Terms</Heading>
              <Text>
                We reserve the right to modify these Terms at any time. We will notify users of significant 
                changes by updating the "Last Updated" date and displaying an in-app notice. Your continued 
                use of the App after changes constitutes acceptance of the modified Terms.
              </Text>
            </VStack>

            {/* Contact */}
            <VStack space="sm">
              <Heading size="lg">14. Contact</Heading>
              <Text>For questions about these Terms, contact us at:</Text>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Email:</Text> support@journeytocitizen.com</Text>
                <Text>• <Text fontWeight="$bold">Privacy Questions:</Text> privacy@journeytocitizen.com</Text>
              </VStack>
            </VStack>

            {/* Final Warning */}
            <VStack space="sm" bg="$error100" p="$4" borderRadius="$lg" borderWidth={2} borderColor="$error500" mb="$8">
              <Heading size="md" color="$error700">⚠️ IMPORTANT: Read Carefully</Heading>
              <Text color="$error700" mt="$2">
                By using this App, you acknowledge that you have read, understood, and agree to these Terms. 
                You understand that this is NOT a professional service, calculations may be incorrect, and you 
                use the App at your own risk. You agree to verify ALL information with official IRCC sources 
                before making any decisions.
              </Text>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </WebContainer>
  );
}
