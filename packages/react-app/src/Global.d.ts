declare type Transaction = {
  account?: string;
  to?: string;
  from?: string;
  message?: string;
  timestamp: number;
  hash?: string;
  layer1Hash?: string;
  layer2Hash?: string;
  awaitingRelay?: boolean;
  relayedTxTimestamp?: number;
  amount?: bigint;
  index: number;
  msgHash?: string;
};

declare type TokenSelection = {
  name: string;
  symbol: string;
  iconURL: string;
  coingeckoId: string;
};

declare type TransactionViewType = 'deposits' | 'withdrawals';

declare type TableViewType = 'incoming' | 'outgoing';

declare type Layer = 1 | 2;

declare type BigIntIsh = JSBI | bigint | string;
