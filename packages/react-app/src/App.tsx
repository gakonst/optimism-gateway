import React from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import { Fraction } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { Box, Container, Heading, useToast, Flex } from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import SearchInput from './components/SearchInput';
import TxHistoryTable from './components/TxHistory';
import TokenSelector from './components/TokenSelector';
import StatsTable from './components/StatsTable';
import AddressView from './components/AddressView';
import clients from './graphql/clients';
import {
  getDeposits,
  getWithdrawals,
  getSentMessages,
  getRelayedMessages,
  GET_TX_STATS,
  GET_MSG_STATS,
} from './graphql/subgraph';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { abis, addresses } from '@project/contracts';
import { panels, tokens, FETCH_LIMIT } from './constants';
import { decodeSentMessage, processSentMessage, getFilteredRelayedTxs } from './helpers';

const l1Provider = new JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`);
const l2Provider = new JsonRpcProvider(`https://mainnet.optimism.io`);
const snxL1Contract = new Contract(addresses.l1.SNX.token, abis.SynthetixL1Token, l1Provider);
const snxL2Contract = new Contract(addresses.l2.SNX.token, abis.SynthetixL2Token, l2Provider);

function App() {
  const history = useHistory();
  const [currentTableView, setCurrentTableView] = React.useState<TableViewType>('incoming');
  const [price, setPrice] = React.useState(0);
  const [fetchingPrice, setFetchingPrice] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [transactions, _setTransactions] = React.useState<Transaction[] | null>(null);
  const [depositAmountPending, setDepositAmountPending] = React.useState('');
  const [withdrawalAmountPending, setWithdrawalAmountPending] = React.useState('');
  const [l1TotalAmt, setl1TotalAmt] = React.useState("");
  const [l2TotalAmt, setl2TotalAmt] = React.useState("");
  // TODO: figure out how to calculate l1VsL2WithdrawalDiff when there are more than 100 pending txs 
  // (currently we can only calculate this value using the max # of withdrawal txs we can retrieve from the subgraph (100)
  const [txsLoading, setTxsLoading] = React.useState(false);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const [tokenSelection, setTokenSelection] = React.useState<TokenSelection | null>(null);
  const [priceIntervalId, setPriceIntervalId] = React.useState<number | null>(null);
  const [queryParams, setQueryParams] = React.useState<URLSearchParams | null>(null);
  const [totalTxCount, setTotalTxCount] = React.useState(Number.MAX_SAFE_INTEGER); // used for pagination
  const depositsInitiated = useQuery(getDeposits(), {
    client: clients.l1,
  });
  const withdrawalsInitiated = useQuery(getWithdrawals(), {
    client: clients.l2,
  });
  const sentMessagesFromL1 = useQuery(getSentMessages(), {
    client: clients.l1,
    skip: true,
  });
  const sentMessagesFromL2 = useQuery(getSentMessages(), {
    client: clients.l2,
    skip: true,
  });
  const relayedMessagesOnL1 = useQuery(getRelayedMessages(), { client: clients.l1, skip: true });
  const relayedMessagesOnL2 = useQuery(getRelayedMessages(), { client: clients.l2, skip: true });
  const depositStats = useQuery(GET_TX_STATS, {
    client: clients.l1,
  });
  const withdrawalStats = useQuery(GET_TX_STATS, {
    client: clients.l2,
  });
  const l1MessageStats = useQuery(GET_MSG_STATS, { client: clients.l1 });
  const l2MessageStats = useQuery(GET_MSG_STATS, { client: clients.l2 });
  const toast = useToast();
  const location = useLocation();

  const setTransactions = (transactions: Transaction[]) => {
    _setTransactions(transactions);
    setTxsLoading(false);
    setIsFetchingMore(false);
  };

  const setTxAmountPending = (type: TransactionViewType, transactions: Transaction[]) => {
    const setter = type === 'withdrawals' ? setWithdrawalAmountPending : setDepositAmountPending;
    const amountPending = transactions.reduce((total, tx) => {
      if ((type === 'withdrawals' && !tx.layer1Hash) || (type === 'deposits' && !tx.layer2Hash)) {
        total = total.add(tx.amount as bigint);
      }
      return total;
    }, new Fraction(0 as BigIntIsh));
    setter(amountPending.divide((1e18).toString()).toFixed(2));
  };

  /**
   * Routes to address page if user enters valid address
   */
  const handleAddressSearch = async (address: string) => {
    if (ethers.utils.isAddress(address)) {
      history.push(`/a/${address}`);
    } else {
      toast({
        title: 'Error',
        description: 'Invalid address',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const refreshTransactions = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    if (currentTableView === 'incoming') {
      if (tokenSelection) {
        await withdrawalsInitiated.refetch();
      } else {
        await sentMessagesFromL2.refetch();
      }
      setIsRefreshing(false);
    } else if (currentTableView === 'outgoing') {
      if (tokenSelection) {
        await depositsInitiated.refetch();
      } else {
        await sentMessagesFromL1.refetch();
      }
      setIsRefreshing(false);
    }
  };

  /**
   * Processes withdrawals or deposits
   */
  const processValueTransactions = React.useCallback(async (layer: Layer, rawTxs: Transaction[]) => {
    const txHashes = rawTxs.map((tx: Transaction)=> tx.hash as string);
    const sentMessageTxs = layer === 1 ? sentMessagesFromL1 : sentMessagesFromL2;
    const relayedMessages = layer === 1 ? relayedMessagesOnL2 : relayedMessagesOnL1;

    const sentMsgTxs = (
      await sentMessageTxs.fetchMore({
        variables: { searchHashes: txHashes },
        query: getSentMessages({ searchHashes: txHashes }),
      })
    ).data.sentMessages;
    
    const relayedTxs = await getFilteredRelayedTxs(sentMsgTxs, relayedMessages);

    const txs  = rawTxs.map((rawTx: Transaction) => {
      const tx = { ...rawTx };
      tx.from = tx.account;
      tx.timestamp = tx.timestamp * 1000;
      const sentMessage = sentMsgTxs.find((msgTx: Transaction) => msgTx.hash === tx.hash);
      const sentMsgHash = ethers.utils.solidityKeccak256(['bytes'], [sentMessage.message]);
      const [_, to] = decodeSentMessage(sentMessage.message);
      tx.to = to;
      const relayedTx = relayedTxs.find((msg: Transaction) => msg.msgHash === sentMsgHash);
      tx.relayedTxTimestamp = relayedTx && relayedTx.timestamp * 1000;
      if(layer === 1){
        tx.layer1Hash = tx.hash;
        tx.layer2Hash = relayedTx?.hash;
      } else {
        tx.layer2Hash = tx.hash;
        tx.layer1Hash = relayedTx?.hash;
      }
      delete tx.hash;
      return tx;
    });

    setTxAmountPending( layer === 1 ? 'deposits' : 'withdrawals', txs );
    return txs.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp);
  }, [relayedMessagesOnL1, relayedMessagesOnL2, sentMessagesFromL1, sentMessagesFromL2])

  const processPageOfxDomainTxs = React.useCallback(
    async (layer, sentMessages, totalMessageCount, indexTo?: number) => {
      setIsFetchingMore(true);
      setTotalTxCount(totalMessageCount);

      const sentMsgTxs = (
        await sentMessages.fetchMore({
          query: getSentMessages({ indexTo }),
          variables: {
            indexTo,
          },
        })
      ).data.sentMessages;
      const relayedTxs = await getFilteredRelayedTxs(
        sentMsgTxs,
        layer === 1 ? relayedMessagesOnL2 : relayedMessagesOnL1
      );
      const txs = sentMsgTxs.map((tx: Transaction) => processSentMessage(tx, layer, relayedTxs));
      setTransactions(txs);
    },
    [relayedMessagesOnL1, relayedMessagesOnL2]
  );

  const fetchTransactions = React.useCallback(
    async ({ page, token: _token }) => {
      const token = _token || tokenSelection;
      if (!!page) {
        setIsFetchingMore(true);
      } else {
        setTxsLoading(true);
      }

      const firstTxIndex = (transactions && transactions[0].index) || Number.MAX_SAFE_INTEGER;
      const lastTxIndex = transactions && transactions[transactions.length - 1].index || 0;

      // If page isn't specified, start from the start of the list
      const indexTo = !page || !transactions ? 0 : page === 'prev' ? firstTxIndex + FETCH_LIMIT + 1 : lastTxIndex;
      if (currentTableView === panels.INCOMING) {
        // fetch deposits
        if (token) {
          if (!page) {
            const withdrawals = await processValueTransactions(2, withdrawalsInitiated.data.withdrawals);
            setTxAmountPending('withdrawals', withdrawals);
          }
          const txs = !page
            ? depositsInitiated
            : await depositsInitiated.fetchMore({
                variables: {
                  indexTo,
                },
                query: getDeposits(indexTo),
                updateQuery: (prev, { fetchMoreResult }) => {
                  return Object.assign(prev, fetchMoreResult);
                },
              });
          setTotalTxCount(depositStats.data.txStats.totalCount);
          const deposits = await processValueTransactions(1, txs.data.deposits);
          setTransactions(deposits);
        } else if (l1MessageStats.data) {
          // fetch all incoming txs (not just deposits)
          await processPageOfxDomainTxs(
            1,
            sentMessagesFromL1,
            l1MessageStats.data.messageStats.sentMessageCount,
            indexTo
          );
        }
      } else if (currentTableView === panels.OUTGOING) {
        if (token) {
          if (!page) {
            const deposits = await processValueTransactions(1, depositsInitiated.data.deposits);
            setTxAmountPending('deposits', deposits);
          }
          // fetch withdrawals
          const txs = !page
            ? withdrawalsInitiated
            : await withdrawalsInitiated.fetchMore({
                variables: {
                  indexTo,
                },
                query: getWithdrawals(indexTo),
                updateQuery: (prev, { fetchMoreResult }) => {
                  return Object.assign(prev, fetchMoreResult);
                },
              });
          setTotalTxCount(withdrawalStats.data.txStats.totalCount);
          const withdrawals = await processValueTransactions(2, txs.data.withdrawals);
          setTransactions(withdrawals);
        } else if (l2MessageStats.data) {
          // fetch all outgoing txs (not just withdrawals)
          await processPageOfxDomainTxs(
            2,
            sentMessagesFromL2,
            l2MessageStats.data.messageStats.sentMessageCount,
            indexTo
          );
        }
      }
      setIsFetchingMore(false);
    },
    [tokenSelection, transactions, currentTableView, l1MessageStats.data, depositsInitiated, depositStats.data, processValueTransactions, withdrawalsInitiated, processPageOfxDomainTxs, sentMessagesFromL1, l2MessageStats.data, withdrawalStats.data, sentMessagesFromL2]
  );

  const handleTokenSelection = (e: React.FormEvent<HTMLSelectElement>) => {
    const target = e.target as HTMLSelectElement;
    if (!queryParams) return;
    const tokenSymbol = target.value;
    if (tokenSymbol) {
      queryParams.set('token', tokenSymbol);
    } else {
      queryParams.delete('token');
      setTokenSelection(null);
    }
    history.push({
      search: queryParams.toString(),
    });
    const token = tokens[tokenSymbol];
    setTokenSelection(token);
    resetPricePoller(token ? token.coingeckoId : '');
    fetchTransactions({ token });
  };

  const resetPricePoller = React.useCallback(
    coingeckoId => {
      setFetchingPrice(true);
      if (coingeckoId) {
        const newIntervalId = window.setInterval(() => {
          fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`)
            .then(res => res.json())
            .then(data => {
              setPrice(data[coingeckoId].usd);
              setFetchingPrice(false);
            })
            .catch(console.error);
        }, 10000);

        if (priceIntervalId != null) {
          window.clearInterval(priceIntervalId);
        }
        setPriceIntervalId(newIntervalId);
      } else {
        window.clearInterval(priceIntervalId as number);
      }
    },
    [priceIntervalId]
  );

  /**
   * Handles switching page view
   */
  const handleTableViewChange = async (direction: TableViewType) => {
    setCurrentTableView(direction);
    if (direction === panels.INCOMING) {
      setTxsLoading(true);
      if (tokenSelection) {
        if (depositsInitiated.data) {
          setTotalTxCount(depositStats.data.txStats.totalCount);
          const deposits = await processValueTransactions(1, depositsInitiated.data.deposits);
          setTransactions(deposits);
        }
      } else if (l1MessageStats.data) {
        // show all incoming txs
        await processPageOfxDomainTxs(1, sentMessagesFromL1, l1MessageStats.data.messageStats.sentMessageCount);
      }
    } else if (direction === panels.OUTGOING) {
      setTxsLoading(true);
      if (tokenSelection) {
        if (withdrawalsInitiated.data) {
          setTotalTxCount(withdrawalStats.data.txStats.totalCount);
          const withdrawals = await processValueTransactions(2, withdrawalsInitiated.data.withdrawals);
          setTransactions(withdrawals);
        }
      } else if (l2MessageStats.data) {
        await processPageOfxDomainTxs(2, sentMessagesFromL2, l2MessageStats.data.messageStats.sentMessageCount);
      }
    }
  };

  /**
   * Sets query params object
   */
  React.useEffect(() => {
    if (!queryParams && location) {
      const params = new URLSearchParams(location.search.slice(1));
      const token = params.get('token');
      const dir = params.get('dir')  as TableViewType | "";
      setCurrentTableView(dir || 'incoming');

      if (token) {
        setTokenSelection(tokens[token]);
      }
      setQueryParams(params);
    }
  }, [location, queryParams]);

  /**
   * Fetches on initial page load and if tokenSymbol changes
   */
  React.useEffect(() => {
    (async () => {
      if (
        queryParams &&
        !transactions &&
        !txsLoading &&
        depositsInitiated.data &&
        withdrawalsInitiated.data &&
        depositStats.data &&
        withdrawalStats.data &&
        l1MessageStats.data &&
        l2MessageStats.data
      ) {
        setTxsLoading(true);
        const tokenSymbol = tokenSelection?.symbol;
        const direction = queryParams.get('dir') || 'incoming';

        if (tokenSelection?.coingeckoId) {
          resetPricePoller(tokenSelection.coingeckoId);
        }
        if (direction === 'incoming') {
          if (tokenSymbol) {
            const withdrawals = await processValueTransactions(2, withdrawalsInitiated.data.withdrawals);
            setTxAmountPending('withdrawals', withdrawals);
            const deposits = await processValueTransactions(1, depositsInitiated.data.deposits);
            setTransactions(deposits);
            setTotalTxCount(depositStats.data.txStats.totalCount);
          } else {
            // all incoming messages/transactions
            await processPageOfxDomainTxs(1, sentMessagesFromL1, l1MessageStats.data.messageStats.sentMessageCount);
          }
        } else {
          // direction === 'outgoing'
          if (tokenSymbol) {
            const deposits = await processValueTransactions(1, depositsInitiated.data.deposits);
            setTxAmountPending('deposits', deposits);
            const withdrawals = await processValueTransactions(2, withdrawalsInitiated.data.withdrawals);
            setTotalTxCount(withdrawalStats.data.txStats.totalCount);
            setTransactions(withdrawals);
          } else {
            // all outgoing messages/transactions
            await processPageOfxDomainTxs(2, sentMessagesFromL2, l2MessageStats.data.messageStats.sentMessageCount);
          }
        }
      }
    })();
  }, [queryParams, fetchTransactions, withdrawalsInitiated.data, withdrawalStats.data, depositsInitiated.data, depositStats.data, resetPricePoller, price, fetchingPrice, sentMessagesFromL1, relayedMessagesOnL2, relayedMessagesOnL1, sentMessagesFromL2, processPageOfxDomainTxs, l1MessageStats.data, l2MessageStats.data, tokenSelection, txsLoading, transactions, processValueTransactions]);

  React.useEffect(() => {
    (async () => {
      const l1TotalAmt = ethers.utils.formatEther(await snxL1Contract.balanceOf(addresses.l1.SNX.bridge));
      const l2TotalAmt = ethers.utils.formatEther(await snxL2Contract.totalSupply());
      setl1TotalAmt(l1TotalAmt);
      setl2TotalAmt(l2TotalAmt);
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      if (!transactions || !price || !withdrawalAmountPending) return;
      const diff = +l1TotalAmt - +l2TotalAmt - +withdrawalAmountPending;
      setl1VsL2WithdrawalDiff(diff.toFixed(2));
    })();
  }, [l1TotalAmt, l2TotalAmt, price, transactions, withdrawalAmountPending]);

  return (
    <>
      <Container maxW={'1400px'} py={4}>
        <Box as="header" d="flex" justifyContent="center">
          <Box pos="absolute" left={4}>
            <TokenSelector
              handleTokenSelection={handleTokenSelection}
              tokenSymbol={tokenSelection?.symbol || ''}
            />
          </Box>
          <Heading as="h1" size="xl" textAlign="center" mt={4} mb={16} fontWeight="300 !important">
            OΞ Transaction Tracker
          </Heading>
          <div />
        </Box>
        <Flex mb={16} w="600px" mx="auto">
          {tokenSelection && (
            <StatsTable
              price={price}
              depositAmountPending={depositAmountPending}
              withdrawalAmountPending={withdrawalAmountPending}
              l2TotalAmt={l2TotalAmt}
              l1TotalAmt={l1TotalAmt}
              l1VsL2lDiff={l1VsL2WithdrawalDiff}
              tokenSelection={tokenSelection}
            />
          )}
        </Flex>
        {/* <SearchInput handleAddressSearch={handleAddressSearch} /> */}
        <Switch>
          <Route path="/a/:address">
            {/* <AddressView
              contracts={contracts}
              price={price}
              deposits={deposits}
              withdrawals={withdrawals}
              isRefreshing={isRefreshing}
              refreshTransactions={refreshTransactions}
              getPastEvents={getPastEvents}
              l1Provider={l1Provider}
              l2Provider={l2Provider}
              watcher={watcher}
              setTransactions={setTransactions}
              setTxsLoading={setTxsLoading}
              outgoingTxLoading={outgoingTxLoading}
            /> */}
          </Route>
          <Route exact path="/">
            <TxHistoryTable
            transactions={transactions}
              txsLoading={txsLoading}
              handleTableViewChange={handleTableViewChange}
              fetchTransactions={fetchTransactions}
              isFetchingMore={isFetchingMore}
              currentTableView={currentTableView}
              price={price}
              refreshTransactions={refreshTransactions}
              isRefreshing={isRefreshing}
              totalTxCount={totalTxCount} // TODO: make all subgraph queries return a totalCount
              handleTokenSelection={handleTokenSelection}
              queryParams={queryParams as URLSearchParams}
              tokenSelection={tokenSelection as TokenSelection}
            />
          </Route>
        </Switch>
      </Container>
    </>
  );
}

export default App;
