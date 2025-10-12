import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Brand colors inspired by easylegal.online
        brand: {
          50: { value: '#e6f2ff' },
          100: { value: '#bfddff' },
          200: { value: '#99c9ff' },
          300: { value: '#73b4ff' },
          400: { value: '#4d9fff' },
          500: { value: '#2684ff' }, // Primary blue
          600: { value: '#1e6acc' },
          700: { value: '#165099' },
          800: { value: '#0e3666' },
          900: { value: '#061c33' },
        },
        // Professional grays
        neutral: {
          50: { value: '#f8f9fa' },
          100: { value: '#f1f3f5' },
          200: { value: '#e9ecef' },
          300: { value: '#dee2e6' },
          400: { value: '#ced4da' },
          500: { value: '#adb5bd' },
          600: { value: '#6c757d' },
          700: { value: '#495057' },
          800: { value: '#343a40' },
          900: { value: '#212529' },
        },
        // Success green
        success: {
          50: { value: '#e8f5e9' },
          100: { value: '#c8e6c9' },
          200: { value: '#a5d6a7' },
          300: { value: '#81c784' },
          400: { value: '#66bb6a' },
          500: { value: '#4caf50' },
          600: { value: '#43a047' },
          700: { value: '#388e3c' },
          800: { value: '#2e7d32' },
          900: { value: '#1b5e20' },
        },
      },
      fonts: {
        body: { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
        heading: { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
      },
      shadows: {
        sm: { value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
        md: { value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
        lg: { value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
        xl: { value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
      },
      radii: {
        sm: { value: '0.25rem' },
        md: { value: '0.375rem' },
        lg: { value: '0.5rem' },
        xl: { value: '0.75rem' },
        '2xl': { value: '1rem' },
      },
    },
    semanticTokens: {
      colors: {
        // Semantic color mappings
        'bg.canvas': { value: '{colors.neutral.50}' },
        'bg.surface': { value: '{colors.white}' },
        'bg.subtle': { value: '{colors.neutral.100}' },
        'bg.muted': { value: '{colors.neutral.200}' },

        'fg.default': { value: '{colors.neutral.900}' },
        'fg.muted': { value: '{colors.neutral.600}' },
        'fg.subtle': { value: '{colors.neutral.500}' },

        'border.default': { value: '{colors.neutral.300}' },
        'border.subtle': { value: '{colors.neutral.200}' },

        // Brand semantic colors
        'primary': { value: '{colors.brand.500}' },
        'primary.hover': { value: '{colors.brand.600}' },
        'primary.active': { value: '{colors.brand.700}' },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
