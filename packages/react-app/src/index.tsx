import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react';
import { ApolloProvider } from '@apollo/client';
import clients from './graphql/clients';
import './index.css';
import { colors } from './constants';
import App from './App';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        fontWeight: 300,
      },
      button: {
        _focus: {
          boxShadow: 'none !important',
        },
      },
      h1: {
        marginTop: '2rem',
      },
      h2: {
        fontWeight: '400 !important',
        margin: '3.5rem auto 3rem',
      },
      h3: {
        marginTop: '2rem',
        fontWeight: '200 !important',
      },
      h4: {
        marginTop: '2rem',
        fontWeight: '200 !important',
      },
      h5: {
        marginTop: '2rem',
        fontWeight: '200 !important',
      },
    },
  },
  components: {
    Link: {
      baseStyle: ({ colorMode }: { colorMode: string }) => ({
        color: colorMode === 'dark' ? colors.brandSecondaryLight : colors.brandSecondary,
      }),
    },
  },
  colors: {
    brand: {
      primary: colors.brandPrimary,
      secondary: colors.brandSecondary,
      secondaryLight: colors.brandSecondaryLight,
    },
  },
  fonts: {
    body: 'system-ui, sans-serif',
    mono: 'Menlo, monospace',
  },
});

ReactDOM.render(
  <ApolloProvider client={clients.l2}>
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <App />
      </ChakraProvider>
    </BrowserRouter>
  </ApolloProvider>,
  document.getElementById('root')
);
