import { gql } from 'apollo-boost';

export const GET_DEPOSITS = gql`
  query deposits($timestampFrom: Int!) {
    deposits(first: 50, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: $timestampFrom }) {
      account
      amount
      timestamp
      hash
    }
  }
`;

export const GET_SENT_MESSAGES = gql`
  {
    sentMessages(first: 1000, orderBy: timestamp, orderDirection: desc) {
      hash
      message
    }
  }
`;

export const GET_WITHDRAWALS = gql`
  query withdrawals($timestampFrom: Int!) {
    withdrawals(first: 50, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: $timestampFrom }) {
      account
      amount
      timestamp
      hash
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
