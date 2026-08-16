import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      900: '#090d18',
      800: '#10192f',
      700: '#1a274a',
      600: '#2a3e7a',
      500: '#4d6bff',
      400: '#7d8cff',
      300: '#a7b4ff',
      200: '#d6dcff',
    },
    accent: {
      500: '#8b5cf6',
      400: '#a78bfa',
      300: '#c4b5fd',
    },
    surface: {
      900: '#05070d',
      800: '#0b1019',
      700: '#121b2a',
      600: '#1b2433',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'linear-gradient(135deg, #02040a 0%, #0b1730 28%, #1a1235 100%)',
        backgroundAttachment: 'fixed',
        color: 'gray.200',
        lineHeight: '1.5',
      },
      a: {
        color: 'brand.300',
      },
      '*::placeholder': {
        color: 'gray.400',
      },
      '*::-webkit-scrollbar': {
        width: '10px',
        height: '10px',
      },
      '*::-webkit-scrollbar-track': {
        background: 'rgba(15, 20, 31, 0.6)',
        borderRadius: '999px',
      },
      '*::-webkit-scrollbar-thumb': {
        background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.9) 0%, rgba(168, 85, 247, 0.8) 100%)',
        border: '2px solid rgba(15, 20, 31, 0.7)',
        borderRadius: '999px',
      },
      '*::-webkit-scrollbar-thumb:hover': {
        background: 'linear-gradient(180deg, rgba(129, 140, 248, 1) 0%, rgba(192, 132, 252, 1) 100%)',
      },
      '*': {
        scrollbarColor: 'rgba(129, 140, 248, 0.9) rgba(15, 20, 31, 0.6)',
        scrollbarWidth: 'thin',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'lg',
        fontWeight: 600,
        letterSpacing: '0.02em',
        _focus: { boxShadow: '0 0 0 3px rgba(167, 139, 250, 0.28)' },
      },
      variants: {
        solid: {
          bg: 'linear-gradient(135deg, rgba(72, 112, 255, 0.72) 0%, rgba(114, 92, 240, 0.72) 100%)',
          color: 'white',
          border: '1px solid rgba(167, 139, 250, 0.18)',
          boxShadow: '0 10px 22px rgba(91, 82, 229, 0.22)',
          _hover: {
            bg: 'linear-gradient(135deg, rgba(80, 120, 255, 0.82) 0%, rgba(120, 100, 245, 0.82) 100%)',
            boxShadow: '0 12px 26px rgba(91, 82, 229, 0.28)',
          },
        },
        ghost: {
          bg: 'rgba(17, 24, 39, 0.7)',
          color: 'gray.200',
          border: '1px solid rgba(167, 139, 250, 0.2)',
          _hover: {
            bg: 'rgba(23, 32, 48, 0.82)',
          },
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.400',
      },
      baseStyle: {
        field: {
          bg: 'rgba(15, 20, 32, 0.84)',
          borderColor: 'rgba(167, 139, 250, 0.22)',
          color: 'white',
          boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.08)',
        },
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'brand.400',
      },
      baseStyle: {
        bg: 'rgba(15, 20, 32, 0.84)',
        borderColor: 'rgba(167, 139, 250, 0.22)',
        color: 'white',
        boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.08)',
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'rgba(11, 15, 24, 0.9)',
          border: '1px solid',
          borderColor: 'rgba(167, 139, 250, 0.22)',
          borderRadius: '2xl',
          boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.12), 0 18px 48px rgba(91, 82, 229, 0.25)',
        },
        header: {
          color: 'white',
          fontSize: '2xl',
          fontWeight: 700,
        },
        body: {
          color: 'gray.200',
        },
      },
    },
    Badge: {
      baseStyle: {
        bg: 'rgba(91, 118, 255, 0.18)',
        color: 'brand.200',
        border: '1px solid rgba(167, 139, 250, 0.18)',
        borderRadius: 'md',
      },
    },
    Heading: {
      baseStyle: {
        color: 'gray.200',
      },
    },
  },
});

export default theme;
