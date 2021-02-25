import React from 'react';
import { Box, HStack, Button } from '@chakra-ui/react';
import { useHistory } from 'react-router-dom';
import Table from './TxHistoryTable';

function TxHistoryTable({
  transactions,
  handleTableViewChange,
  fetchTransactions,
  price,
  isRefreshing,
  refreshTransactions,
  totalTxCount,
  txsLoading,
  handleTokenSelection,
  currentTableView,
  queryParams,
  isFetchingMore,
}) {
  const history = useHistory();

  const handleDirectionButtonClick = direction => {
    queryParams.set('dir', direction);
    history.push({
      search: queryParams.toString(),
    });
    handleTableViewChange(direction);
  };
  return (
    <>
      <Box variant="soft-rounded" mt={8} mb={16}>
        <HStack alignItems="flex-end" justifyContent="center" pb={8} spacing={10}>
          <Button
            onClick={() => handleDirectionButtonClick('incoming')}
            size="lg"
            variant={currentTableView === 'incoming' ? 'outline' : 'ghost'}
          >
            INCOMING
          </Button>
          <Button
            onClick={() => handleDirectionButtonClick('outgoing')}
            size="lg"
            variant={currentTableView === 'outgoing' ? 'outline' : 'ghost'}
          >
            OUTGOING
          </Button>
        </HStack>
        <Table
          isFetchingMore={isFetchingMore}
          txsLoading={txsLoading}
          isRefreshing={isRefreshing}
          transactions={transactions}
          refreshTransactions={refreshTransactions}
          price={price}
          fetchTransactions={fetchTransactions}
          totalTxCount={totalTxCount}
          direction={currentTableView}
        />
      </Box>
    </>
  );
}

export default TxHistoryTable;
