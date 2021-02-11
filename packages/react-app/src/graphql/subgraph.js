import { gql } from 'apollo-boost';

export const GET_WITHDRAWALS = gql`
  {
    withdrawals(first: 1000) {
      account
      amount
      timestamp
      hash
    }
  }
`;

export const GET_SENT_MESSAGES = gql`
  {
    sentMessages(first: 1000) {
      txHash
      message
    }
  }
`;

export const GET_WITHDRAWAL_CONFIRMATIONS = gql`
  {
    receivedWithdrawals(first: 1000) {
      hash
      timestamp
      msgHash
    }
  }
`;

export default GET_WITHDRAWALS;
