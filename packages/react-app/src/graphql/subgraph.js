import { gql } from 'apollo-boost';

export const GET_WITHDRAWALS = gql`
  {
    withdrawals(first: 50) {
      account
      amount
      timestamp
      hash
    }
  }
`;

export const GET_WITHDRAWAL_CONFIRMATIONS = gql`
  {
    receivedWithdrawals(last: 1000) {
      hash
      timestamp
    }
  }
`;

export default GET_WITHDRAWALS;
