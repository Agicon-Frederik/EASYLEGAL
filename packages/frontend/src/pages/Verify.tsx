import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Box, Card, Heading, Text, Button, Spinner, Alert, Stack } from '@chakra-ui/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function Verify() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'expired'>('verifying');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('failed');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/verify-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success && data.token && data.user) {
          setStatus('success');
          login(data.token, data.user);
          // Redirect to home after 2 seconds
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          // Check if it's an expired token
          if (data.message?.includes('expired') || data.message?.includes('expiré')) {
            setStatus('expired');
          } else {
            setStatus('failed');
          }
        }
      } catch (err) {
        setStatus('failed');
      }
    };

    verifyToken();
  }, [searchParams, login, navigate]);

  const handleBackToLogin = () => {
    navigate('/login');
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
        <Stack gap={6} textAlign="center">
          {status === 'verifying' && (
            <>
              <Box display="flex" justifyContent="center">
                <Spinner size="xl" colorPalette="brand" />
              </Box>
              <Heading size="lg">{t('auth.verify.verifying')}</Heading>
            </>
          )}

          {status === 'success' && (
            <>
              <Alert.Root status="success">
                <Alert.Indicator />
                <Alert.Title>{t('auth.verify.success')}</Alert.Title>
              </Alert.Root>
              <Text color="gray.600">{t('auth.verify.success')}</Text>
            </>
          )}

          {status === 'failed' && (
            <>
              <Alert.Root status="error">
                <Alert.Indicator />
                <Alert.Title>{t('auth.verify.failed')}</Alert.Title>
              </Alert.Root>
              <Button
                colorPalette="brand"
                onClick={handleBackToLogin}
                size="lg"
              >
                {t('auth.verify.backToLogin')}
              </Button>
            </>
          )}

          {status === 'expired' && (
            <>
              <Alert.Root status="warning">
                <Alert.Indicator />
                <Alert.Title>{t('auth.verify.expired')}</Alert.Title>
              </Alert.Root>
              <Button
                colorPalette="brand"
                onClick={handleBackToLogin}
                size="lg"
              >
                {t('auth.verify.backToLogin')}
              </Button>
            </>
          )}
        </Stack>
      </Card.Root>
    </Box>
  );
}
