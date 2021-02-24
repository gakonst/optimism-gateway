import { ethers } from 'ethers';
import { abis } from '@project/contracts';

const xDomainInterface = new ethers.utils.Interface(abis.XDomainMessenger);

export const formatNumber = num => {
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

export const formatUSD = num => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

export const decodeSentMessage = message => xDomainInterface.decodeFunctionData('relayMessage', message);

export const processSentMessage = (rawTx, layer) => {
  const tx = { ...rawTx };
  const data = decodeSentMessage(tx.message);
  tx.from = rawTx.from;
  tx.to = data[1];
  tx.timestamp = tx.timestamp * 1000;
  if (layer === 1) {
    tx.layer1Hash = tx.hash;
  } else {
    tx.layer2Hash = tx.hash;
  }
  return tx;
};
