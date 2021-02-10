import React from 'react';
import { ethers } from 'ethers';
import { MaxUint256 } from '@ethersproject/constants';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Button,
  Image,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Heading,
  Spinner,
} from '@chakra-ui/react';

const MaxButton = ({ onClick }) => (
  <Button
    opacity={0.8}
    bg="transparent"
    mr={4}
    p={0}
    _hover={{ background: 'transparent', opacity: 1 }}
    _active={{ background: 'transparent' }}
    _focus={{ boxShadow: 'none' }}
    onClick={onClick}
  >
    Max
  </Button>
);

function Balances({
  provider,
  contracts,
  userAddress,
  depositPending,
  l1Balances,
  l2Balances,
  inputValues,
  setInputValues,
  despositEnabled,
  handleDeposit,
  handleWithdraw,
  showErrorToast,
}) {
  const handleApprove = async token => {
    const depositContract = contracts.bridge[token];

    try {
      const tokenContract = contracts.l1[token];
      const signer = provider.getSigner();
      await tokenContract.connect(signer).approve(depositContract.address, MaxUint256);
    } catch (err) {
      console.error(err);
      showErrorToast();
    }
  };

  const handleMaxValue = token => {
    const balance = l1Balances[token];
    setInputValues(values => ({ ...values, [token]: balance }));
  };

  return (
    <>
      <Heading size="lg" mt={16} mb={10}>
        Balances
      </Heading>
      <Table variant="simple" mt={16}>
        <Thead>
          <Tr>
            <Th>Token</Th>
            <Th>L1 Balance</Th>
            <Th></Th>
            <Th px={0} w="30px"></Th>
            <Th>L2 Balance</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>
              <Image d="inline" w={5} h={5} mr={2} src="/logos/WETH.svg" alt="ETH Logo" />
              WETH
            </Td>
            <Td>{l1Balances.WETH}</Td>
            <Td>
              <Box d="flex" justifyContent="space-between">
                <MaxButton onClick={() => handleMaxValue('WETH')} />
                <NumberInput
                  placeholder="Amount"
                  defaultValue={0}
                  onChange={val => setInputValues(values => ({ ...values, WETH: val }))}
                  value={inputValues.WETH}
                  mr={4}
                  min={0}
                  max={l1Balances.WETH}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button onClick={() => handleApprove('WETH')} mr={4} disabled={despositEnabled.WETH}>
                  Approve
                </Button>
                <Button onClick={() => handleDeposit('WETH')} disabled={!despositEnabled.WETH}>
                  Deposit
                </Button>
              </Box>
            </Td>
            <Td px={0}>{depositPending.WETH && <Spinner ml={2} />}</Td>
            <Td>{l2Balances.WETH}</Td>
            <Td textAlign="right">
              <Button onClick={() => handleWithdraw('WETH')} disabled>
                Withdraw
              </Button>
            </Td>
          </Tr>
          <Tr>
            <Td>
              <Image d="inline" w={5} h={5} mr={2} src="/logos/DAI.svg" alt="DAI Logo" />
              DAI
            </Td>
            <Td>{l1Balances.DAI}</Td>
            <Td>
              <Box d="flex" justifyContent="space-between">
                <MaxButton onClick={() => handleMaxValue('DAI')} />
                <NumberInput
                  placeholder="Amount"
                  defaultValue={0}
                  onChange={val => setInputValues(values => ({ ...values, DAI: val }))}
                  value={inputValues.DAI}
                  mr={4}
                  min={0}
                  max={l1Balances.DAI}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button onClick={() => handleApprove('DAI')} mr={4} disabled={despositEnabled.DAI}>
                  Approve
                </Button>
                <Button onClick={() => handleDeposit('DAI')} disabled={!despositEnabled.DAI}>
                  Deposit
                </Button>
              </Box>
            </Td>
            <Td px={0}>{depositPending.DAI && <Spinner ml={2} />}</Td>
            <Td>{l2Balances.DAI}</Td>
            <Td textAlign="right">
              <Button onClick={() => handleWithdraw('DAI')} disabled>
                Withdraw
              </Button>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </>
  );
}

export default Balances;
