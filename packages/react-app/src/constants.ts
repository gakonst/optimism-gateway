export const panels = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
};

export const tokens: { [key: string]: TokenSelection } = {
  SNX: {
    name: 'Synthetix',
    symbol: 'SNX',
    iconURL: 'https://assets.coingecko.com/coins/images/3406/small/SNX.png?1598631139',
    coingeckoId: 'havven',
  },
};
// The Graph's max is 100 for queries using arrays to search over (1000 for regular queries)
export const FETCH_LIMIT = 100;

export const txTypes = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
};

export const txStatuses = {
  COMPLETE: 'COMPLETE',
  AWAITING: 'AWAITING',
  PENDING: 'PENDING',
};

export const colors = {
  brandPrimary: '#f01a37',
  brandSecondary: '#169fc9',
  brandSecondaryLight: '#55bad6',
  complete: '#75cc74',
  awaitingRelay: '#efefa2',
  pending: '#f46969',
};

export const chainIds = {
  MAINNET_L1: 1,
  MAINNET_L2: 10,
  KOVAN_L1: 42,
  KOVAN_L2: 69,
};

// Maps each chain id to its respective layer
export const chainIdLayerMap = {
  [chainIds.MAINNET_L1]: 1,
  [chainIds.KOVAN_L1]: 1,
  [chainIds.MAINNET_L2]: 2,
  [chainIds.KOVAN_L2]: 2,
};
