import React from 'react';
import { Box, HStack, Button } from '@chakra-ui/react';
import { useHistory } from 'react-router-dom';
import Table from './TxHistoryTable';

function TxHistoryTable({
  transactions,
  handleTableViewChange,
  fetchMore,
  price,
  isRefreshing,
  refreshTransactions,
  totalCount,
  txsLoading,
  handleTokenSelection,
  currentTableView,
  queryParams,
}) {
  const history = useHistory();

  const handleDirectionButtonClick = direction => {
    queryParams.set('direction', direction);
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
