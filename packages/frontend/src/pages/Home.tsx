import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { LANGUAGES, LANGUAGE_NAMES, type Language } from "../i18n/constants";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  Stack,
  Flex,
} from "@chakra-ui/react";

export function Home() {
  const [count, setCount] = useState(0);
  const { t, i18n } = useTranslation("common");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const changeLanguage = (lng: Language) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box minH="100vh" bg="bg.canvas">
      {/* Header Navigation */}
      <Box
        bg="white"
        borderBottom="1px solid"
        borderColor="border.subtle"
        py={4}
        shadow="sm"
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Heading size="lg" color="brand.600" fontWeight="bold">
              {t("app.name")}
            </Heading>

            <HStack gap={4}>
              {/* Navigation */}
              <Button
                size="sm"
                variant="ghost"
                colorPalette="brand"
                onClick={() => navigate("/chatbot")}
              >
                Legal Chat
              </Button>
              <Button
                size="sm"
                variant="ghost"
                colorPalette="brand"
                onClick={() => navigate("/admin")}
              >
                Admin
              </Button>

              {/* User Info */}
              <Text fontSize="sm" color="gray.600">
                {user?.name} ({user?.email})
              </Text>

              {/* Language Switcher */}
              <HStack gap={2}>
                {LANGUAGES.map((lng) => (
                  <Button
                    key={lng}
                    size="sm"
                    variant={i18n.language === lng ? "solid" : "ghost"}
                    colorPalette="brand"
                    onClick={() => changeLanguage(lng)}
                    fontWeight="medium"
                  >
                    {LANGUAGE_NAMES[lng]}
                  </Button>
                ))}
              </HStack>

              {/* Logout Button */}
              <Button
                size="sm"
                variant="outline"
                colorPalette="neutral"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        bg="white"
        py={16}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Container maxW="container.xl">
          <VStack gap={4} textAlign="center" maxW="3xl" mx="auto">
            <Heading
              size="3xl"
              color="fg.default"
              fontWeight="bold"
              lineHeight="1.2"
            >
              {t("demo.monorepo.title")}
            </Heading>
            <Text fontSize="xl" color="fg.muted" maxW="2xl">
              {t("app.tagline")}
            </Text>
            <Text color="fg.subtle" fontSize="md">
              {t("demo.monorepo.description")}
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={12}>
        <VStack gap={12} align="stretch">
          {/* Interactive Demo Section */}
          <Box>
            <Heading size="xl" mb={6} color="fg.default">
              {t("demo.counter.title")}
            </Heading>
            <Card.Root>
              <Card.Body p={8}>
                <VStack gap={6}>
                  <Box
                    bg="brand.50"
                    borderRadius="lg"
                    p={8}
                    w="full"
                    textAlign="center"
                    borderWidth="1px"
                    borderColor="brand.200"
                  >
                    <Text
                      fontSize="6xl"
                      fontWeight="bold"
                      color="brand.600"
                      mb={4}
                    >
                      {count}
                    </Text>
                    <HStack justify="center" gap={3}>
                      <Button
                        colorPalette="brand"
                        size="lg"
                        onClick={() => setCount((c) => c + 1)}
                        shadow="md"
                        _hover={{ shadow: "lg" }}
                      >
                        {t("actions.increment")}
                      </Button>
                      <Button
                        variant="outline"
                        colorPalette="neutral"
                        size="lg"
                        onClick={() => setCount(0)}
                      >
                        {t("actions.reset")}
                      </Button>
                    </HStack>
                  </Box>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>

          {/* Features Grid */}
          <Box>
            <Heading size="xl" mb={6} color="fg.default">
              Platform Features
            </Heading>
            <Stack direction={{ base: "column", md: "row" }} gap={6}>
              <Card.Root
                flex={1}
                _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Card.Body p={6}>
                  <Box
                    w={12}
                    h={12}
                    bg="brand.100"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mb={4}
                  >
                    <Text fontSize="2xl" fontWeight="bold" color="brand.600">
                      F1
                    </Text>
                  </Box>
                  <Heading size="md" mb={3} color="fg.default">
                    {t("features.backend.title")}
                  </Heading>
                  <Text color="fg.muted" lineHeight="1.7">
                    {t("features.backend.description")}
                  </Text>
                </Card.Body>
              </Card.Root>

              <Card.Root
                flex={1}
                _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Card.Body p={6}>
                  <Box
                    w={12}
                    h={12}
                    bg="success.100"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mb={4}
                  >
                    <Text fontSize="2xl" fontWeight="bold" color="success.600">
                      F2
                    </Text>
                  </Box>
                  <Heading size="md" mb={3} color="fg.default">
                    {t("features.frontend.title")}
                  </Heading>
                  <Text color="fg.muted" lineHeight="1.7">
                    {t("features.frontend.description")}
                  </Text>
                </Card.Body>
              </Card.Root>

              <Card.Root
                flex={1}
                _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Card.Body p={6}>
                  <Box
                    w={12}
                    h={12}
                    bg="neutral.200"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mb={4}
                  >
                    <Text fontSize="2xl" fontWeight="bold" color="neutral.700">
                      F3
                    </Text>
                  </Box>
                  <Heading size="md" mb={3} color="fg.default">
                    {t("features.common.title")}
                  </Heading>
                  <Text color="fg.muted" lineHeight="1.7">
                    {t("features.common.description")}
                  </Text>
                </Card.Body>
              </Card.Root>
            </Stack>
          </Box>
        </VStack>
      </Container>

      {/* Footer */}
      <Box
        bg="white"
        borderTop="1px solid"
        borderColor="border.subtle"
        py={8}
        mt={12}
      >
        <Container maxW="container.xl">
          <Text textAlign="center" color="fg.subtle" fontSize="sm">
            © 2025 {t("app.name")}. Built with React, TypeScript, and Chakra UI.
          </Text>
        </Container>
      </Box>
    </Box>
  );
}
