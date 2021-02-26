import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Spinner,
  Center,
  Button,
  Text,
  Box,
  Flex,
  HStack,
  Link as ExternalLink,
  useToast,
  useMediaQuery,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import DateTime from 'luxon/src/datetime.js';
import Interval from 'luxon/src/interval.js';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { formatNumber, formatUSD } from '../../helpers';
import { useHistory, useRouteMatch, Link } from 'react-router-dom';
import { Token } from '@uniswap/sdk';

const Dot = ({ color }: {color: string}) => (
  <Box d="inline-block" h="12px" w="12px" bgColor={`${color} !important`} mr="10px" borderRadius="100%" />
);

type Props = {
  transactions: Transaction[] | null;
  handleTableViewChange: (direction: TableViewType)=> Promise<void>;
  fetchTransactions: ({}: {page: string}) => {};
  price: number;
  isRefreshing: boolean;
  refreshTransactions: ()=> {};
  totalTxCount: number;
  txsLoading: boolean;
  handleTokenSelection: (e: React.FormEvent<HTMLSelectElement>)=> void;
  currentTableView: TableViewType;
  queryParams: URLSearchParams;
  isFetchingMore: boolean;
  tokenSelection: TokenSelection;
}

function TxHistoryTable({
  transactions,
  handleTableViewChange,
  fetchTransactions,
  price,
  isRefreshing,
  refreshTransactions,
  totalTxCount,
  txsLoading,
  currentTableView,
  queryParams,
  isFetchingMore,
  tokenSelection,
}: Props) {
  const history = useHistory();
  const toast = useToast();
  const [screenMd] = useMediaQuery('(min-width: 800px)');
  const {
    params: { address },
  }: {params: {address: string}} = useRouteMatch();
  const [lastBtnClicked, setLastBtnClicked] = React.useState("");
  const addressCharLength = 10;

  const shortenAddress = (address: string = "") =>
    address.slice(0, addressCharLength) + '...' + address.slice(address.length - addressCharLength, address.length);

  const [dateFormat, setDateFormat] = React.useState('MOMENT');

  const changeDateFormat = () => {
    setDateFormat(dateFormat === 'MOMENT' ? 'DURATION' : 'MOMENT');
  };

  const copiedToClipboard = (text: string) => {
    toast({
      title: 'Copied to clipboard:',
      description: text,
      status: 'success',
      duration: 1000,
      isClosable: true,
    });
  };

  const AddressWrapper = ({ children, address }: {children: React.ReactChild, address?: string}) => {
    return address ? (
      <CopyToClipboard text={address} onCopy={copiedToClipboard}>
        {children}
      </CopyToClipboard>
    ) : (
      <Link to={`/a/${address}`}>{children}</Link>
    );
  };

  const daysOrMinutes = currentTableView === 'outgoing' ? 'days' : 'minutes';

  const tokenCellStyles = {
    pt: '5px',
    pb: '5px',
  };

  const handleDirectionButtonClick = (direction: TableViewType) => {
    queryParams.set('dir', direction);
    history.push({
      search: queryParams.toString(),
    });
    handleTableViewChange(direction);
  };

  const firstTxIndex = transactions ? transactions[0].index : Number.MAX_SAFE_INTEGER;

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
                    <Th minW="30px" w="11%" px={'0.5rem'}>
                      From
                    </Th>
                    <Th minW="30px" w="11%" px={'0.5rem'}>
                      To
                    </Th>
                    <Th w="12%" px={'0.5rem'} onClick={changeDateFormat} cursor="pointer">
                      Initiated
                    </Th>
                    <Th w="20%" textAlign="left" px={'0.5rem'}>
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
                    <Th w="3%" textAlign="center" px={'0.5rem'}>
                      L1
                    </Th>
                    <Th w="3%" textAlign="right" px={'0.5rem'}>
                      L2
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactions.map((tx, i) => {
                    return (
                      <React.Fragment key={i}>
                        <Tr background={i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'}>
                          <Td overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" px={'0.5rem'}>
                            <AddressWrapper address={tx.from}>
                              <Box as="span" cursor="pointer">
                                {shortenAddress(tx.from)}
                              </Box>
                            </AddressWrapper>
                          </Td>
                          <Td overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" px={'0.5rem'}>
                            <AddressWrapper address={tx.to}>
                              <Box as="span" cursor="pointer">
                                {tx.to && shortenAddress(tx.to)}
                              </Box>
                            </AddressWrapper>
                          </Td>
                          <Td px={'0.5rem'} onClick={changeDateFormat} cursor="pointer">
                            {dateFormat === 'MOMENT'
                              ? DateTime.fromMillis(tx.timestamp).toLocaleString(DateTime.DATETIME_SHORT)
                              : DateTime.local()
                                  .minus(Date.now() - tx.timestamp)
                                  .toRelative({ round: false })}
                          </Td>
                          <Td px={'0.5rem'} textAlign="left">
                            {tx.layer1Hash && tx.relayedTxTimestamp ? (
                              <>
                                <Dot color="#75cc74" />
                                Completed{' '}
                                {DateTime.fromMillis(tx.relayedTxTimestamp).toLocaleString(DateTime.DATETIME_SHORT)} (
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
                                {currentTableView === 'incoming'
                                  ? 'Pending'
                                  : 'Pending until ' +
                                    DateTime.fromMillis(tx.timestamp)
                                      .plus({ days: 7 })
                                      .toLocaleString(DateTime.DATETIME_SHORT)}
                              </>
                            )}
                          </Td>
                          <Td px={'0.5rem'} textAlign="center">
                            {tx.layer1Hash ? (
                              <ExternalLink href={`https://etherscan.io/tx/${tx.layer1Hash}`} isExternal>
                                <ExternalLinkIcon />
                              </ExternalLink>
                            ) : (
                              '...'
                            )}
                          </Td>
                          <Td px={'0.5rem'} textAlign="right">
                            {tx.layer2Hash ? (
                              <ExternalLink
                                href={`https://mainnet-l2-explorer.surge.sh/tx/${tx.layer2Hash}`}
                                isExternal
                              >
                                <ExternalLinkIcon />
                              </ExternalLink>
                            ) : (
                              '...'
                            )}
                          </Td>
                        </Tr>
                        {tokenSelection && (
                          <Tr background={i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'}>
                            <Td
                              overflow="hidden"
                              textOverflow="ellipsis"
                              whiteSpace="nowrap"
                              px={'0.5rem'}
                              {...tokenCellStyles}
                            >
                              <Box d="flex" alignItems="center" h="1.2rem">
                                <Image
                                  src={tokenSelection.iconURL}
                                  borderRadius="100%"
                                  mx={2}
                                  h={'20px'}
                                  w={'20px'}
                                  padding={'0 !important'}
                                  {...tokenCellStyles}
                                />
                                {tokenSelection.symbol}
                                {': '}
                                {formatNumber((+ethers.utils.formatEther(tx.amount as BigIntIsh)).toFixed(3))}
                              </Box>
                            </Td>
                            <Td px={'0.5rem'} {...tokenCellStyles}>
                              <Box d="flex" alignItems="center" h="1.2rem">
                                Value:{' '}
                                {price ? (
                                  formatUSD(+ethers.utils.formatEther(tx.amount as BigIntIsh) * price)
                                ) : (
                                  <Flex alignItems="center">
                                    <Spinner size="xs" ml={2} />
                                  </Flex>
                                )}
                              </Box>
                            </Td>
                            <Td {...tokenCellStyles} />
                            <Td {...tokenCellStyles} />
                            <Td {...tokenCellStyles} />
                            <Td {...tokenCellStyles} />
                          </Tr>
                        )}
                      </React.Fragment>
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
                  disabled={firstTxIndex + 1 === totalTxCount}
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
                  disabled={transactions && transactions[transactions.length - 1].index === 0}
                >
                  {isFetchingMore && lastBtnClicked === 'next' ? <Spinner ml={2} size="sm" /> : 'Next page'}
                </Button>
              </Center>
            </>
          )}
        </>
      </Box>
    </>
  );
}

export default TxHistoryTable;
