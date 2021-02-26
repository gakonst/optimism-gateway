import React from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import DateTime from 'luxon/src/datetime.js';
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
import { decodeSentMessage, processSentMessage } from './helpers';

const l1Provider = new JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`);
const l2Provider = new JsonRpcProvider(`https://mainnet.optimism.io`);
const snxL1Contract = new Contract(addresses.l1.SNX.token, abis.SynthetixL1Token, l1Provider);
const snxL2Contract = new Contract(addresses.l2.SNX.token, abis.SynthetixL2Token, l2Provider);

function App() {
  const history = useHistory();
  const [currentTableView, setCurrentTableView] = React.useState<TableViewType | null>();
  const [price, setPrice] = React.useState(0);
  const [fetchingPrice, setFetchingPrice] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [transactions, _setTransactions] = React.useState<Transaction[] | null>(null);
  const [depositAmountPending, setDepositAmountPending] = React.useState<number | string | null>(null);
  const [withdrawalAmountPending, setWithdrawalAmountPending] = React.useState<number | string |  null>(null);
  const [l1TotalAmt, setl1TotalAmt] = React.useState<number | null>(null);
  const [l2TotalAmt, setl2TotalAmt] = React.useState<number | null>(null);
  const [l1VsL2WithdrawalDiff, setl1VsL2WithdrawalDiff] = React.useState(null);
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
    if (currentTableView === 'incoming') {
      setIsRefreshing(true);
      if (tokenSelection) {
        await withdrawalsInitiated.refetch();
      } else {
        await sentMessagesFromL2.refetch();
      }
      setIsRefreshing(false);
    } else if (currentTableView === 'outgoing') {
      setIsRefreshing(true);
      if (tokenSelection) {
        await depositsInitiated.refetch();
      } else {
        await sentMessagesFromL1.refetch();
      }
      setIsRefreshing(false);
    }
  };

  const getFilteredRelayedTxs = React.useCallback(async (sentMsgTxs, relayedMsgTxs) => {
    const sentMsgHashes = sentMsgTxs.map((msgTx: Transaction) => {
      return ethers.utils.solidityKeccak256(['bytes'], [msgTx.message]);
    });
    const relayedTxs = (
      await relayedMsgTxs.fetchMore({
        variables: { searchHashes: sentMsgHashes },
        query: getRelayedMessages(sentMsgHashes),
      })
    ).data.relayedMessages;
    return relayedTxs;
  }, []);

  /**
   * Prepares deposit data after getting ancillary data from cross domain messenger events
   */
  const processDeposits = React.useCallback(
    async rawDeposits => {
      // retrieve relevant messages based on this batch of tx timestamps
      const depositL1TxHashes = rawDeposits.map((tx: Transaction) => tx.hash);
      const sentMsgTxs = (
        await sentMessagesFromL1.fetchMore({
          variables: { searchHashes: depositL1TxHashes },
          query: getSentMessages({ searchHashes: depositL1TxHashes }),
        })
      ).data.sentMessages;

      const relayedTxs = await getFilteredRelayedTxs(sentMsgTxs, relayedMessagesOnL2);

      let deposits = rawDeposits.map((rawTx: Transaction) => {
        const tx = { ...rawTx };
        tx.from = tx.account;
        tx.layer1Hash = tx.hash;
        tx.timestamp = tx.timestamp * 1000;
        const sentMessage = sentMsgTxs.find((msgTx: Transaction) => msgTx.hash === tx.hash);
        const sentMsgHash = ethers.utils.solidityKeccak256(['bytes'], [sentMessage.message]);
        const [_, to] = decodeSentMessage(sentMessage.message);
        tx.to = to;
        const relayedTx = relayedTxs.find((msg: Transaction) => msg.msgHash === sentMsgHash);
        tx.layer2Hash = relayedTx?.hash;
        tx.relayedTxTimestamp = relayedTx && relayedTx.timestamp * 1000;
        delete tx.hash;
        return tx;
      });
      setTxAmountPending('deposits', deposits);
      return deposits.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp);
    },
    [getFilteredRelayedTxs, relayedMessagesOnL2, sentMessagesFromL1]
  );

  /**
   * Prepares withdrawal data after getting ancillary data from cross domain messenger events
   */
  const processWithdrawals = React.useCallback(
    async rawWithdrawals => {
      // retrieve relevant messages based on this batch of tx timestamps
      const withdrawalL2TxHashes = rawWithdrawals.map((tx: Transaction) => tx.hash);
      const sentMsgTxs = (
        await sentMessagesFromL2.fetchMore({
          variables: { searchHashes: withdrawalL2TxHashes },
          query: getSentMessages({ searchHashes: withdrawalL2TxHashes }),
        })
      ).data.sentMessages;

      const relayedTxs = await getFilteredRelayedTxs(sentMsgTxs, relayedMessagesOnL1);

      let withdrawals = rawWithdrawals.map((rawTx: Transaction) => {
        const tx = { ...rawTx };
        tx.from = tx.account;
        tx.layer2Hash = tx.hash;
        tx.timestamp = tx.timestamp * 1000;
        const sentMessage = sentMsgTxs.find((msgTx: Transaction) => msgTx.hash === tx.hash);
        const sentMsgHash = ethers.utils.solidityKeccak256(['bytes'], [sentMessage.message]);
        const relayedTx = relayedTxs.find((msg: Transaction) => msg.msgHash === sentMsgHash);
        const [_, to] = decodeSentMessage(sentMessage.message);
        tx.to = to;
        tx.layer1Hash = relayedTx?.hash;
        tx.awaitingRelay =
          !tx.layer1Hash &&
          DateTime.fromMillis(tx.timestamp)
            .plus({ days: 7 })
            .toMillis() < Date.now();
        tx.relayedTxTimestamp = relayedTx && relayedTx.timestamp * 1000;
        delete tx.hash;
        return tx;
      });

      setTxAmountPending('withdrawals', withdrawals);
      return withdrawals.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp);
    },
    [getFilteredRelayedTxs, relayedMessagesOnL1, sentMessagesFromL2]
  );

  const processPageOfxDomainTxs = React.useCallback(
    async (layer, sentMessages, totalMessageCount, indexTo) => {
      setIsFetchingMore(true);
      setTotalTxCount(totalMessageCount);

      let sentMsgTxs = (
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
    [getFilteredRelayedTxs, relayedMessagesOnL1, relayedMessagesOnL2]
  );

  const fetchTransactions = React.useCallback(
    async ({ page, token: _token }) => {
      const token = _token || tokenSelection;
      if (!!page) {
        setIsFetchingMore(true);
      } else {
        setTxsLoading(true);
      }

      const firstTx = transactions && transactions[0];
      const lastTx = transactions && transactions[transactions.length - 1];

      // If page isn't specified, start from the start of the list
      const indexTo = !page || !transactions ? 0 : page === 'prev' ? firstTx.index + FETCH_LIMIT + 1 : lastTx.index;
      if (currentTableView === panels.INCOMING) {
        // fetch deposits
        if (token) {
          if (!page) {
            const withdrawals = await processWithdrawals(withdrawalsInitiated.data.withdrawals);
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
          const deposits = await processDeposits(txs.data.deposits);
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
            const deposits = await processDeposits(depositsInitiated.data.deposits);
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
          const withdrawals = await processWithdrawals(txs.data.withdrawals);
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
    [
      transactions,
      currentTableView,
      tokenSelection,
      depositStats.data,
      depositsInitiated,
      processDeposits,
      processPageOfxDomainTxs,
      sentMessagesFromL1,
      l1MessageStats.data,
      withdrawalStats.data,
      withdrawalsInitiated,
      processWithdrawals,
      sentMessagesFromL2,
      l2MessageStats.data,
    ]
  );

  const handleTokenSelection = e => {
    if (!queryParams) return;
    const tokenSymbol = e.target.value;
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
        const newIntervalId = setInterval(() => {
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
        window.clearInterval(priceIntervalId);
      }
    },
    [priceIntervalId]
  );

  /**
   * Handles switching page view
   */
  const handleTableViewChange = async direction => {
    setCurrentTableView(direction);
    if (direction === panels.INCOMING) {
      setTxsLoading(true);
      if (tokenSelection) {
        if (depositsInitiated.data) {
          setTotalTxCount(depositStats.data.txStats.totalCount);
          const deposits = await processDeposits(depositsInitiated.data.deposits);
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
          const withdrawals = await processWithdrawals(withdrawalsInitiated.data.withdrawals);
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
      const dir = params.get('dir');
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
            const withdrawals = await processWithdrawals(withdrawalsInitiated.data.withdrawals);
            setTxAmountPending('withdrawals', withdrawals);
            const deposits = await processDeposits(depositsInitiated.data.deposits);
            setTransactions(deposits);
            setTotalTxCount(depositStats.data.txStats.totalCount);
          } else {
            console.log('fetching all incoming txs');
            // all incoming messages/transactions
            await processPageOfxDomainTxs(1, sentMessagesFromL1, l1MessageStats.data.messageStats.sentMessageCount);
          }
        } else {
          // direction === 'outgoing'
          if (tokenSymbol) {
            const deposits = await processDeposits(depositsInitiated.data.deposits);
            setTxAmountPending('deposits', deposits);
            const withdrawals = await processWithdrawals(withdrawalsInitiated.data.withdrawals);
            setTotalTxCount(withdrawalStats.data.txStats.totalCount);
            setTransactions(withdrawals);
          } else {
            console.log('fetching all outgoing txs');
            // all outgoing messages/transactions
            await processPageOfxDomainTxs(2, sentMessagesFromL2, l2MessageStats.data.messageStats.sentMessageCount);
          }
        }
      }
    })();
  }, [
    queryParams,
    fetchTransactions,
    processWithdrawals,
    withdrawalsInitiated.data,
    withdrawalStats.data,
    depositsInitiated.data,
    depositStats.data,
    resetPricePoller,
    price,
    fetchingPrice,
    sentMessagesFromL1,
    processDeposits,
    relayedMessagesOnL2,
    relayedMessagesOnL1,
    sentMessagesFromL2,
    processPageOfxDomainTxs,
    l1MessageStats.data,
    l2MessageStats.data,
    tokenSelection,
    txsLoading,
    transactions,
  ]);

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
      const diff = +l1TotalAmt - +l2TotalAmt - withdrawalAmountPending;
      setl1VsL2WithdrawalDiff(diff.toFixed(2));
    })();
  }, [l1TotalAmt, l2TotalAmt, price, transactions, withdrawalAmountPending]);

  // if (transactions) {
  //   console.log('totalTxCount', totalTxCount);
  //   console.log('intransactions[0].indexdex', transactions[0].index);
  // }

  return (
    <>
      <Container maxW={'1400px'} py={4}>
        <Box as="header" d="flex" justifyContent="center">
          <Box pos="absolute" left={4}>
            <TokenSelector
              handleTokenSelection={handleTokenSelection}
              tokenSymbol={tokenSelection && tokenSelection.symbol}
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
              queryParams={queryParams}
              tokenSelection={tokenSelection}
            />
          </Route>
        </Switch>
      </Container>
    </>
  );
}

export default App;
