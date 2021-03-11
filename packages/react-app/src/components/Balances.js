import React from 'react';
import {
  Box,
  Image,
  Heading,
  HStack,
  Grid,
  GridItem,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Button,
  Spinner,
} from '@chakra-ui/react';
import OptimismButton from './OptimismButton';
import { ArrowDownIcon } from '@chakra-ui/icons';
import { capitalize } from '../helpers';
import { chainIdLayerMap, chainIds } from '../constants';

const MaxButton = ({ onClick }) => (
  <Button opacity={0.8} bg="transparent" p={0.5} _focus={{ boxShadow: 'none' }} onClick={onClick}>
    Max
  </Button>
);

const TopRow = ({
  balancesLoading,
  balance,
  setInputValue,
  inputValue,
  heading,
  handleTransaction,
  txPending,
  bg,
  isDisabled,
}) => {
  const handleMaxValue = () => {
    setInputValue(balance);
  };
  return (
    <>
      <Heading size="sm" mt={0} mb={4} px={2}>
        {heading}
      </Heading>
      <Box columnGap={4} templateColumns="1fr 50px" borderRadius="20px" padding="1rem 1rem 1.5rem" bg={bg}>
        <Box>
          <AccentText />
          <Box d="flex" alignItems="center" mb={4} justifyContent="space-between">
            <Box d="flex" alignItems="center">
              <Image d="inline" w={5} h={5} mr={2} src="/logos/ETH.svg" alt="ETH Logo" />
              <Box whiteSpace="pre" overflow="hidden" textOverflow="ellipsis" mr={2}>
                <Button bg="transparent !important" padding={0} onClick={handleMaxValue}>
                  {balancesLoading ? <Spinner size="xs" /> : balance}
                </Button>
              </Box>{' '}
              ETH
            </Box>
            <MaxButton onClick={handleMaxValue} />
          </Box>
        </Box>
        <div />
        <Box d="flex" alignItems="center" w="100%">
          <NumberInput
            placeholder="Amount"
            defaultValue={0}
            onChange={val => setInputValue(val)}
            value={inputValue}
            min={0}
            max={balance}
            step={0.1}
            w="100%"
            isDisabled={isDisabled}
          >
            <NumberInputField fontSize="1.5rem" h="50px" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Text ml={4} fontSize="1.2rem" d="flex" alignItems="center" justifyContent="center">
            ETH
          </Text>
        </Box>
      </Box>
    </>
  );
};

const AccentText = () => (
  <Text fontSize="sm" opacity={0.7} mb={2}>
    Balance
  </Text>
);

function Balances({
  contracts,
  userAddress,
  txPending,
  l1Balance,
  l2Balance,
  inputValue,
  setInputValue,
  handleDeposit,
  handleWithdraw,
  showErrorToast,
  showConnectModal,
  connectedChainId,
  switchLayers,
  balancesLoading,
}) {
  const sectionBg = useColorModeValue('white', 'gray.800');
  const connectedLayer = chainIdLayerMap[connectedChainId];
  const network =
    connectedChainId === chainIds.MAINNET_L1 || connectedChainId === chainIds.MAINNET_L2 ? 'mainnet' : 'kovan';

  return (
    <>
      <Box pb={8} d="flex" alignItems="center" justifyContent="space-between">
        <Box>
          {connectedLayer && (
            <>
              Connected to{' '}
              <Box as="span" color="brand.primary">
                {connectedLayer === 1 ? capitalize(network) : 'Optimism'}
              </Box>
            </>
          )}
        </Box>
        {connectedLayer ? (
          <OptimismButton size="sm" ml={4} px={0} boxShadow="none !important" onClick={switchLayers} variant="link">
            Switch network
          </OptimismButton>
        ) : (
          <Text fontWeight="bold" color="brand.primary">
            Not connected
          </Text>
        )}
      </Box>

      {!connectedLayer || connectedLayer === 1 ? (
        <TopRow
          balance={l1Balance}
          setInputValue={setInputValue}
          heading={connectedLayer ? network.toUpperCase() : ''}
          handleTransaction={handleDeposit}
          inputValue={inputValue}
          txPending={txPending}
          bg={sectionBg}
          isDisabled={connectedLayer === null}
          balancesLoading={balancesLoading}
        />
      ) : (
        <TopRow
          balance={l2Balance}
          inputValue={inputValue}
          setInputValue={setInputValue}
          heading={connectedLayer ? 'OPTIMISM' : ''}
          handleTransaction={handleWithdraw}
          txPending={txPending}
          bg={sectionBg}
          balancesLoading={balancesLoading}
        />
      )}
      <ArrowDownIcon
        w="1.5rem"
        h="1.5rem"
        mx="auto"
        my="1rem"
        d="block"
        background="transparent !important"
        boxShadow="none !important"
        color={connectedLayer ? 'brand.primary' : 'inherit'}
      />
      <Heading size="sm" mt={0} mb={4} px={2}>
        {connectedLayer === 2 ? network.toUpperCase() : connectedLayer === 1 ? 'OPTIMISM' : ''}
      </Heading>
      <Box px={4} borderWidth="1px" borderRadius="20px" py="1rem">
        <AccentText />
        <Box whiteSpace="pre" textOverflow="ellipsis" overflow="hidden" d="flex" alignItems="center">
          <Image d="inline" w={5} h={5} mr={2} src="/logos/ETH.svg" alt="ETH Logo" />
          {balancesLoading ? <Spinner size="xs" /> : connectedLayer === 2 ? l1Balance : l2Balance} ETH
        </Box>
      </Box>
      <HStack spacing={8} pt="2rem">
        {connectedLayer === 1 ? (
          <OptimismButton size="huge" onClick={handleDeposit} textTransform="uppercase">
            Deposit
          </OptimismButton>
        ) : connectedLayer === 2 ? (
          <OptimismButton size="huge" onClick={handleWithdraw} textTransform="uppercase">
            Withdraw
          </OptimismButton>
        ) : (
          <OptimismButton size="huge" onClick={showConnectModal} textTransform="uppercase">
            Connect
          </OptimismButton>
        )}
      </HStack>
    </>
  );
}

export default Balances;
