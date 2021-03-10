import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Container } from '@chakra-ui/react';
import TxHistoryTable from './components/TxHistory';
import ETHGateway from './components/ETHGateway';

function App() {
  return (
    <>
      <Container maxW={'1400px'} py={4}>
        {/* <SearchInput handleAddressSearch={handleAddressSearch} /> */}
        <Switch>
          <Route exact path="/">
            <ETHGateway />
          </Route>
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
