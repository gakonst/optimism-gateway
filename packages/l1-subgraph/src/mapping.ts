import { RelayedMessage } from '../generated/OVM_CrossDomainMessenger/OVM_CrossDomainMessenger';
import { Deposit as DepositEvent } from '../generated/SynthetixBridgeToOptimism/SynthetixBridgeToOptimism';
import { ReceivedWithdrawal, Deposit } from '../generated/schema';
// import

// OVM cross domain messenger
export function handleMessageReceived(event: RelayedMessage): void {
  const withdrawalReceived = new ReceivedWithdrawal(event.params.msgHash.toHex());
  withdrawalReceived.hash = event.transaction.hash.toHex();
  withdrawalReceived.timestamp = event.block.timestamp.toI32();
  withdrawalReceived.msgHash = event.params.msgHash.toHex();
  withdrawalReceived.save();
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
