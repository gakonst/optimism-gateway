const kovanAddresses = {
  l1: {
    messenger: '0xb89065D5eB05Cac554FDB11fC764C679b4202322',
    SNX: { token: '0x74A729c5EDc84b68c52A9198DDa9293Ca11B241B', bridge: '0xC2E4aB21D4d68B82bA71C2Fb449EC8aACc86133A' },
  },
  l2: {
    messenger: '0x4200000000000000000000000000000000000007',
    SNX: { token: '0xb671F2210B1F6621A2607EA63E6B2DC3e2464d1F', bridge: '' },
  },
};

const addresses = {
  l1: {
    messenger: '0xfBE93ba0a2Df92A8e8D40cE00acCF9248a6Fc812',
    SNX: { token: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', bridge: '0x045e507925d2e05D114534D0810a1abD94aca8d6' }, // SynthetixBridgeToOptimism
  },
  l2: {
    messenger: '0x4200000000000000000000000000000000000007',
    SNX: { token: '0xD85eAFa37734E4ad237C3A3443D64DC94ae998E7', bridge: '0x4D7186818daBFe88bD80421656BbD07Dffc979Cc' }, // SynthetixBridgeToBase
  },
};

export default process.env.REACT_APP_ETH_NETWORK === 'kovan' ? kovanAddresses : addresses;
