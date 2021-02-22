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

export const GET_SENT_MESSAGES = gql`
  query sentMessages($searchHashes: [String!]) {
    sentMessages(orderBy: timestamp, orderDirection: desc, where: { hash_in: $searchHashes }) {
      hash
      message
    }
  }
`;

export const GET_RELAYED_MESSAGES = gql`
  query relayedMessages($searchHashes: [String!]) {
    relayedMessages(orderBy: timestamp, orderDirection: desc, where: { msgHash_in: $searchHashes }) {
      hash
      timestamp
      msgHash
    }
  }
`;

export const GET_STATS = gql`
  {
    stats(id: "1") {
      count
    }
  }
`;
