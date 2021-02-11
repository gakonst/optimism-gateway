import { WithdrawalInitiated as WithdrawalInitiatedEvent } from '../generated/SynthetixBridgeToBase/SynthetixBridgeToBase';
import { SentMessage as SentMessageEvent } from '../generated/OVM_CrossDomainMessenger/OVM_CrossDomainMessenger';
import { Withdrawal, SentMessage } from '../generated/schema';

export function handleWithdrawal(event: WithdrawalInitiatedEvent): void {
  let withdrawal = new Withdrawal(event.transaction.hash.toHex());
  withdrawal.timestamp = event.block.timestamp.toI32();
  withdrawal.hash = event.transaction.hash.toHex();
  withdrawal.account = event.params.account;
  withdrawal.amount = event.params.amount;

  withdrawal.save();
}

export function handleSentMessage(event: SentMessageEvent): void {
  let sentMessage = new SentMessage(event.transaction.hash.toHex());
  sentMessage.txHash = event.transaction.hash.toHex();
  sentMessage.message = event.params.message;
  sentMessage.save();
}
