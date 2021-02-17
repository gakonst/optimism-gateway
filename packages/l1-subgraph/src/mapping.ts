import {
  RelayedMessage,
  SentMessage as SentMessageEvent,
} from '../generated/OVM_CrossDomainMessenger/OVM_CrossDomainMessenger';
import { Deposit as DepositEvent } from '../generated/SynthetixBridgeToOptimism/SynthetixBridgeToOptimism';
import { ReceivedMessage, Deposit, SentMessage } from '../generated/schema';
// import

// OVM cross domain messenger
export function handleMessageReceived(event: RelayedMessage): void {
  const msgReceived = new ReceivedMessage(event.params.msgHash.toHex());
  msgReceived.hash = event.transaction.hash.toHex();
  msgReceived.timestamp = event.block.timestamp.toI32();
  msgReceived.msgHash = event.params.msgHash.toHex();
  msgReceived.save();
}

export function handleSentMessage(event: SentMessageEvent): void {
  const sentMessage = new SentMessage(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  sentMessage.timestamp = event.block.timestamp.toI32();
  sentMessage.txHash = event.transaction.hash.toHex();
  sentMessage.message = event.params.message;
  sentMessage.save();
}

// SNX deposit contract
export function handleDeposit(event: DepositEvent): void {
  const deposit = new Deposit(event.transaction.hash.toHex());
  deposit.timestamp = event.block.timestamp.toI32();
  deposit.hash = event.transaction.hash.toHex();
  deposit.account = event.params.account;
  deposit.amount = event.params.amount;
  deposit.save();
}
