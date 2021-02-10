import React from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import { Box, Button, Container, useColorMode, Heading, useToast } from '@chakra-ui/react';
import { JsonRpcProvider } from '@ethersproject/providers';
import { abis, addresses } from '@project/contracts';
import { useQuery } from '@apollo/react-hooks';
import { Watcher } from '@eth-optimism/watcher';
import SearchInput from './components/SearchInput';
import TxHistoryTable from './components/TxHistoryTable';
import AddressView from './components/AddressView';
import clients from './graphql/clients';
import { GET_WITHDRAWALS, GET_WITHDRAWAL_CONFIRMATIONS } from './graphql/subgraph';

// test address: 0x5A34F25040ba6E12daeA0512D4D2a0043ECc9292

// const SNX_BRIDGE_DEPLOY_BLOCK_NUMBER = 11656238;

const l1Provider = new JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`);
// const l2Provider = new JsonRpcProvider(`https://mainnet.optimism.io`);

const watcher = new Watcher({
  l1: {
    provider: l1Provider,
    messengerAddress: addresses.l1.messenger,
  },
  l2: {
    provider: new JsonRpcProvider(`https://mainnet.optimism.io`),
    messengerAddress: addresses.l2.messenger,
  },
});

const views = {
  DEPOSITS: 0,
  WITHDRAWALS: 1,
};

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const history = useHistory();
  const [currentTableView, setCurrentTableView] = React.useState(1);
  const location = useLocation();
  const [snxPrice, setSnxPrice] = React.useState(0);
  const [l2FromBlockNum, _setL2FromBlockNum] = React.useState(Number.POSITIVE_INFINITY);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [deposits, _setDeposits] = React.useState();
  const [withdrawals, _setWithdrawals] = React.useState();
  const [depositsLoading, setDepositsLoading] = React.useState(false);
  const [currentWithdrawalPage, setCurrentWithdrawalPage] = React.useState(0);
  const withdrawalConfirmations = useQuery(GET_WITHDRAWAL_CONFIRMATIONS, { client: clients.l1 });
  const withdrawalsInitiated = useQuery(GET_WITHDRAWALS, {
    client: clients.l2,
    variables: {
      offset: currentWithdrawalPage * 50,
      limit: 50,
    },
  });
  const toast = useToast();

  const clearCache = () => {
    localStorage.removeItem('l2ToBlockNum');
    localStorage.removeItem('l2FromBlockNum');
    localStorage.removeItem('withdrawals');
    window.location.reload();
  };

  const setWithdrawals = React.useCallback(transactions => {
    localStorage.setItem('withdrawals', JSON.stringify(transactions));
    _setWithdrawals(transactions);
  }, []);

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

  React.useEffect(() => {
    (async () => {
      if (
        currentTableView === views.WITHDRAWALS &&
        !withdrawalsInitiated.loading &&
        !withdrawalsInitiated.error &&
        withdrawalsInitiated.data &&
        !withdrawalConfirmations.loading &&
        !withdrawalConfirmations.error &&
        withdrawalConfirmations.data
      ) {
        console.log(withdrawalConfirmations.data);
        const withdrawalProms = withdrawalsInitiated.data.withdrawals.map(async tx => {
          tx.amount = ethers.utils.formatEther(tx.amount);
          tx.address = tx.account;
          tx.layer2Hash = tx.hash;
          const msgHashes = await watcher.getMessageHashesFromL2Tx(tx.hash);
          const receipt = await watcher.getL1TransactionReceipt(msgHashes[0], false);
          if (receipt) {
            tx.layer1Hash = receipt.transactionHash;
            const block = await l1Provider.getBlock(receipt.blockNumber);
            const timestamp = Number(block.timestamp);
            tx.otherLayerTimestamp = timestamp;
          }
          return tx;
        });
        const withdrawals = [];

        for (const promise of withdrawalProms) {
          withdrawals.push(await promise);
        }

        withdrawals.sort((a, b) => b.timestamp - a.timestamp);
        setWithdrawals(withdrawals);
      }
    })();
  }, [
    withdrawalsInitiated.loading,
    withdrawalsInitiated.error,
    withdrawalsInitiated.data,
    withdrawalsInitiated,
    withdrawalConfirmations.loading,
    withdrawalConfirmations.error,
    withdrawalConfirmations.data,
    setWithdrawals,
    currentTableView,
  ]);

  // Fetches SNX price every 10 seconds
  React.useEffect(() => {
    setInterval(() => {
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=havven&vs_currencies=usd`)
        .then(res => res.json())
        .then(data => {
          setSnxPrice(data.havven.usd);
        })
        .catch(console.error);
    }, 10000);
  }, []);

  return (
    <>
      <Container maxW={'1400px'} py={4}>
        <Box d="flex" justifyContent="flex-end">
          <Button onClick={clearCache}>Clear cache</Button>
          <Button borderRadius="100%" ml={4} p={0} onClick={toggleColorMode}>
            {colorMode === 'light' ? '🌜' : '🌞'}
          </Button>
        </Box>
        <Heading as="h1" size="xl" textAlign="center" mb={8}>
          OΞ SNX Tracker
        </Heading>
        {/* <SearchInput handleAddressSearch={handleAddressSearch} /> */}
        <Switch>
          <Route path="/a/:address">
            {/* <AddressView
              contracts={contracts}
              price={snxPrice}
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
              setCurrentTableView={setCurrentTableView}
              loadMore={() => setCurrentWithdrawalPage(count => count + 1)}
              // isLoadingMore={isLoadingMore}
              price={snxPrice}
              refreshTransactions={refreshTransactions}
              isRefreshing={isRefreshing}
              moreWithdrawalsToLoad={l2FromBlockNum > 0}
              // moreDepositsToLoad={l1FromBlockNum > SNX_BRIDGE_DEPLOY_BLOCK_NUMBER}
              withdrawalsLoading={withdrawalsInitiated.loading}
              depositsLoading={depositsLoading}
            />
          </Route>
        </Switch>
      </Container>
    </>
  );
}

export default App;
