import React from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import Table from './TxHistoryTable';

function TxHistoryTable({
  deposits,
  withdrawals,
  setCurrentTableView,
  fetchMore,
  isLoadingMore,
  price,
  isRefreshing,
  refreshTransactions,
  moreWithdrawalsToLoad,
  withdrawalsLoading,
  depositsLoading,
  moreDepositsToLoad,
}) {
  return (
    <>
      <Tabs variant="soft-rounded" mt={8} mb={16} defaultIndex={0} onChange={setCurrentTableView}>
        <TabList>
          <Tab fontSize="0.8rem" mr={4}>
            DEPOSITS
          </Tab>
          <Tab fontSize="0.8rem">WITHDRAWALS</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={'0'} overflow="auto">
            <Table
              panelKey={0}
              isLoading={depositsLoading}
              isLoadingMore={isLoadingMore}
              isRefreshing={isRefreshing}
              transactions={deposits}
              refreshTransactions={refreshTransactions}
              price={price}
              fetchMore={fetchMore}
            />
          </TabPanel>
          <TabPanel px={'0'} overflow="auto">
            <Table
              panelKey={1}
              isLoading={withdrawalsLoading}
              isLoadingMore={isLoadingMore}
              isRefreshing={isRefreshing}
              transactions={withdrawals}
              refreshTransactions={refreshTransactions}
              price={price}
              fetchMore={fetchMore}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}

export default TxHistoryTable;
