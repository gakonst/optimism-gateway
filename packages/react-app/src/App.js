import React from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import DateTime from 'luxon/src/datetime.js';
import { ethers } from 'ethers';
import JSBI from 'jsbi';
import {
  Box,
  Button,
  Container,
  useColorMode,
  Heading,
  useToast,
  Flex,
  Spinner,
  Table,
  Thead,
  Tbody,
  Td,
  Tr,
  Th,
} from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import SearchInput from './components/SearchInput';
import TxHistoryTable from './components/TxHistory';
import AddressView from './components/AddressView';
import clients from './graphql/clients';
import { actions, buildQuery } from './graphql/subgraph';
import { formatUSD, formatNumber } from './helpers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { abis, addresses } from '@project/contracts';
import { panels } from './constants';

import { Fraction } from '@uniswap/sdk';

// test address: 0x5A34F25040ba6E12daeA0512D4D2a0043ECc9292

const l1Provider = new JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`);
const l2Provider = new JsonRpcProvider(`https://mainnet.optimism.io`);

const snxL1Contract = new Contract(addresses.l1.SNX.token, abis.SynthetixL1Token, l1Provider);
const snxL2Contract = new Contract(addresses.l2.SNX.token, abis.SynthetixL2Token, l2Provider);

const ITEMS_PER_PAGE = 200;

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const history = useHistory();
  const [currentTableView, setCurrentTableView] = React.useState(0);
  const location = useLocation();
  const [price, setPrice] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [deposits, setDeposits] = React.useState();
  const [withdrawals, setWithdrawals] = React.useState();
  const [tokensPendingWithdrawal, setTokensPendingWithdrawal] = React.useState();
  const [$valuePendingWithdrawal, set$ValuePendingWithdrawal] = React.useState();
  const [l1TotalAmt, setl1TotalAmt] = React.useState();
  const [l2TotalAmt, setl2TotalAmt] = React.useState();
  const [l1VsL2Difference, setL1VsL2Difference] = React.useState(0);
  const [depositsLoading, setDepositsLoading] = React.useState(false);
  const [withdrawalsLoading, setWithdrawalsLoading] = React.useState(false);
  const [depositsPageIdx, setDepositsPageIdx] = React.useState(0);
  const [withdrawalsPageIdx, setWithdrawalsPageIdx] = React.useState(0);
  const depositsInitiated = useQuery(buildQuery(actions.GET_DEPOSITS), {
    client: clients.l1,
  });
  const withdrawalConfirmations = useQuery(buildQuery(actions.GET_WITHDRAWAL_CONFIRMATIONS), { client: clients.l1 });
  const withdrawalsInitiated = useQuery(buildQuery(actions.GET_WITHDRAWALS), {
    client: clients.l2,
  });
  const sentMessagesFromL2 = useQuery(buildQuery(actions.GET_SENT_MESSAGES), {
    client: clients.l2,
  });
  const withdrawalStats = useQuery(buildQuery(actions.GET_WITHDRAWAL_STATS), {
    client: clients.l2,
  });
  const toast = useToast();

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

  const fetchMoreTransactions = async viewIdx => {
    if (viewIdx === panels.DEPOSITS) {
      const moreDeposits = await depositsInitiated.fetchMore({
        variables: {
          lastTimestamp: depositsInitiated.data.deposits[depositsInitiated.data.deposits.length - 1].timestamp,
        },
      });
      console.log(moreDeposits);
    } else {
      const newIndex = withdrawalsPageIdx + 1;
      setWithdrawalsPageIdx(newIndex);

      console.log(newIndex * ITEMS_PER_PAGE);

      const more = await withdrawalConfirmations.fetchMore({
        variables: {
          offset: newIndex * ITEMS_PER_PAGE,
        },
      });
      console.log(more?.data?.receivedWithdrawals[0]);
      withdrawalsInitiated.fetchMore({
        variables: {
          offset: newIndex * ITEMS_PER_PAGE,
        },
      });
    }
  };

  React.useEffect(() => {
    if (currentTableView === panels.DEPOSITS) {
      setDepositsLoading(!deposits);
    } else if (currentTableView === panels.WITHDRAWALS) {
      setWithdrawalsLoading(!withdrawals);
    }
  }, [currentTableView, deposits, depositsLoading, withdrawals]);

  React.useEffect(() => {
    (async () => {
      if (
        currentTableView === panels.DEPOSITS &&
        !deposits &&
        depositsInitiated.data
        // withdrawalConfirmations.data &&
        // sentMessagesFromL2.data
      ) {
        let deposits = depositsInitiated.data.deposits.map(rawTx => {
          const tx = { ...rawTx };
          tx.amount = ethers.utils.formatEther(tx.amount);
          tx.address = tx.account;
          tx.layer1Hash = tx.hash;
          tx.timestamp = tx.timestamp * 1000;
          // const sentMessage = sentMessagesFromL1.data.sentMessages.find(msg => msg.txHash === tx.layer2Hash);
          // const l2MsgHash = ethers.utils.solidityKeccak256(['bytes'], [sentMessage.message]);
          // const l2Data = withdrawalConfirmations.data.receivedWithdrawals.find(msg => msg.msgHash === l2MsgHash);
          // tx.layer2Hash = l2Data?.hash;
          // tx.otherLayerTimestamp = l2Data && l2Data.timestamp * 1000;
          return tx;
        });
        deposits.sort((a, b) => b.timestamp - a.timestamp);
        setDeposits(deposits);
      }
    })();
  }, [currentTableView, deposits, depositsInitiated.data]);

  React.useEffect(() => {
    (async () => {
      if (
        currentTableView === panels.WITHDRAWALS &&
        !withdrawals &&
        withdrawalsInitiated.data &&
        withdrawalConfirmations.data &&
        sentMessagesFromL2.data
      ) {
        let withdrawals = withdrawalsInitiated.data.withdrawals.map(rawTx => {
          const tx = { ...rawTx };
          tx.amount = ethers.utils.formatEther(tx.amount);
          tx.address = tx.account;
          tx.layer2Hash = tx.hash;
          tx.timestamp = tx.timestamp * 1000;
          const sentMessage = sentMessagesFromL2.data.sentMessages.find(msg => msg.txHash === tx.layer2Hash);
          const l1MsgHash = ethers.utils.solidityKeccak256(['bytes'], [sentMessage.message]);
          const l1Data = withdrawalConfirmations.data.receivedWithdrawals.find(msg => msg.msgHash === l1MsgHash);
          tx.layer1Hash = l1Data?.hash;
          tx.awaitingRelay =
            !tx.layer1Hash &&
            DateTime.fromMillis(tx.timestamp)
              .plus({ days: 7 })
              .toMillis() < Date.now();
          tx.otherLayerTimestamp = l1Data && l1Data.timestamp * 1000;
          delete tx.hash;
          return tx;
        });
        withdrawals.sort((a, b) => b.timestamp - a.timestamp);
        setWithdrawals(withdrawals);
      }
    })();
  }, [
    setWithdrawals,
    currentTableView,
    withdrawalsInitiated.data,
    withdrawalConfirmations.data,
    sentMessagesFromL2.data,
    withdrawals,
  ]);

  React.useEffect(() => {
    (async () => {
      if (!withdrawals || !price) return;

      const l1TotalAmt = ethers.utils.formatEther(await snxL1Contract.balanceOf(addresses.l1.SNX.bridge));
      const l2TotalAmt = ethers.utils.formatEther(await snxL2Contract.totalSupply());

      setl1TotalAmt(l1TotalAmt);
      setl2TotalAmt(l2TotalAmt);

      const pendingAmt = withdrawals.reduce((total, tx) => {
        return !tx.layer1Hash ? total + +tx.amount : total;
      }, 0);

      setL1VsL2Difference((+l1TotalAmt - +l2TotalAmt - pendingAmt).toFixed(2));
    })();
  }, [price, withdrawals]);

  // Fetches SNX price every 10 seconds
  React.useEffect(() => {
    setInterval(() => {
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=havven&vs_currencies=usd`)
        .then(res => res.json())
        .then(data => {
          setPrice(data.havven.usd);
        })
        .catch(console.error);
    }, 10000);
  }, []);

  React.useEffect(() => {
    if (withdrawalStats?.data?.stats) {
      let total = new Fraction(withdrawalStats?.data?.stats.total);
      total = total.divide((1e18).toString()).toFixed(2);
      setTokensPendingWithdrawal(total);
      set$ValuePendingWithdrawal(formatUSD(total * price));
    }
  }, [withdrawalStats, price]);

  // const withdrawalTotal =
  //   withdrawalStats?.data &&
  //   price &&
  //   formatNumber((+ethers.utils.formatEther(withdrawalStats.data.stats.total)).toFixed(2));
  return (
    <>
      <Container maxW={'1400px'} py={4}>
        <Box d="flex" justifyContent="flex-end">
          {/* <Button borderRadius="100%" ml={4} p={0} onClick={toggleColorMode}>
            {colorMode === 'light' ? '🌜' : '🌞'}
          </Button> */}
        </Box>
        <Heading as="h1" size="xl" textAlign="center" mb={16} mt={16}>
          OΞ SNX Tracker
        </Heading>
        <Flex mb={16} w="600px">
          {/* <SearchInput handleAddressSearch={handleAddressSearch} /> */}
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
                  <Td pl={0}>Pending withdrawals:</Td>
                  <Td textAlign="right" px={1}>
                    {tokensPendingWithdrawal || <Spinner size="xs" />}
                  </Td>
                  <Td textAlign="right" pr={0}>
                    {$valuePendingWithdrawal || <Spinner size="xs" />}
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
                  <Td pl={0}>SNX L1 Balance:</Td>
                  <Td textAlign="right" px={1}>
                    {l1TotalAmt ? formatNumber((+l1TotalAmt).toFixed(2)) : <Spinner size="xs" />}
                  </Td>
                  <Td textAlign="right" pr={0}>
                    {price && l1TotalAmt ? formatUSD(price * l1TotalAmt) : <Spinner size="xs" />}
                  </Td>
                </Tr>
                {Boolean(l1VsL2Difference) && (
                  <Tr>
                    <Td pl={0}>L1 vs L2 difference:</Td>
                    <Td textAlign="right" px={1}>
                      {formatNumber(l1VsL2Difference)}
                    </Td>
                    <Td textAlign="right" pr={0}>
                      {formatUSD(price * l1VsL2Difference)}
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Flex>
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
              setWithdrawals={setWithdrawals}
              setWithdrawalsLoading={setWithdrawalsLoading}
              withdrawalsLoading={withdrawalsLoading}
            /> */}
          </Route>
          <Route exact path="/">
            <TxHistoryTable
              deposits={deposits}
              withdrawals={withdrawals}
              depositsLoading={depositsLoading}
              withdrawalsLoading={withdrawalsLoading}
              setCurrentTableView={setCurrentTableView}
              fetchMoreTransactions={fetchMoreTransactions}
              // isLoadingMore={isLoadingMore}
              price={price}
              refreshTransactions={refreshTransactions}
              isRefreshing={isRefreshing}
              // moreWithdrawalsToLoad={l2FromBlockNum > 0}
              // moreDepositsToLoad={l1FromBlockNum > SNX_BRIDGE_DEPLOY_BLOCK_NUMBER}
            />
          </Route>
        </Switch>
      </Container>
    </>
  );
}

export default App;
