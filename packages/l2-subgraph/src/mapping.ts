import { WithdrawalInitiated } from '../generated/SynthetixBridgeToBase/SynthetixBridgeToBase'
import { Withdrawal } from '../generated/schema'

export function handleWithdrawal(event: WithdrawalInitiated): void {
  let withdrawal = new Withdrawal(event.transaction.hash.toHex())
  withdrawal.timestamp = event.block.timestamp.toI32();
  withdrawal.hash = event.transaction.hash.toHex();
  withdrawal.account = event.params.account
  withdrawal.amount = event.params.amount
  withdrawal.save()
}