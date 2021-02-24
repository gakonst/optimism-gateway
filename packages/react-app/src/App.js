import React from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import DateTime from 'luxon/src/datetime.js';
import { Fraction } from '@uniswap/sdk';
import { ethers } from 'ethers';
import { Box, Container, Heading, useToast, Flex } from '@chakra-ui/react';
import { useQuery, useLazyQuery } from '@apollo/client';
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

const l1Provider = new JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`);
const l2Provider = new JsonRpcProvider(`https://mainnet.optimism.io`);
const snxL1Contract = new Contract(addresses.l1.SNX.token, abis.SynthetixL1Token, l1Provider);
const snxL2Contract = new Contract(addresses.l2.SNX.token, abis.SynthetixL2Token, l2Provider);

function App() {
  const history = useHistory();
  const [currentTableView, setCurrentTableView] = React.useState();
  const [price, setPrice] = React.useState(0);
  const [fetchingPrice, setFetchingPrice] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [transactions, _setTransactions] = React.useState();
  const [depositAmountPending, setDepositAmountPending] = React.useState(null);
  const [withdrawalAmountPending, setWithdrawalAmountPending] = React.useState(null);
  const [l1TotalAmt, setl1TotalAmt] = React.useState(null);
  const [l2TotalAmt, setl2TotalAmt] = React.useState(null);
  const [l1VsL2WithdrawalDiff, setl1VsL2WithdrawalDiff] = React.useState(null);
  const [txsLoading, setTxsLoading] = React.useState(false);
  const [tokenSelection, setTokenSelection] = React.useState(null);
  const [priceIntervalId, setPriceIntervalId] = React.useState(null);
  const [queryParams, setQueryParams] = React.useState(null);
  const depositsInitiated = useQuery(getDeposits(), {
    client: clients.l1,
    notifyOnNetworkStatusChange: true,
  });
  const withdrawalsInitiated = useQuery(getWithdrawals(), {
    client: clients.l2,
    notifyOnNetworkStatusChange: true,
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

  const setTransactions = transactions => {
    setTxsLoading(false);
    _setTransactions(transactions);
  };

  /**
   * Routes to address page if user enters valid address
   */
  const handleAddressSearch = async address => {
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
    await withdrawalsInitiated.refetch();
    setIsRefreshing(false);
  };

  const processDeposits = React.useCallback(
    async rawDeposits => {
      // retrieve relevant messages based on this batch of tx timestamps
      const depositL1TxHashes = rawDeposits.map(tx => tx.hash);
      const currentSentMsgs = (
        await sentMessagesFromL1.fetchMore({
          variables: { searchHashes: depositL1TxHashes },
          query: getSentMessages(depositL1TxHashes),
        })
      ).data.sentMessages;
      const sentMsgHashes = currentSentMsgs.map(msgTx => {
        return ethers.utils.solidityKeccak256(['bytes'], [msgTx.message]);
      });
      const currentRelayedMsgs = (
        await relayedMessagesOnL2.fetchMore({
          variables: { searchHashes: sentMsgHashes },
          query: getRelayedMessages(sentMsgHashes),
        })
      ).data.relayedMessages;

      let deposits = rawDeposits.map(rawTx => {
        const tx = { ...rawTx };
        tx.address = tx.account;
        tx.layer1Hash = tx.hash;
        tx.timestamp = tx.timestamp * 1000;
        const sentMessage = currentSentMsgs.find(msgTx => msgTx.hash === tx.hash);
        const sentMsgHash = ethers.utils.solidityKeccak256(['bytes'], [sentMessage.message]);
        const relayedTx = currentRelayedMsgs.find(msg => msg.msgHash === sentMsgHash);
        tx.layer2Hash = relayedTx?.hash;
        tx.awaitingRelay =
          !tx.layer2Hash &&
          DateTime.fromMillis(tx.timestamp)
            .plus({ days: 7 })
            .toMillis() < Date.now();
        tx.otherLayerTimestamp = relayedTx && relayedTx.timestamp * 1000;
        delete tx.hash;
        return tx;
      });
      const amountPending = deposits.reduce((total, tx) => {
        if (!tx.layer2Hash) {
          total = total.add(tx.amount);
        }
        return total;
      }, new Fraction(0));
      setDepositAmountPending(amountPending.divide((1e18).toString()).toFixed(2));
      return deposits.sort((a, b) => b.timestamp - a.timestamp);
    },
    [relayedMessagesOnL2, sentMessagesFromL1]
  );

  const processWithdrawals = React.useCallback(
    async rawWithdrawals => {
      // retrieve relevant messages based on this batch of tx timestamps
      const withdrawalL2TxHashes = rawWithdrawals.map(tx => tx.hash);
      const currentSentMsgs = (
        await sentMessagesFromL2.fetchMore({
          variables: { searchHashes: withdrawalL2TxHashes },
        })
      ).data.sentMessages;

      const sentMsgHashes = currentSentMsgs.map(msgTx => {
        return ethers.utils.solidityKeccak256(['bytes'], [msgTx.message]);
      });

      const currentRelayedMsgs = (
        await relayedMessagesOnL1.fetchMore({
          variables: { searchHashes: sentMsgHashes },
        })
      ).data.relayedMessages;

      let withdrawals = rawWithdrawals.map(rawTx => {
        const tx = { ...rawTx };
        tx.address = tx.account;
        tx.layer2Hash = tx.hash;
        tx.timestamp = tx.timestamp * 1000;
        const sentMessage = currentSentMsgs.find(msgTx => msgTx.hash === tx.hash);
        const sentMsgHash = ethers.utils.solidityKeccak256(['bytes'], [sentMessage.message]);
        const relayedTx = currentRelayedMsgs.find(msg => msg.msgHash === sentMsgHash);
        tx.layer1Hash = relayedTx?.hash;
        tx.awaitingRelay =
          !tx.layer1Hash &&
          DateTime.fromMillis(tx.timestamp)
            .plus({ days: 7 })
            .toMillis() < Date.now();
        tx.otherLayerTimestamp = relayedTx && relayedTx.timestamp * 1000;
        delete tx.hash;
        return tx;
      });
      const amountPending = withdrawals.reduce((total, tx) => {
        if (!tx.layer1Hash) {
          total = total.add(tx.amount);
        }
        return total;
      }, new Fraction(0));
      setWithdrawalAmountPending(amountPending.divide((1e18).toString()).toFixed(2));
      return withdrawals.sort((a, b) => b.timestamp - a.timestamp);
    },
    [relayedMessagesOnL1, sentMessagesFromL2]
  );

  const fetchNewPage = React.useCallback(
    async page => {
      if (currentTableView === panels.INCOMING) {
        if (tokenSelection) {
          const firstTx = depositsInitiated.data.deposits[0];
          const lastTx = depositsInitiated.data.deposits[depositsInitiated.data.deposits.length - 1];
          const indexTo = page === 'prev' ? firstTx.index + FETCH_LIMIT + 1 : lastTx.index;
          const more = await depositsInitiated.fetchMore({
            variables: {
              indexTo,
            },
            query: getDeposits(indexTo),
            updateQuery: (prev, { fetchMoreResult }) => {
              return Object.assign(prev, fetchMoreResult);
            },
          });
          const deposits = await processDeposits(more.data.deposits);
          setTransactions(deposits);
        } else {
          // todo: get all incoming transactions
        }
      } else if (currentTableView === panels.OUTGOING) {
        if (tokenSelection) {
          const firstTx = withdrawalsInitiated.data.withdrawals[0];
          const lastTx = withdrawalsInitiated.data.withdrawals[withdrawalsInitiated.data.withdrawals.length - 1];
          const indexTo = page === 'prev' ? firstTx.index + FETCH_LIMIT + 1 : lastTx.index;
          const more = await withdrawalsInitiated.fetchMore({
            variables: {
              indexTo,
            },
            query: getWithdrawals(indexTo),
            updateQuery: (prev, { fetchMoreResult }) => {
              return Object.assign(prev, fetchMoreResult);
            },
          });
          const withdrawals = await processWithdrawals(more.data.withdrawals);
          setTransactions(withdrawals);
        } else {
          // todo: get all outgoing transactions
        }
      }
    },
    [currentTableView, tokenSelection, depositsInitiated, processDeposits, withdrawalsInitiated, processWithdrawals]
  );

  const handleTokenSelection = e => {
    if (!queryParams) return;
    const tokenSymbol = e.target.value;
    if (tokenSymbol) {
      queryParams.set('token', tokenSymbol);
    } else {
      queryParams.delete('token');
      setTokenSelection(null);
      // todo: fetch & set all incoming/outgoing transactions
    }
    history.push({
      search: queryParams.toString(),
    });
    const token = tokens[tokenSymbol];
    setTokenSelection(token);
    resetPricePoller(token ? token.coingeckoId : '');
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
    if (direction === panels.INCOMING && depositsInitiated.data) {
      setTxsLoading(true);
      if (tokenSelection) {
        const deposits = await processDeposits(depositsInitiated.data.deposits);
        setTransactions(deposits);
      }
    } else if (direction === panels.OUTGOING && withdrawalsInitiated.data) {
      setTxsLoading(true);
      if (tokenSelection) {
        const withdrawals = await processWithdrawals(withdrawalsInitiated.data.withdrawals);
        setTransactions(withdrawals);
      }
    }
  };

  React.useEffect(() => {
    if (!queryParams && location) {
      const params = new URLSearchParams(location.search.slice(1));
      setCurrentTableView(params.get('dir') || 'incoming');
      setQueryParams(params);
    }
  }, [location, queryParams]);

  /**
   * Parses query params to establish page's initial state
   */
  React.useEffect(() => {
    (async () => {
      if (queryParams) {
        const tokenSymbol = queryParams.get('token');
        if (tokenSymbol && !price && !fetchingPrice) {
          setTokenSelection(tokens[tokenSymbol]);
          resetPricePoller(tokens[tokenSymbol].coingeckoId);
        }

        const direction = queryParams.get('dir') || 'incoming';
        if (direction === 'incoming') {
          if (tokenSymbol && depositsInitiated.data) {
            const deposits = await processDeposits(depositsInitiated.data.deposits);
            setTransactions(deposits);
          } else {
            // TODO: fetch all incoming transactions
            // const currentSentMsgs = (
            //   await sentMessagesFromL1.fetchMore({
            //     variables: { searchHashes: depositL1TxHashes },
            //   })
            // ).data.sentMessages;
            // setTransactions([]);
          }
        } else {
          // direction === 'outgoing'
          if (tokenSymbol && withdrawalsInitiated.data) {
            const withdrawals = await processWithdrawals(withdrawalsInitiated.data.withdrawals);
            setTransactions(withdrawals);
          } else {
            // TODO: fetch all outgoing transactions
            // setTransactions([]);
          }
        }
      }
    })();
  }, [
    queryParams,
    fetchNewPage,
    processWithdrawals,
    withdrawalsInitiated.data,
    depositsInitiated.data,
    resetPricePoller,
    price,
    fetchingPrice,
    sentMessagesFromL1,
    processDeposits,
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

  return (
    <>
      <Container maxW={'1400px'} py={4}>
        <Box as="header" d="flex">
          <TokenSelector
            handleTokenSelection={handleTokenSelection}
            tokenSymbol={tokenSelection && tokenSelection.symbol}
          />
        </Box>
        <Heading as="h1" size="xl" textAlign="center" mt={8} mb={16} fontWeight="300 !important">
          OΞ Transaction Tracker
        </Heading>
        <Flex mb={16} w="600px" mx="auto">
          {tokenSelection && (
            <StatsTable
              price={price}
              depositAmountPending={depositAmountPending}
              withdrawalAmountPending={withdrawalAmountPending}
              l2TotalAmt={l2TotalAmt}
              l1TotalAmt={l1TotalAmt}
              l1VsL2lDiff={l1VsL2WithdrawalDiff}
              token={tokenSelection}
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
              fetchMore={fetchNewPage}
              // isLoadingMore={isLoadingMore}
              currentTableView={currentTableView}
              price={price}
              refreshTransactions={refreshTransactions}
              isRefreshing={isRefreshing}
              totalCount={Number.MAX_SAFE_INTEGER} // TODO: make all subgraph queries return a totalCount
              handleTokenSelection={handleTokenSelection}
              queryParams={queryParams}
            />
          </Route>
        </Switch>
      </Container>
    </>
  );
}

export default App;
