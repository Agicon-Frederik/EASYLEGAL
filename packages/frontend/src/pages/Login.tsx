import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Card, Heading, Text, Input, Button, Alert, Stack } from '@chakra-ui/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/request-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          language: localStorage.getItem('i18nextLng') || 'en',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
      } else {
        setError(data.message || t('auth.errors.serverError'));
      }
    } catch (err) {
      setError(t('auth.errors.serverError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    setError('');
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      px={4}
    >
      <Card.Root maxW="md" w="full" p={8}>
        <Stack gap={6}>
          <Box textAlign="center">
            <Heading size="lg" mb={2}>
              {t('auth.login.title')}
            </Heading>
            <Text color="gray.600" fontSize="sm">
              {t('auth.login.subtitle')}
            </Text>
          </Box>

          {!emailSent ? (
            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                {error && (
                  <Alert.Root status="error">
                    <Alert.Indicator />
                    <Alert.Title>{error}</Alert.Title>
                  </Alert.Root>
                )}

                <Box>
                  <Text fontWeight="medium" mb={2} fontSize="sm">
                    {t('auth.login.emailLabel')}
                  </Text>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.login.emailPlaceholder')}
                    required
                    disabled={isSubmitting}
                    size="lg"
                  />
                </Box>

                <Button
                  type="submit"
                  colorPalette="brand"
                  size="lg"
                  w="full"
                  loading={isSubmitting}
                >
                  {t('auth.login.submitButton')}
                </Button>
              </Stack>
            </form>
          ) : (
            <Stack gap={4}>
              <Alert.Root status="success">
                <Alert.Indicator />
                <Alert.Title>{t('auth.login.checkEmail')}</Alert.Title>
                <Alert.Description>
                  {t('auth.login.emailSentMessage', { email })}
                </Alert.Description>
              </Alert.Root>

              <Box textAlign="center">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  {t('auth.login.resendLink')}
                </Text>
                <Button
                  variant="ghost"
                  colorPalette="brand"
                  onClick={handleResend}
                  size="sm"
                >
                  {t('auth.login.resendButton')}
                </Button>
              </Box>
            </Stack>
          )}
        </Stack>
      </Card.Root>
    </Box>
  );
}
