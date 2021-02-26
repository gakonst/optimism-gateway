import { ApolloClient } from '@apollo/client';
import { InMemoryCache } from 'apollo-cache-inmemory';

export default {
  l1: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/gigamesh/snx-l1-to-l2',
    cache: new InMemoryCache({}) as any,
  }),
  l2: new ApolloClient({
    uri: 'https://api.staging.thegraph.com/subgraphs/name/gigamesh/ovm-token-transfers',
    cache: new InMemoryCache({}) as any,
  }),
};
