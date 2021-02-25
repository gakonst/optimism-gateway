import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import TxHistoryTable from './TxHistory';

export const formatNumber = num => {
  return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 20 }).format(+num);
};

function AddressView({
  withdrawals,
  deposits,
  getTransactions,
  price,
  refreshTransactions,
  isRefreshing,
  getPastEvents,
  contracts,
  watcher,
  l1Provider,
  l2Provider,
  setWithdrawals,
  setWithdrawalsLoading,
  withdrawalsLoading,
}) {
  const {
    params: { address },
  } = useRouteMatch();

  React.useEffect(() => {
    // exit if we already have this user's withdrawals
    if (withdrawals?.find(tx => tx.address === address)) return;

    (async () => {
      setWithdrawalsLoading(true);
      let userTxs = await getPastEvents({
        contract: contracts.l2.SNX.bridge,
        eventName: 'WithdrawalInitiated',
        provider: l2Provider,
        address,
      });

      const promises = await userTxs.map(async (tx, index) => {
        const msgHashes = await watcher.getMessageHashesFromL2Tx(tx.transactionHash);
        const receipt = await watcher.getL1TransactionReceipt(msgHashes[0], false);
        if (receipt) {
          const block = await l1Provider.getBlock(receipt.blockNumber);
          const timestamp = Number(block.timestamp * 1000);
          tx.l1Timestamp = timestamp;
        }
        tx.layer1Hash = receipt?.transactionHash || null;
        tx.layer2Hash = tx.transactionHash;
        delete tx.transactionHash;
        return tx;
      });

      userTxs = [];
      for (const promise of promises) {
        userTxs.push(await promise);
      }

      const newWithdrawalsHistory = withdrawals ? [...withdrawals] : [];

      // remove duplicates
      userTxs.forEach(userTx => {
        if (!newWithdrawalsHistory.find(tx => tx.layer2Hash === userTx.transactionHash)) {
          newWithdrawalsHistory.push(userTx);
        }
      });

      setWithdrawals(newWithdrawalsHistory);
      setWithdrawalsLoading(false);
    })();
  }, [
    address,
    contracts.l2.SNX.bridge,
    getPastEvents,
    l1Provider,
    l2Provider,
    setWithdrawals,
    setWithdrawalsLoading,
    watcher,
    withdrawals,
  ]);

  const filteredWithdrawals = withdrawals?.filter(tx => tx.address === address);
  const filteredDeposits = deposits?.filter(tx => tx.address === address);

  return (
    <div>
      <TxHistoryTable
        deposits={filteredDeposits}
        withdrawals={filteredWithdrawals}
        getTransactions={getTransactions}
        isFetchingMore={false}
        price={price}
        refreshTransactions={refreshTransactions}
        isRefreshing={isRefreshing}
        withdrawalsLoading={withdrawalsLoading}
      />
    </div>
  );
}

export default AddressView;
