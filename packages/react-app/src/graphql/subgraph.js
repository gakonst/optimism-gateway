import { gql } from 'apollo-boost';

export const getDeposits = timestampTo => {
  console.log('timestampTo', timestampTo);
  const queryString = `
  ${timestampTo ? `query deposits($timestampTo: Int!)` : ''} {
    deposits(first: 50, orderBy: timestamp, orderDirection: desc ${
      timestampTo ? `, where: { timestamp_lt: $timestampTo }` : ''
    }) {
      account
      amount
      timestamp
      hash
    }
  }
`;
  return gql(queryString);
};

export const getWithdrawals = timestampTo => {
  console.log('timestampTo', timestampTo);
  const queryString = `
  ${timestampTo ? `query deposits($timestampTo: Int!)` : ''} {
    withdrawals(first: 50, orderBy: timestamp, orderDirection: desc ${
      timestampTo ? `, where: { timestamp_lt: $timestampTo }` : ''
    }) {
      account
      amount
      timestamp
      hash
    }
  }
`;
  return gql(queryString);
};

// export const GET_DEPOSITS = gql`
//   {
//     deposits(first: 50, orderBy: timestamp, orderDirection: desc) {
//       account
//       amount
//       timestamp
//       hash
//     }
//   }
// `;

// export const GET_WITHDRAWALS = gql`
//   {
//     withdrawals(first: 50, orderBy: timestamp, orderDirection: desc) {
//       account
//       amount
//       timestamp
//       hash
//     }
//   }
// `;

export const GET_SENT_MESSAGES = gql`
  {
    sentMessages(first: 1000, orderBy: timestamp, orderDirection: desc) {
      hash
      message
    }
  }
`;

export const GET_RELAYED_MESSAGES = gql`
  {
    relayedMessages(first: 1000, orderBy: timestamp, orderDirection: desc) {
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
      total
    }
  }
`;
