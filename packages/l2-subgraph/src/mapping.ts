import { BigInt } from '@graphprotocol/graph-ts';
import { WithdrawalInitiated as WithdrawalInitiatedEvent } from '../generated/SynthetixBridgeToBase/SynthetixBridgeToBase';
import {
  SentMessage as SentMessageEvent,
  RelayedMessage as RelayedMessageEvent,
} from '../generated/OVM_CrossDomainMessenger/OVM_CrossDomainMessenger';
import { Withdrawal, SentMessage, RelayedMessage, MessageStats, WithdrawalStats } from '../generated/schema';

const STATS_ID = '1';

// OVM cross domain messenger
export function handleMessageRelayed(event: RelayedMessageEvent): void {
  // create a stats entity if this is the first event, else update the existing one
  let stats = MessageStats.load(STATS_ID);
  if (stats == null) {
    stats = new MessageStats(STATS_ID);
    stats.relayedMessageCount = 0;
  }
  stats.relayedMessageCount = stats.relayedMessageCount + 1;

  const msgReceived = new RelayedMessage(event.params.msgHash.toHex());
  msgReceived.hash = event.transaction.hash.toHex();
  msgReceived.timestamp = event.block.timestamp.toI32();
  msgReceived.msgHash = event.params.msgHash.toHex();
  msgReceived.save();
}

export function handleSentMessage(event: SentMessageEvent): void {
  // create a stats entity if this is the first event, else update the existing one
  let stats = MessageStats.load(STATS_ID);
  if (stats == null) {
    stats = new MessageStats(STATS_ID);
    stats.sentMessageCount = 0;
  }
  stats.sentMessageCount = stats.sentMessageCount + 1;

  const sentMessage = new SentMessage(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  sentMessage.timestamp = event.block.timestamp.toI32();
  sentMessage.hash = event.transaction.hash.toHex();
  sentMessage.message = event.params.message;
  sentMessage.save();
}

// SNX L2 contract
export function handleWithdrawal(event: WithdrawalInitiatedEvent): void {
  const withdrawal = new Withdrawal(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  // create a stats entity if this is the first event, else update the existing one
  let stats = WithdrawalStats.load(STATS_ID);
  if (stats == null) {
    stats = new WithdrawalStats(STATS_ID);
    stats.totalCount = 0;
    stats.totalAmount = BigInt.fromI32(0);
  }
  withdrawal.index = stats.totalCount;
  stats.totalCount = stats.totalCount + 1;
  stats.totalAmount = stats.totalAmount.plus(event.params.amount);
  stats.save();

  withdrawal.timestamp = event.block.timestamp.toI32();
  withdrawal.hash = event.transaction.hash.toHex();
  withdrawal.account = event.params.account;
  withdrawal.amount = event.params.amount;
  withdrawal.save();
}
