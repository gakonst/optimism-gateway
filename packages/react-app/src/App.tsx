import React from 'react';
import { useLocation, Switch, Route, Link as RouterLink } from 'react-router-dom';
import { Link, Box, Button, Container, useColorMode, Heading, HStack } from '@chakra-ui/react';
import TxHistoryTable from './components/TxHistory';
import ETHGateway from './components/ETHGateway';

function App() {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();

  return (
    <>
      <Container maxW={'1400px'} p="4">
        <Box d="flex" justifyContent="space-between" pb={16}>
          <Link to="/">
            <Heading
              className="rainbowText"
              userSelect="none"
              as="h1"
              size="lg"
              mt={0}
              fontWeight={'500'}
              fontStyle="italic"
              color="brand.primary"
            >
              Optimism Gateway
            </Heading>
          </Link>
          <HStack spacing={8} as="nav">
            {[
              { path: '/', text: 'Gateway' },
              { path: '/txs', text: 'History' },
            ].map(navItem => (
              <Link
                as={RouterLink}
                fontSize="1.4rem"
                color="default !important"
                to={navItem.path}
                opacity={location.pathname === navItem.path ? 1 : 0.7}
                _hover={{ opacity: 1 }}
                boxShadow="none !important"
                textDecoration="none !important"
              >
                {navItem.text}
              </Link>
            ))}
            <Box d="flex" alignItems="center">
              <Button borderRadius="100%" ml={4} p={0} onClick={toggleColorMode}>
                {colorMode === 'light' ? '🌜' : '🌞'}
              </Button>
            </Box>
          </HStack>
        </Box>
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
