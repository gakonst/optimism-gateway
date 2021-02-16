import { BigInt } from '@graphprotocol/graph-ts';
import { WithdrawalInitiated as WithdrawalInitiatedEvent } from '../generated/SynthetixBridgeToBase/SynthetixBridgeToBase';
import { SentMessage as SentMessageEvent } from '../generated/OVM_CrossDomainMessenger/OVM_CrossDomainMessenger';
import { Withdrawal, SentMessage, Stats } from '../generated/schema';

export function handleWithdrawal(event: WithdrawalInitiatedEvent): void {
  const STATS_ID = 'STATS_ID';
  // create a stats entity if this is the first event, else update the existing one
  let stats = Stats.load(STATS_ID);
  if (!stats) {
    stats = new Stats(STATS_ID);
    stats.count = 0;
    stats.total = BigInt.fromI32(0);
  }
  stats.count = event.transaction.index.toI32();
  stats.total.plus(event.params.amount as BigInt);
  stats.save();

  const withdrawal = new Withdrawal(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  withdrawal.timestamp = event.block.timestamp.toI32();
  withdrawal.hash = event.transaction.hash.toHex();
  withdrawal.account = event.params.account;
  withdrawal.amount = event.params.amount;
  withdrawal.save();
}

export function handleSentMessage(event: SentMessageEvent): void {
  const sentMessage = new SentMessage(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  sentMessage.timestamp = event.block.timestamp.toI32();
  sentMessage.txHash = event.transaction.hash.toHex();
  sentMessage.message = event.params.message;
  sentMessage.save();
}
