import React from 'react';
import DateTime from 'luxon/src/datetime.js';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  Button,
  Text,
  Box,
  Link as ExternalLink,
  useToast,
  useMediaQuery,
} from '@chakra-ui/react';
import { useRouteMatch, Link } from 'react-router-dom';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { formatNumber, formatUSD } from '../helpers';

const Dot = ({ color }) => (
  <Box d="inline-block" h="12px" w="12px" bgColor={`${color} !important`} mr="10px" borderRadius="100%" />
);

function TxHistoryTable({
  deposits,
  withdrawals,
  setCurrentTableView,
  loadMore,
  isLoadingMore,
  price,
  isRefreshing,
  refreshTransactions,
  moreWithdrawalsToLoad,
  withdrawalsLoading,
  depositsLoading,
  moreDepositsToLoad,
}) {
  const toast = useToast();
  const [dateFormat, setDateFormat] = React.useState('MOMENT');
  const [screenMd] = useMediaQuery('(min-width: 800px)');
  const {
    params: { address },
  } = useRouteMatch();

  const copiedToClipboard = text => {
    toast({
      title: 'Copied to clipboard:',
      description: text,
      status: 'success',
      duration: 1000,
      isClosable: true,
    });
  };

  const changeDateFormat = () => {
    setDateFormat(dateFormat === 'MOMENT' ? 'DURATION' : 'MOMENT');
  };

  const AddressWrapper = ({ children, row }) => {
    return address ? (
      <CopyToClipboard text={address} onCopy={copiedToClipboard}>
        {children}
      </CopyToClipboard>
    ) : (
      <Link to={`/a/${row.address}`}>{children}</Link>
    );
  };

  return (
    <>
      <Tabs variant="soft-rounded" mt={8} mb={16} defaultIndex={1} onChange={setCurrentTableView}>
        <TabList>
          <Tab fontSize="0.8rem" mr={4} isDisabled cursor="not-allowed">
            DEPOSITS
          </Tab>
          <Tab fontSize="0.8rem">WITHDRAWALS</Tab>
        </TabList>
        <TabPanels>
          {[deposits, withdrawals].map((history, index) => (
            <TabPanel px={'0'} key={index} overflow="auto">
              {withdrawalsLoading || !history || !price ? (
                <Center pt="100px" maxW="200px" mx="auto">
                  <Box d="flex" flexDir="column" alignItems="center">
                    <Spinner h="150px" w="150px" />
                    <Text mt={12} textAlign="center">
                      Fetching withdrawals...
                    </Text>
                  </Box>
                </Center>
              ) : !history.length ? (
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
                        <Th minW="30px" w="6%" px={'0 1rem'}>
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
                      {history.map((row, i) => {
                        return (
                          <Tr key={i}>
                            <Td overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" px={'0 1rem'}>
                              <AddressWrapper row={row}>
                                <Box as="span" cursor="pointer">
                                  {row.address}
                                </Box>
                              </AddressWrapper>
                            </Td>
                            <Td overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" px={'0 1rem'}>
                              {formatNumber((+row.amount).toFixed(3))}
                            </Td>
                            <Td px={'0 1rem'}>{formatUSD(row.amount * price)}</Td>
                            <Td px={'0 1rem'} onClick={changeDateFormat} cursor="pointer">
                              {dateFormat === 'MOMENT'
                                ? DateTime.fromMillis(row.timestamp * 1000).toFormat('D, t ZZZZ')
                                : DateTime.local()
                                    .minus((Date.now() - row.timestamp) * 1000)
                                    .toRelative({ round: false })}
                            </Td>
                            <Td px={'0 1rem'} textAlign="left">
                              {row.layer1Hash ? (
                                <>
                                  <Dot color="#75cc74" />
                                  Completed {DateTime.fromMillis(row.otherLayerTimestamp * 1000).toFormat('D, t ZZZZ')}
                                </>
                              ) : isRefreshing ? (
                                <Spinner size="xs" />
                              ) : DateTime.fromMillis(row.timestamp)
                                  .plus({ days: 7 })
                                  .toMillis() < Date.now() ? (
                                <>
                                  <Dot color="#efefa2" />
                                  Awaiting relay
                                </>
                              ) : (
                                <>
                                  <Dot color="#f46969" />
                                  Pending until{' '}
                                  {DateTime.fromMillis(row.timestamp)
                                    .plus({ days: 7 })
                                    .toFormat('D, t ZZZZ')}
                                </>
                              )}
                            </Td>
                            <Td px={'0 1rem'} textAlign="center">
                              {row.layer1Hash ? (
                                <ExternalLink href={`https://etherscan.io/tx/${row.layer1Hash}`} isExternal>
                                  <ExternalLinkIcon />
                                </ExternalLink>
                              ) : (
                                '...'
                              )}
                            </Td>
                            <Td px={'0 1rem'} textAlign="right">
                              {row.layer2Hash && (
                                <ExternalLink
                                  href={`https://mainnet-l2-explorer.surge.sh/tx/${row.layer2Hash}`}
                                  isExternal
                                >
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
                    {(index === 0 && moreDepositsToLoad) ||
                      (index === 1 && moreWithdrawalsToLoad && (
                        <Button d="flex" mx="auto" mt={8} onClick={() => loadMore(index)}>
                          {isLoadingMore ? (
                            <>
                              Loading more
                              <Spinner ml={2} size="sm" />
                            </>
                          ) : (
                            'Load more'
                          )}
                        </Button>
                      ))}
                  </Center>
                </>
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </>
  );
}

export default TxHistoryTable;
