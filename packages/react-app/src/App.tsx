import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Container, useDisclosure } from '@chakra-ui/react';
import TxHistoryTable from './components/TxHistory';
import ETHGateway from './components/ETHGateway';
import HeaderNav from './components/HeaderNav';

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Container maxW={'1400px'} p="4">
        <HeaderNav isOpen={isOpen} onOpen={onOpen} onClose={onClose} />
        <Switch>
          <Route exact path="/">
            <ETHGateway />
          </Route>
          {/* <SearchInput handleAddressSearch={handleAddressSearch} /> */}
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
          <Route exact path="/txs">
            <TxHistoryTable />
          </Route>
        </Switch>
      </Container>
    </>
  );
}

export default App;
