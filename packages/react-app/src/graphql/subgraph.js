import { gql } from 'apollo-boost';

export const GET_DEPOSITS = gql`
  {
    deposits(first: 50, orderBy: timestamp, orderDirection: desc) {
      account
      amount
      timestamp
      hash
    }
  }
`;

export const GET_SENT_MESSAGES = gql`
  {
    sentMessages(first: 50, orderBy: timestamp, orderDirection: desc) {
      txHash
      message
    }
  }
`;

export const GET_WITHDRAWALS = gql`
  {
    withdrawals(first: 50, orderBy: timestamp, orderDirection: desc) {
      account
      amount
      timestamp
      hash
    }
  }
`;

export const GET_WITHDRAWAL_CONFIRMATIONS = gql`
  {
    receivedMessages(first: 50, orderBy: timestamp, orderDirection: desc) {
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
