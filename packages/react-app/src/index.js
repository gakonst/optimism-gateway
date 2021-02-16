import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react';
import { ApolloProvider } from '@apollo/client';
import clients from './graphql/clients';
import './index.css';
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
        fontWeight: '500 !important',
        marginTop: '2rem',
      },
      h2: {
        margin: '3.5rem auto 3rem',
      },
      h3: {
        marginTop: '2rem',
        fontWeight: '500 !important',
      },
      h4: {
        marginTop: '2rem',
        fontWeight: '500 !important',
      },
      h5: {
        marginTop: '2rem',
        fontWeight: '500 !important',
      },
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
