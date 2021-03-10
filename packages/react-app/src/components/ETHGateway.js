import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ethers } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import {
  Box,
  Container,
  useDisclosure,
  Text,
  useToast,
  Link,
  useColorModeValue,
  useMediaQuery,
} from '@chakra-ui/react';
import Modal, { modalTypes } from './Modal';
import Balances from './Balances';
import Pulse from './Pulse';
import { JsonRpcProvider } from '@ethersproject/providers';
import { abis, getAddresses } from '@project/contracts';
// import TxHistoryTable from './TxHistoryTable';
import { Watcher } from '@eth-optimism/watcher';
import { formatNumber, capitalize } from '../helpers';
import { txStatuses, txTypes, chainIdLayerMap, chainIds } from '../constants';

const NUM_BLOCKS_TO_FETCH = 1000000;

function Gateway() {
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [currentModal, setCurrentModal] = React.useState(modalTypes.CONNECT);
  const [userAddress, setUserAddress] = React.useState(null);
  const [walletProvider, setWalletProvider] = React.useState(null);
  const [txPending, setTxPending] = React.useState(false);
  const [transactions, setTransactions] = React.useState([]);
  const [txsLoading, setTxsLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(0);
  const [l1Balance, setL1Balance] = React.useState(0);
  const [l2Balance, setL2Balance] = React.useState(0);
  const [balancesLoading, setBalancesLoading] = React.useState(false);
  const containerBg = useColorModeValue('#f0f9ff', '#1c2a3e');
  const warningLinkColor = useColorModeValue('inherit', '#171923');
  const [connectedChainId, setConnectedChainId] = React.useState(null);
  const [isMobile] = useMediaQuery('(max-width: 600px)');
  const toastIdRef = React.useRef();
  const [rpcL1Provider, setRpcL1Provider] = React.useState(null);
  const [rpcL2Provider, setRpcL2Provider] = React.useState(null);
  const [contracts, setContracts] = React.useState(null);
  const [watcher, setWatcher] = React.useState(null);
  const toast = useToast();

  // const initTxHistory = React.useCallback(async () => {
  //   console.log('initTxHistory');

  //   const addresses = getAddresses(connectedChainId);

  //   try {
  //     const deposits = await getTxHistory({
  //       type: txTypes.DEPOSIT,
  //       provider: rpcL1Provider,
  //       bridgeAddress: addresses.l1.ethBridge,
  //       eventFilter: contracts.l1.ethBridge.filters.DepositInitiated,
  //       eventSignature: 'Deposit(address,address,uint256)',
  //     });

  //     const withdrawals = await getTxHistory({
  //       type: txTypes.WITHDRAWAL,
  //       provider: rpcL2Provider,
  //       bridgeAddress: addresses.l2.ethBridge,
  //       eventFilter: contracts.l2.ethBridge.filters.WithdrawalInitiated,
  //       eventSignature: 'WithdrawalInitiated(address,address,uint256)',
  //     });

  //     setTransactions([...deposits, ...withdrawals].sort((a, b) => b.timestamp - a.timestamp));
  //     setTxsLoading(false);
  //   } catch (err) {
  //     console.error(err);
  //   }

  //   async function getTxHistory({ type, bridgeAddress, provider, eventFilter, eventSignature, setTxHistory }) {
  //     try {
  //       const blockNumber = await provider.getBlockNumber();
  //       const startBlock = Math.max(blockNumber - NUM_BLOCKS_TO_FETCH, 0);
  //       const filters = eventFilter(userAddress);
  //       const logs = await provider.getLogs({ ...filters, fromBlock: startBlock });
  //       const events = await processLogs({ token: 'ETH', logs, provider, type });
  //       // watch for future events
  //       provider.on({ address: bridgeAddress, topics: [ethers.utils.id(eventSignature)] }, async logs => {
  //         const newTx = await processLogs({ token: 'ETH', logs: [logs], provider, type });
  //         setTransactions(history => [...newTx, ...history].sort((a, b) => b.timestamp - a.timestamp));
  //         setTxPending(false);
  //       });

  //       return events;
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   }

  //   async function processLogs({ token, logs, provider, type }) {
  //     const contractInterface =
  //       type === txTypes.DEPOSIT ? contracts.l1.ethBridge.interface : contracts.l2.ethBridge.interface;
  //     try {
  //       const events = await Promise.all(
  //         logs.map(async l => {
  //           const block = await provider.getBlock(l.blockNumber);
  //           const { args } = contractInterface.parseLog(l);
  //           const timestamp = Number(block.timestamp * 1000);
  //           return {
  //             timestamp,
  //             amount: args._amount / 1e18,
  //             token: 'ETH',
  //             transactionHash: l.transactionHash,
  //           };
  //         })
  //       );
  //       return await Promise.all(
  //         events.map(async event => {
  //           try {
  //             const msgHashes =
  //               type === txTypes.DEPOSIT
  //                 ? await watcher.getMessageHashesFromL1Tx(event.transactionHash)
  //                 : await watcher.getMessageHashesFromL2Tx(event.transactionHash);
  //             const receipt =
  //               type === txTypes.DEPOSIT
  //                 ? await watcher.getL2TransactionReceipt(msgHashes[0], false)
  //                 : await watcher.getL1TransactionReceipt(msgHashes[0], false);
  //             const eventObj = {
  //               ...event,
  //               type,
  //               status: receipt?.transactionHash ? txStatuses.COMPLETE : txStatuses.PENDING,
  //             };
  //             if (type === txTypes.DEPOSIT) {
  //               eventObj.l1TransactionHash = event.transactionHash;
  //               eventObj.l2TransactionHash = receipt?.transactionHash;
  //             } else {
  //               eventObj.l2TransactionHash = event.transactionHash;
  //               eventObj.l1TransactionHash = receipt?.transactionHash;
  //             }
  //             return eventObj;
  //           } catch (err) {
  //             console.error(err);
  //           }
  //         })
  //       );
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   }
  // }, [connectedChainId, contracts, rpcL1Provider, rpcL2Provider, userAddress, watcher]);

  function switchLayers() {
    if (chainIdLayerMap[connectedChainId] === 1) {
      connectToProvider(2);
    } else {
      connectToProvider(1);
    }
  }

  const showErrorToast = React.useCallback(
    message => {
      toastIdRef.current = toast({
        title: 'Error',
        description: (
          <Text>
            {message || (
              <>
                Please try again. If you continue to experience problems, please reach out to us on{' '}
                <Link
                  href="https://www.twitch.tv/optimismpbc"
                  isExternal
                  textDecoration="underline"
                  color={`${warningLinkColor} !important`}
                >
                  Discord
                </Link>
                .
              </>
            )}
          </Text>
        ),
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    },
    [toast, warningLinkColor]
  );

  const handleDeposit = async token => {
    try {
      const signer = walletProvider.getSigner();
      console.log(signer);
      console.log(contracts);
      await contracts.l1.ethBridge.connect(signer).deposit({ value: ethers.utils.parseUnits(inputValue, 18) });
      setInputValue(0);
      setTxPending(true);
    } catch (err) {
      console.error(err);
      showErrorToast(err.message);
    }
  };

  const handleWithdraw = async token => {
    try {
      const signer = walletProvider.getSigner();
      await contracts.l2.ethBridge.connect(signer).withdraw(ethers.utils.parseUnits(inputValue, 18));
      setInputValue(0);
      setTxPending(true);
    } catch (err) {
      console.error(err);
      showErrorToast(err.message);
    }
  };

  const showConnectModal = () => {
    setCurrentModal(modalTypes.CHOOSE_NETWORK);
    openModal();
  };

  /** Connect to wallet provider */
  const connectToProvider = React.useCallback(
    async layer => {
      if (layer === chainIdLayerMap[connectedChainId]) return;
      let provider = walletProvider;

      // connect to wallet if not connected yet
      if (!provider) {
        await window.ethereum.enable();
        provider = new ethers.providers.Web3Provider(window.ethereum);
      }

      const chainId = (await provider.getNetwork()).chainId;

      if (layer === 1) {
        // If user is trying to connect to L1, prompt them to change their network in MM (currently can't be changed programatically)
        const network = chainId === chainIds.MAINNET_L2 ? 'mainnet' : chainId === chainIds.KOVAN_L2 ? 'kovan' : null;
        if (network) {
          showErrorToast(`Please change your network to ${capitalize(network)} in MetaMask.`);
          return;
        } else {
          showErrorToast(`Network not supported. Please change to Kovan or Mainnet`);
        }
      } else if (connectedChainId) {
        try {
          const network =
            connectedChainId === chainIds.MAINNET_L1 || connectedChainId === chainIds.MAINNET_L2 ? 'mainnet' : 'kovan';
          await provider.send('wallet_addEthereumChain', [
            {
              chainId:
                network === 'mainnet' ? '0x' + chainIds.MAINNET_L2.toString(16) : '0x' + chainIds.KOVAN_L2.toString(16),
              chainName: network === 'mainnet' ? 'Optimism' : 'Kovan Optimism',
              rpcUrls: [
                network === 'mainnet'
                  ? `https://${network}.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`
                  : `https://${network}.optimism.io`,
              ],
              nativeCurrency: {
                name: 'Optimism ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              blockExplorerUrls: [`https://${network}-l2-explorer.surge.sh/`],
            },
          ]);
        } catch (err) {
          showErrorToast('Something went wrong. Please check Metamask and try again.');
          return;
        }
      } else {
        showErrorToast('Something went wrong. Please check Metamask and try again.');
      }
      setConnectedChainId(chainId);
      setWalletProvider(provider);
      closeModal();
    },
    [closeModal, connectedChainId, showErrorToast, walletProvider]
  );

  const reset = React.useCallback(() => {
    setTransactions([]);
    closeModal();
    setL1Balance(0);
    setL2Balance(0);
    setUserAddress(null);
    setConnectedChainId(null);
    setWalletProvider(null);
    setBalancesLoading(false);
    setRpcL1Provider(null);
    setRpcL2Provider(null);
    toast.close(toastIdRef.current);
  }, [closeModal, toast]);

  const handleChainInitializedOrChanged = React.useCallback(async () => {
    console.log('handleChainInitializedOrChanged');
    closeModal();
    toast.close(toastIdRef.current);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let chainId = (await provider.getNetwork()).chainId;
    if (connectedChainId && chainId !== connectedChainId) {
      setConnectedChainId(chainId);
    }
    const [rpcL1, rpcL2] = getRpcProviders(connectedChainId);

    const addresses = getAddresses(chainId);
    const contracts = {
      l1: {
        ethBridge: new Contract(addresses.l1.ethBridge, abis.l1ETHGateway, rpcL1),
      },
      l2: {
        ethBridge: new Contract(addresses.l2.ethBridge, abis.l2ETHGateway, rpcL2),
      },
    };

    const watcher = new Watcher({
      l1: {
        provider: rpcL1,
        messengerAddress: addresses.l1.messenger,
      },
      l2: {
        provider: rpcL2,
        messengerAddress: addresses.l2.messenger,
      },
    });

    setContracts(contracts);
    setWatcher(watcher);
    setConnectedChainId(chainId);
    setWalletProvider(provider);
    setRpcL1Provider(rpcL1);
    setRpcL2Provider(rpcL2);
  }, [closeModal, connectedChainId, toast]);

  const handleAccountChanged = React.useCallback(
    async ([newAddress]) => {
      const accounts = await walletProvider?.listAccounts();
      if (accounts?.length) {
        closeModal();
        setUserAddress(newAddress);
        toast.close(toastIdRef.current);
      } else {
        // reset if no user account present (ie: if user has disconnected)
        reset();
      }
    },
    [closeModal, reset, toast, walletProvider]
  );

  const getRpcProviders = chainId => {
    // TODO: show error if node endpoints are not repsonsive
    const network = chainId === chainIds.MAINNET_L1 || chainId === chainIds.MAINNET_L2 ? 'mainnet' : 'kovan';
    const rpcL1 = new JsonRpcProvider(`https://${network}.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`);
    const rpcL2 = new JsonRpcProvider(`https://${network}.optimism.io`);
    return [rpcL1, rpcL2];
  };

  React.useEffect(() => {
    const hasUserSeenWelcomeMsg = localStorage.getItem('hasUserSeenWelcomeMsg');
    if (!hasUserSeenWelcomeMsg) {
      setCurrentModal(modalTypes.WELCOME);
      openModal();
      localStorage.setItem('hasUserSeenWelcomeMsg', true);
    }
  }, [openModal]);

  /**
   * Initializer (runs only once)
   */
  React.useEffect(() => {
    (async () => {
      if (!isInitialized) {
        if (window.ethereum) {
          window.ethereum.on('chainChanged', handleChainInitializedOrChanged);
          window.ethereum.on('accountsChanged', handleAccountChanged);

          try {
            // check if user is logged in to metamask
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await provider.listAccounts();

            // if user is logged in, connect to metamask
            if (accounts[0]) {
              window.ethereum.enable();
              setUserAddress(accounts[0]);
              const chainId = (await provider.getNetwork()).chainId;

              if (!chainIdLayerMap[chainId]) {
                showErrorToast('Unsupported network. Please switch to Kovan or Mainnet.');
                return;
              }

              handleChainInitializedOrChanged();
            }
          } catch (err) {
            console.error(err);
          }
        } else {
          showErrorToast('Metamask not found.');
          throw new Error('No injected web3 found');
        }
      }
    })();
    setIsInitialized(true);
  }, [
    closeModal,
    handleAccountChanged,
    handleChainInitializedOrChanged,
    isInitialized,
    reset,
    showErrorToast,
    toast,
    walletProvider,
  ]);

  // React.useEffect(() => {
  //   if (userAddress && connectedChainId && rpcL1Provider && rpcL2Provider) {
  //     setTxsLoading(true);
  //     initTxHistory();
  //   }
  // }, [initTxHistory, userAddress, connectedChainId, rpcL1Provider, rpcL2Provider]);

  React.useEffect(() => {
    (async () => {
      if (walletProvider && !userAddress) {
        const userAddress = (await walletProvider.listAccounts())[0];
        setUserAddress(userAddress);
      }
    })();
  }, [userAddress, walletProvider]);

  /**
   * Set balanacesLoading == true whenever user address or chain id changes
   */
  React.useEffect(() => {
    if (userAddress && connectedChainId) {
      setBalancesLoading(true);
    }
  }, [userAddress, connectedChainId]);

  /**
   * Set balances when dependencies change
   */
  React.useEffect(() => {
    (async () => {
      if (contracts && rpcL1Provider && userAddress) {
        try {
          // set balances
          const ethBalance = await rpcL1Provider.getBalance(userAddress);
          setL1Balance(formatNumber(ethers.utils.formatEther(ethBalance)));
          const ethL2Balance = await contracts.l2.ethBridge.balanceOf(userAddress);
          setL2Balance(formatNumber(ethers.utils.formatEther(ethL2Balance)));
          setBalancesLoading(false);
        } catch (err) {
          console.error(err);
          showErrorToast();
        }
      }
    })();
  }, [contracts, rpcL1Provider, showErrorToast, userAddress]);

  return (
    <>
      <Container maxW={'1400px'} pt={4} pb={8} px={isMobile ? 2 : 4}>
        <Modal
          isOpen={isModalOpen}
          openModal={openModal}
          onClose={closeModal}
          currentModal={currentModal}
          connectToProvider={connectToProvider}
        />
        <Box maxW="500px" mx="auto" mt="5vh">
          {txPending && (
            <Link
              as={RouterLink}
              to="/txs"
              d="flex"
              alignItems="center"
              justifyContent="flex-end"
              mb={2}
              color="default !important"
              textDecoration="none !important"
            >
              Transaction pending
              <Pulse ml={2} />
            </Link>
          )}
          <Box
            borderWidth="1px"
            borderRadius="20px"
            bg={containerBg}
            padding={`1rem ${isMobile ? '1rem' : '1.5rem'} 3rem`}
          >
            <Balances
              contracts={contracts}
              userAddress={userAddress}
              txPending={txPending}
              handleDeposit={handleDeposit}
              handleWithdraw={handleWithdraw}
              l1Balance={l1Balance}
              l2Balance={l2Balance}
              inputValue={inputValue}
              setInputValue={setInputValue}
              showConnectModal={showConnectModal}
              balancesLoading={balancesLoading}
              connectedChainId={connectedChainId}
              switchLayers={switchLayers}
            />
          </Box>
          {/* <TxHistoryTable
                connectedChainId={connectedChainId}
                contracts={contracts}
                userAddress={userAddress}
                setTxPending={setTxPending}
                txsLoading={txsLoading}
                transactions={transactions}
              /> */}
        </Box>
      </Container>
    </>
  );
}

export default Gateway;
