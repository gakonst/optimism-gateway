import { RelayedMessage } from '../generated/OVM_CrossDomainMessenger/OVM_CrossDomainMessenger';
import { ReceivedWithdrawal } from '../generated/schema';
// import

export function handleMessageReceived(event: RelayedMessage): void {
  let withdrawalReceived = new ReceivedWithdrawal(event.transaction.hash.toHex());
  withdrawalReceived.hash = event.transaction.hash.toHex();
  withdrawalReceived.timestamp = event.block.timestamp.toI32();
  withdrawalReceived.msgHash = event.params.msgHash.toHex();
  withdrawalReceived.save();
}
