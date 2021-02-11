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
import { GET_WITHDRAWALS, GET_SENT_MESSAGES, GET_WITHDRAWAL_CONFIRMATIONS } from './graphql/subgraph';

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
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [deposits, _setDeposits] = React.useState();
  const [withdrawals, setWithdrawals] = React.useState();
  const [depositsLoading, setDepositsLoading] = React.useState(false);
  const [currentWithdrawalIndex, setCurrentWithdrawalIndex] = React.useState(0);
  const withdrawalConfirmations = useQuery(GET_WITHDRAWAL_CONFIRMATIONS, { client: clients.l1 });
  const withdrawalsInitiated = useQuery(GET_WITHDRAWALS, {
    client: clients.l2,
    // variables: {
    //   offset: currentWithdrawalIndex * 50,
    //   limit: 50,
    // },
  });
  const sentMessagesFromL2 = useQuery(GET_SENT_MESSAGES, {
    client: clients.l2,
    // variables: {
    //   offset: currentWithdrawalIndex * 50,
    //   limit: 50,
    // },
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

  React.useEffect(() => {
    (async () => {
      if (
        currentTableView === views.WITHDRAWALS &&
        withdrawalsInitiated.data &&
        withdrawalConfirmations.data &&
        sentMessagesFromL2.data
      ) {
        let withdrawals = withdrawalsInitiated.data.withdrawals.map(tx => {
          tx.amount = ethers.utils.formatEther(tx.amount);
          tx.address = tx.account;
          tx.layer2Hash = tx.hash;
          tx.timestamp = tx.timestamp * 1000;

          const sentMessage = sentMessagesFromL2.data.sentMessages.find(msg => msg.txHash === tx.layer2Hash);
          const l1MsgHash = ethers.utils.solidityKeccak256(['bytes'], [sentMessage.message]);

          const l1Data = withdrawalConfirmations.data.receivedWithdrawals.find(msg => msg.msgHash === l1MsgHash);
          tx.layer1Hash = l1Data?.hash;
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
              loadMore={() => setCurrentWithdrawalIndex(count => count + 1)}
              // isLoadingMore={isLoadingMore}
              price={snxPrice}
              refreshTransactions={refreshTransactions}
              isRefreshing={isRefreshing}
              // moreWithdrawalsToLoad={l2FromBlockNum > 0}
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
