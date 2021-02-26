import { gql } from 'apollo-boost';

export const getDeposits = (indexTo?: number) => {
  const queryString = `
  ${indexTo ? `query deposits($indexTo: Int!)` : ''} {
    deposits(first: 100, orderBy: index, orderDirection: desc ${indexTo ? `, where: { index_lt: $indexTo }` : ''}) {
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

export const getWithdrawals = (indexTo?: number) => {
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

export const getSentMessages = ({ searchHashes, indexTo }: { searchHashes?: string[]; indexTo?: number } = {}) => {
  let query = '';
  const responseContent = ` {
      hash
      from
      message
      timestamp
      index
    }
  }`;
  if (searchHashes && indexTo) {
    query =
      `
    query sentMessages($searchHashes: [String!], $indexTo: Int!) {
      sentMessages(first: 100, orderBy: index, orderDirection: desc , where: { hash_in: $searchHashes, index_lt: $indexTo }) ` +
      responseContent;
  } else if (indexTo) {
    query =
      `
    query sentMessages($indexTo: Int!) {
      sentMessages(first: 100, orderBy: index, orderDirection: desc , where: { index_lt: $indexTo }) ` +
      responseContent;
  } else if (searchHashes) {
    query =
      `
    query sentMessages($searchHashes: [String!]) {
      sentMessages(first: 100, orderBy: index, orderDirection: desc , where: { hash_in: $searchHashes }) ` +
      responseContent;
  } else {
    query =
      `{
  sentMessages(first: 100, orderBy: index, orderDirection: desc) ` + responseContent;
  }
  return gql(query);
};

export const getRelayedMessages = (searchHashes?: string[]) => {
  const queryString = `
  ${searchHashes ? `query relayedMessages($searchHashes: [String!])` : ''} {
    relayedMessages(first: 100, orderBy: timestamp, orderDirection: desc ${
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
