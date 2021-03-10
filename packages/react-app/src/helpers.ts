import { ethers } from 'ethers';
import { abis } from '@project/contracts';
import DateTime from 'luxon/src/datetime.js';
import { getRelayedMessages } from './graphql/subgraph';
import { QueryResult } from '@apollo/client';

const xDomainInterface = new ethers.utils.Interface(abis.XDomainMessenger);

export const formatNumber = (num: number | string) => {
  return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 20 }).format(+num);
};

export const getBrowserLocales = (options = {}) => {
  const defaultOptions = {
    languageCodeOnly: false,
  };

  const opt = {
    ...defaultOptions,
    ...options,
  };

  const browserLocales = navigator.languages === undefined ? [navigator.language] : navigator.languages;

  if (!browserLocales) {
    return undefined;
  }

  return browserLocales.map(locale => {
    const trimmedLocale = locale.trim();

    return opt.languageCodeOnly ? trimmedLocale.split(/-|_/)[0] : trimmedLocale;
  });
};

export const formatUSD = (num: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

export const decodeSentMessage = (message: string) => xDomainInterface.decodeFunctionData('relayMessage', message);

export const processSentMessage = (
  rawTx: Transaction,
  layer: number,
  relayedTxs: { msgHash: string; hash: string; timestamp: number }[]
) => {
  const tx = { ...rawTx };
  const [_, to] = decodeSentMessage(tx.message as string);
  const sentMsgHash = ethers.utils.solidityKeccak256(['bytes'], [tx.message]);
  const relayedTx = relayedTxs.find(msg => msg.msgHash === sentMsgHash);
  tx.from = rawTx.from;
  tx.to = to;
  tx.timestamp = tx.timestamp * 1000;
  if (layer === 1) {
    tx.layer1Hash = tx.hash;
    tx.layer2Hash = relayedTx?.hash;
  } else {
    tx.layer1Hash = relayedTx?.hash;
    tx.layer2Hash = tx.hash;
    tx.awaitingRelay =
      !tx.layer1Hash &&
      DateTime.fromMillis(tx.timestamp)
        .plus({ days: 7 })
        .toMillis() < Date.now();
  }
  tx.relayedTxTimestamp = relayedTx && relayedTx.timestamp * 1000;
  return tx;
};

export const getFilteredRelayedTxs = async (
  sentMsgTxs: Transaction[],
  relayedMsgTxs: QueryResult<any, Record<string, any>>
) => {
  const sentMsgHashes = sentMsgTxs.map((msgTx: Transaction) => {
    return ethers.utils.solidityKeccak256(['bytes'], [msgTx.message]);
  });
  const relayedTxs = (
    await relayedMsgTxs.fetchMore({
      variables: { searchHashes: sentMsgHashes },
      query: getRelayedMessages(sentMsgHashes),
    })
  ).data.relayedMessages;
  return relayedTxs;
};

export const capitalize = (s: string) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};
