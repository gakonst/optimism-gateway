import { gql } from 'apollo-boost';

export const actions = {
  GET_DEPOSITS: 'GET_DEPOSITS',
  GET_WITHDRAWALS: 'GET_WITHDRAWALS',
  GET_SENT_MESSAGES: 'GET_SENT_MESSAGES',
  GET_WITHDRAWAL_CONFIRMATIONS: 'GET_WITHDRAWAL_CONFIRMATIONS',
  GET_WITHDRAWAL_STATS: 'GET_WITHDRAWAL_STATS',
};

/**
 * Uses the last timestamp from the previous page of results to query for the next page of results
 */
export function buildQuery(action, lastTimestamp = 0) {
  switch (action) {
    case actions.GET_DEPOSITS:
      return gql`
        {
          deposits(first: 50, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${lastTimestamp} }) {
            account
            amount
            timestamp
            hash
          }
        }
      `;
    case actions.GET_WITHDRAWALS:
      return gql`
        {
          withdrawals(first: 50, orderBy: timestamp, orderDirection: desc) {
            account
            amount
            timestamp
            hash
          }
        }
      `;
    case actions.GET_SENT_MESSAGES:
      return gql`
        {
          sentMessages(first: 50, orderBy: timestamp, orderDirection: desc) {
            txHash
            message
          }
        }
      `;
    case actions.GET_WITHDRAWAL_CONFIRMATIONS:
      return gql`
        {
          receivedWithdrawals(first: 50, orderBy: timestamp, orderDirection: desc) {
            hash
            timestamp
            msgHash
          }
        }
      `;
    case actions.GET_WITHDRAWAL_STATS:
      return gql`
        {
          stats(id: "1") {
            count
            total
          }
        }
      `;
    default:
      throw Error('No action specified');
  }
}
