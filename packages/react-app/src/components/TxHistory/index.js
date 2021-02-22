import React from 'react';
import { Box, HStack, Button } from '@chakra-ui/react';
import Table from './TxHistoryTable';

function TxHistoryTable({
  transactions,
  setCurrentTableView,
  fetchMore,
  price,
  isRefreshing,
  refreshTransactions,
  totalCount,
  txsLoading,
  handleTokenSelection,
}) {
  return (
    <>
      <Box variant="soft-rounded" mt={8} mb={16} defaultIndex={0}>
        <HStack alignItems="flex-end">
          <Button fontSize="0.8rem" mr={4} maxH={'35px'} onClick={() => setCurrentTableView(0)}>
            INCOMING
          </Button>
          <Button fontSize="0.8rem" maxH={'35px'} onClick={() => setCurrentTableView(1)}>
            OUTGOING
          </Button>
        </HStack>
        <Table
          txsLoading={txsLoading}
          isRefreshing={isRefreshing}
          transactions={transactions}
          refreshTransactions={refreshTransactions}
          price={price}
          fetchMore={fetchMore}
          totalCount={totalCount}
        />
      </Box>
    </>
  );
}

export default TxHistoryTable;
