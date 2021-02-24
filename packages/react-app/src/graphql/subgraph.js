import { gql } from 'apollo-boost';

export const getDeposits = indexTo => {
  const queryString = `
  ${indexTo ? `query deposits($indexTo: Int!)` : ''} {
    deposits(first: 100, orderBy: index, orderDirection: asc ${indexTo ? `, where: { index_lt: $indexTo }` : ''}) {
      index
      account
      amount
      timestamp
      hash
    }
  }
`;
  return gql(queryString);
};

export const getWithdrawals = indexTo => {
  const queryString = `
  ${indexTo ? `query withdrawals($indexTo: Int!)` : ''} {
    withdrawals(first: 100, orderBy: index, orderDirection: desc ${indexTo ? `, where: { index_lt: $indexTo }` : ''}) {
      index
      account
      amount
      timestamp
      hash
    }
  }
`;
  return gql(queryString);
};

export const getSentMessages = searchHashes => {
  const queryString = `
  ${searchHashes ? `query sentMessages($searchHashes: [String!])` : ''} {
    sentMessages(orderBy: timestamp, orderDirection: desc ${
      searchHashes ? `, where: { hash_in: $searchHashes }` : ''
    }) {
      hash
      message
    }
  }
`;
  return gql(queryString);
};

export const getRelayedMessages = searchHashes => {
  const queryString = `
  ${searchHashes ? `query relayedMessages($searchHashes: [String!])` : ''} {
    relayedMessages(orderBy: timestamp, orderDirection: desc ${
      searchHashes ? `, where: { msgHash_in: $searchHashes }` : ''
    }) {
      hash
      timestamp
      msgHash
    }
  }
`;
  return gql(queryString);
};

export const GET_MSG_STATS = gql`
  {
    messageStats(id: "1") {
      sentMessageCount
      relayedMessageCount
    }
  }
`;

export const GET_TX_STATS = gql`
  {
    txStats(id: "1") {
      totalCount
      totalAmount
    }
  }
`;
