import SynthetixL1Token from './abis/SynthetixL1Token.json';
import SynthetixL2Token from './abis/SynthetixL2Token.json';
import ownable from './abis/ownable.json';
import SynthetixBridgeToBase from './abis/SynthetixBridgeToBase.json';
import SynthetixBridgeToOptimism from './abis/SynthetixBridgeToOptimism.json';
import XDomainMessenger from './abis/XDomainMessenger.json';
import iOVM_L1ETHGateway from './abis/iOVM_L1ETHGateway.json';
import OVM_ETH from './abis/OVM_ETH.json';

const abis = {
  SynthetixL1Token,
  SynthetixL2Token,
  ownable,
  SynthetixBridgeToBase,
  SynthetixBridgeToOptimism,
  XDomainMessenger,
  l1ETHGateway: iOVM_L1ETHGateway,
  l2ETHGateway: OVM_ETH,
};

export default abis;
