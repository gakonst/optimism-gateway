import React from 'react';
import { Box, Spinner, Table, Thead, Tbody, Td, Tr, Th } from '@chakra-ui/react';
import { formatUSD, formatNumber } from '../helpers';

function StatsTable({ depositAmountPending, withdrawalAmountPending, l2TotalAmt, price, l1TotalAmt, l1VsL2lDiff }) {
  return (
    <Box border="1px solid rgba(255, 255, 255, 0.16)" borderRadius="5px" padding={4}>
      <Table size="sm" variant="unstyled">
        <Thead>
          <Tr>
            <Th pl={0} w="30%"></Th>
            <Th textAlign="right" w="30%" px={1}>
              Tokens
            </Th>
            <Th textAlign="right" minW="40%" pr={0}>
              Total
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td pl={0}>SNX L1 Balance:</Td>
            <Td textAlign="right" px={1}>
              {l1TotalAmt ? formatNumber((+l1TotalAmt).toFixed(2)) : <Spinner size="xs" />}
            </Td>
            <Td textAlign="right" pr={0}>
              {price && l1TotalAmt ? formatUSD(price * l1TotalAmt) : <Spinner size="xs" />}
            </Td>
          </Tr>
          <Tr>
            <Td pl={0}>Pending deposits:</Td>
            <Td textAlign="right" px={1}>
              {depositAmountPending || <Spinner size="xs" />}
            </Td>
            <Td textAlign="right" pr={0}>
              {depositAmountPending && price ? formatUSD(depositAmountPending * price) : <Spinner size="xs" />}
            </Td>
          </Tr>
          <Tr>
            <Td pl={0}>SNX L2 Balance:</Td>
            <Td textAlign="right" px={1}>
              {l2TotalAmt ? formatNumber((+l2TotalAmt).toFixed(2)) : <Spinner size="xs" />}
            </Td>
            <Td textAlign="right" pr={0}>
              {price && l2TotalAmt ? formatUSD(price * l2TotalAmt) : <Spinner size="xs" />}
            </Td>
          </Tr>
          <Tr>
            <Td pl={0}>Pending withdrawals:</Td>
            <Td textAlign="right" px={1}>
              {withdrawalAmountPending || <Spinner size="xs" />}
            </Td>
            <Td textAlign="right" pr={0}>
              {withdrawalAmountPending && price ? formatUSD(withdrawalAmountPending * price) : <Spinner size="xs" />}
            </Td>
          </Tr>
          <Tr>
            <Td pl={0}>L1 vs L2 difference:</Td>
            <Td textAlign="right" px={1}>
              {l1VsL2lDiff != null ? formatNumber(+l1VsL2lDiff + 0) : <Spinner size="xs" />}
            </Td>
            <Td textAlign="right" pr={0}>
              {l1VsL2lDiff != null && price ? formatUSD(price * +l1VsL2lDiff + 0) : <Spinner size="xs" />}
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
}

export default StatsTable;
