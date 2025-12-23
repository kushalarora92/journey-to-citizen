import { ScrollView, Linking } from 'react-native';
import { Box, VStack, Heading, Text, Button, ButtonText, Link } from '@gluestack-ui/themed';
import WebContainer from '@/components/WebContainer';

export default function DeleteAccountScreen() {
  const SUPPORT_EMAIL = 'support@journeytocitizen.com';
  
  const handleEmailPress = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Account Deletion Request`);
  };

  return (
    <WebContainer>
      <ScrollView style={{ flex: 1 }}>
        <Box flex={1} bg="$background" px="$4" py="$6">
          <VStack space="lg" maxWidth={800} alignSelf="center" width="100%">
            <VStack space="sm">
              <Heading size="2xl">Delete Your Account</Heading>
              <Text size="sm" color="$textLight600">Journey to Citizen</Text>
            </VStack>

            <Text>
              If you would like to delete your Journey to Citizen account and all associated data, 
              please follow the steps below.
            </Text>

            {/* Steps to Request Deletion */}
            <VStack space="md" bg="$backgroundLight100" p="$4" borderRadius="$lg">
              <Heading size="lg">Steps to Request Account Deletion</Heading>
              
              <VStack space="sm">
                <Text><Text fontWeight="$bold">1.</Text> Send an email to: {SUPPORT_EMAIL}</Text>
                <Text><Text fontWeight="$bold">2.</Text> Subject line: Account Deletion Request</Text>
                <Text><Text fontWeight="$bold">3.</Text> Include the following information:</Text>
                <VStack space="xs" ml="$4">
                  <Text>• Your registered email address (the one used to create your account)</Text>
                  <Text>• A brief statement confirming you want to delete your account and all associated data</Text>
                </VStack>
                <Text><Text fontWeight="$bold">4.</Text> Verification: We may contact you to verify your identity before processing the deletion</Text>
                <Text><Text fontWeight="$bold">5.</Text> Processing: Your request will be processed within <Text fontWeight="$bold">30 days</Text></Text>
                <Text><Text fontWeight="$bold">6.</Text> Confirmation: You will receive an email once your account has been permanently deleted</Text>
              </VStack>

              <Button 
                action="primary" 
                onPress={handleEmailPress}
                alignSelf="flex-start"
                mt="$2"
              >
                <ButtonText>Email Support for Deletion</ButtonText>
              </Button>
            </VStack>

            {/* What Data Will Be Deleted */}
            <VStack space="sm">
              <Heading size="lg">What Data Will Be Deleted</Heading>
              <Text>
                When you request account deletion, the following data will be <Text fontWeight="$bold">permanently deleted</Text>:
              </Text>
              <VStack space="xs" ml="$4">
                <Text>• Your account information (email address, display name)</Text>
                <Text>• Your profile data (PR date, immigration status, country of origin)</Text>
                <Text>• Your travel history and absence records</Text>
                <Text>• Your physical presence records in Canada</Text>
                <Text>• All analytics and usage data associated with your account</Text>
              </VStack>
            </VStack>

            {/* Data Retention */}
            <VStack space="sm">
              <Heading size="lg">Data Retention</Heading>
              <VStack space="xs" ml="$4">
                <Text>• <Text fontWeight="$bold">Immediate deletion:</Text> Most data is deleted within 30 days of your request</Text>
                <Text>• <Text fontWeight="$bold">No data is retained</Text> after processing your deletion request, except where required by law (e.g., financial records for tax purposes, which are retained for the minimum period required by applicable laws)</Text>
                <Text>• <Text fontWeight="$bold">Backups:</Text> Data in system backups will be deleted within 90 days</Text>
              </VStack>
            </VStack>

            {/* Important Notice */}
            <VStack space="sm" bg="$warning100" p="$4" borderRadius="$lg" borderLeftWidth={4} borderLeftColor="$warning500">
              <Heading size="md">⚠️ Important Notice</Heading>
              <Text>
                Account deletion is permanent and cannot be undone. Before requesting deletion, make sure 
                you have exported or saved any data you wish to keep. Once deleted, your account and all 
                associated information cannot be recovered.
              </Text>
            </VStack>

            {/* Questions */}
            <VStack space="sm" mb="$8">
              <Heading size="lg">Questions?</Heading>
              <Text>
                If you have questions about account deletion or data privacy, please contact us at{' '}
                <Text fontWeight="$bold">{SUPPORT_EMAIL}</Text> or review our{' '}
                <Link href="/privacy" isExternal>
                  <Text color="$primary500">Privacy Policy</Text>
                </Link>.
              </Text>
            </VStack>

            <Text size="sm" color="$textLight600" mb="$4">
              Last updated: December 22, 2025
            </Text>
          </VStack>
        </Box>
      </ScrollView>
    </WebContainer>
  );
}
