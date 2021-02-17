import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TabPanel,
  Spinner,
  Center,
  Button,
  Text,
  Box,
  Flex,
  Link as ExternalLink,
  useToast,
  useMediaQuery,
} from '@chakra-ui/react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import DateTime from 'luxon/src/datetime.js';
import { useRouteMatch, Link } from 'react-router-dom';
import { formatNumber, formatUSD } from '../../helpers';

const Dot = ({ color }) => (
  <Box d="inline-block" h="12px" w="12px" bgColor={`${color} !important`} mr="10px" borderRadius="100%" />
);

function TxHistoryPanel({
  panelKey,
  isLoading,
  isLoadingMore,
  isRefreshing,
  transactions,
  refreshTransactions,
  price,
  fetchMore,
}) {
  const toast = useToast();
  const [screenMd] = useMediaQuery('(min-width: 800px)');
  const {
    params: { address },
  } = useRouteMatch();

  const [dateFormat, setDateFormat] = React.useState('MOMENT');

  const changeDateFormat = () => {
    setDateFormat(dateFormat === 'MOMENT' ? 'DURATION' : 'MOMENT');
  };

  const copiedToClipboard = text => {
    toast({
      title: 'Copied to clipboard:',
      description: text,
      status: 'success',
      duration: 1000,
      isClosable: true,
    });
  };

  const AddressWrapper = ({ children, tx }) => {
    return address ? (
      <CopyToClipboard text={address} onCopy={copiedToClipboard}>
        {children}
      </CopyToClipboard>
    ) : (
      <Link to={`/a/${tx.address}`}>{children}</Link>
    );
  };
  return (
    <>
      {isLoading || !transactions ? (
        <Center pt="50px" maxW="200px" mx="auto">
          <Box d="flex" flexDir="column" alignItems="center">
            <Spinner h="150px" w="150px" />
          </Box>
        </Center>
      ) : !transactions.length ? (
        <Text textAlign="center" mt="100px">
          No transactions found
        </Text>
      ) : (
        <>
          <Table className="txHistoryTable" size={'sm'} minW="1200px">
            <Thead>
              <Tr>
                <Th minW="30px" w="22%" px={'0 1rem'}>
                  Address
                </Th>
                <Th minW="30px" w="6%" px={'0 1rem'}>
                  Amount
                </Th>
                <Th minW="30px" w="8%" px={'0 1rem'}>
                  Value
                </Th>
                <Th w="12%" px={'0 1rem'} onClick={changeDateFormat} cursor="pointer">
                  Initiated
                </Th>
                <Th w="16%" textAlign="left" px={'0 1rem'}>
                  <Box d="flex" justifyContent="space-between" alignItems="center">
                    Status
                    <Button
                      h="30px"
                      fontSize="0.75rem"
                      px={'1rem'}
                      border="1px solid rgba(255,255,255,0.1)"
                      onClick={refreshTransactions}
                      isDisabled={isLoadingMore}
                    >
                      Refresh{isRefreshing && <Spinner ml={2} size="sm" />}
                    </Button>
                  </Box>
                </Th>
                <Th w="3%" textAlign="center" px={'0 1rem'}>
                  L1
                </Th>
                <Th w="3%" textAlign="right" px={'0 1rem'}>
                  L2
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((tx, i) => {
                return (
                  <Tr key={i}>
                    <Td overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" px={'0 1rem'}>
                      <AddressWrapper tx={tx}>
                        <Box as="span" cursor="pointer">
                          {tx.address}
                        </Box>
                      </AddressWrapper>
                    </Td>
                    <Td overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" px={'0 1rem'}>
                      {formatNumber((+tx.amount).toFixed(3))}
                    </Td>
                    <Td px={'0 1rem'}>
                      {price ? (
                        formatUSD(tx.amount * price)
                      ) : (
                        <Flex alignItems="center">
                          <Spinner size="xs" mr={2} />
                          Getting price
                        </Flex>
                      )}
                    </Td>
                    <Td px={'0 1rem'} onClick={changeDateFormat} cursor="pointer">
                      {dateFormat === 'MOMENT'
                        ? DateTime.fromMillis(tx.timestamp).toFormat('D, t ZZZZ')
                        : DateTime.local()
                            .minus(Date.now() - tx.timestamp)
                            .toRelative({ round: false })}
                    </Td>
                    <Td px={'0 1rem'} textAlign="left">
                      {tx.layer1Hash && tx.otherLayerTimestamp ? (
                        <>
                          <Dot color="#75cc74" />
                          Completed {DateTime.fromMillis(tx.otherLayerTimestamp).toFormat('D, t ZZZZ')}
                        </>
                      ) : isRefreshing ? (
                        <Spinner size="xs" />
                      ) : tx.awaitingRelay ? (
                        <>
                          <Dot color="#efefa2" />
                          Awaiting relay
                        </>
                      ) : (
                        <>
                          <Dot color="#f46969" />
                          Pending until{' '}
                          {DateTime.fromMillis(tx.timestamp)
                            .plus({ days: 7 })
                            .toFormat('D, t ZZZZ')}
                        </>
                      )}
                    </Td>
                    <Td px={'0 1rem'} textAlign="center">
                      {tx.layer1Hash ? (
                        <ExternalLink href={`https://etherscan.io/tx/${tx.layer1Hash}`} isExternal>
                          <ExternalLinkIcon />
                        </ExternalLink>
                      ) : (
                        '...'
                      )}
                    </Td>
                    <Td px={'0 1rem'} textAlign="right">
                      {tx.layer2Hash && (
                        <ExternalLink href={`https://mainnet-l2-explorer.surge.sh/tx/${tx.layer2Hash}`} isExternal>
                          <ExternalLinkIcon />
                        </ExternalLink>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <Center pt={8}>
            <Button d="flex" mx="auto" mt={8} onClick={() => fetchMore(panelKey)}>
              {isLoadingMore ? (
                <>
                  Loading more
                  <Spinner ml={2} size="sm" />
                </>
              ) : (
                'Next page'
              )}
            </Button>
          </Center>
        </>
      )}
    </>
  );
}

export default TxHistoryPanel;
