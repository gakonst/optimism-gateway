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
import { ethers } from 'ethers';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import DateTime from 'luxon/src/datetime.js';
import Interval from 'luxon/src/interval.js';
import { useRouteMatch, Link } from 'react-router-dom';
import { formatNumber, formatUSD } from '../../helpers';

const Dot = ({ color }) => (
  <Box d="inline-block" h="12px" w="12px" bgColor={`${color} !important`} mr="10px" borderRadius="100%" />
);

function TxHistoryPanel({
  txsLoading,
  isRefreshing,
  transactions,
  refreshTransactions,
  price,
  fetchTransactions,
  isFetchingMore,
  isInitialPage,
  totalTxCount,
  direction,
}) {
  const toast = useToast();
  const [screenMd] = useMediaQuery('(min-width: 800px)');
  const {
    params: { address },
  } = useRouteMatch();
  const [lastBtnClicked, setLastBtnClicked] = React.useState();
  const addressCharLength = 10;

  const shortenAddress = address =>
    address.slice(0, addressCharLength) + '...' + address.slice(address.length - addressCharLength, address.length);

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

  const AddressWrapper = ({ children, address }) => {
    return address ? (
      <CopyToClipboard text={address} onCopy={copiedToClipboard}>
        {children}
      </CopyToClipboard>
    ) : (
      <Link to={`/a/${address}`}>{children}</Link>
    );
  };

  const daysOrMinutes = direction === 'outgoing' ? 'days' : 'minutes';

  return (
    <>
      {txsLoading || !transactions ? (
        <Center py="50px" maxW="200px" mx="auto">
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
          <Table className="txHistoryTable" size={'sm'} minW="1000px">
            <Thead>
              <Tr>
                <Th minW="30px" w="11%" px={'0 1rem'}>
                  From
                </Th>
                <Th minW="30px" w="11%" px={'0 1rem'}>
                  To
                </Th>
                <Th w="12%" px={'0 1rem'} onClick={changeDateFormat} cursor="pointer">
                  Initiated
                </Th>
                <Th w="20%" textAlign="left" px={'0 1rem'}>
                  <Box d="flex" justifyContent="space-between" alignItems="center">
                    Status
                    <Button
                      h="30px"
                      fontSize="0.75rem"
                      px={'1rem'}
                      border="1px solid rgba(255,255,255,0.1)"
                      onClick={refreshTransactions}
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
                      <AddressWrapper address={tx.from}>
                        <Box as="span" cursor="pointer">
                          {shortenAddress(tx.from)}
                        </Box>
                      </AddressWrapper>
                    </Td>
                    <Td overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" px={'0 1rem'}>
                      <AddressWrapper address={tx.to}>
                        <Box as="span" cursor="pointer">
                          {tx.to && shortenAddress(tx.to)}
                        </Box>
                      </AddressWrapper>
                    </Td>
                    {/* <Td overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" px={'0 1rem'}>
                      {formatNumber((+ethers.utils.formatEther(tx.amount)).toFixed(3))}
                    </Td> */}
                    {/* <Td px={'0 1rem'}>
                      {price ? (
                        formatUSD(ethers.utils.formatEther(tx.amount) * price)
                      ) : (
                        <Flex alignItems="center">
                          <Spinner size="xs" mr={2} />
                          Getting price
                        </Flex>
                      )}
                    </Td> */}
                    <Td px={'0 1rem'} onClick={changeDateFormat} cursor="pointer">
                      {dateFormat === 'MOMENT'
                        ? DateTime.fromMillis(tx.timestamp).toLocaleString(DateTime.DATETIME_SHORT)
                        : DateTime.local()
                            .minus(Date.now() - tx.timestamp)
                            .toRelative({ round: false })}
                    </Td>
                    <Td px={'0 1rem'} textAlign="left">
                      {tx.layer1Hash && tx.relayedTxTimestamp ? (
                        <>
                          <Dot color="#75cc74" />
                          Completed {DateTime.fromMillis(tx.relayedTxTimestamp).toLocaleString(
                            DateTime.DATETIME_SHORT
                          )}{' '}
                          (
                          {Interval.fromDateTimes(
                            DateTime.fromMillis(tx.timestamp),
                            DateTime.fromMillis(tx.relayedTxTimestamp)
                          )
                            .toDuration(daysOrMinutes)
                            .toObject()
                            [daysOrMinutes]?.toFixed(2)}{' '}
                          {daysOrMinutes})
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
                          {direction === 'incoming'
                            ? 'Pending'
                            : 'Pending until ' +
                              DateTime.fromMillis(tx.timestamp)
                                .plus({ days: 7 })
                                .toLocaleString(DateTime.DATETIME_SHORT)}
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
                      {tx.layer2Hash ? (
                        <ExternalLink href={`https://mainnet-l2-explorer.surge.sh/tx/${tx.layer2Hash}`} isExternal>
                          <ExternalLinkIcon />
                        </ExternalLink>
                      ) : (
                        '...'
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <Center pt={8} w="400px" mx="auto">
            <Button
              d="flex"
              mx="auto"
              mt={8}
              w="120px"
              onClick={() => {
                setLastBtnClicked('prev');
                fetchTransactions({ page: 'prev' });
              }}
              // descending order, so we're at the start of the list if the index === totalTxCount
              disabled={transactions[0].index + 1 === totalTxCount}
            >
              {isFetchingMore && lastBtnClicked === 'prev' ? <Spinner ml={2} size="sm" /> : 'Prev page'}
            </Button>
            <Button
              d="flex"
              mx="auto"
              mt={8}
              w="120px"
              onClick={() => {
                setLastBtnClicked('next');
                fetchTransactions({ page: 'next' });
              }}
              // descending order, so we're at the end of the list if the index === 0
              disabled={transactions[transactions.length - 1].index === 0}
            >
              {isFetchingMore && lastBtnClicked === 'next' ? <Spinner ml={2} size="sm" /> : 'Next page'}
            </Button>
          </Center>
        </>
      )}
    </>
  );
}

export default TxHistoryPanel;
