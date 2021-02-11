import ApolloClient from 'apollo-boost';

export default {
  l1: new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/gigamesh/snx-l1-to-l2',
  }),
  l2: new ApolloClient({
    uri: 'https://api.staging.thegraph.com/subgraphs/name/gigamesh/ovm-token-transfers',
  }),
};
