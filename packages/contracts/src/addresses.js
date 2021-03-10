// const addresses = {
//   l1: {
//     messenger: '0xfBE93ba0a2Df92A8e8D40cE00acCF9248a6Fc812',
//     SNX: { token: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', bridge: '0x045e507925d2e05D114534D0810a1abD94aca8d6' }, // SynthetixBridgeToOptimism
//   },
//   l2: {
//     messenger: '0x4200000000000000000000000000000000000007',
//     SNX: { token: '0xD85eAFa37734E4ad237C3A3443D64DC94ae998E7', bridge: '0x4D7186818daBFe88bD80421656BbD07Dffc979Cc' }, // SynthetixBridgeToBase
//   },
// };

export const getAddresses = chainId => {
  if (chainId === 1 || chainId === 10) {
    // MAINNET
    return {
      l1: {
        messenger: '0xfBE93ba0a2Df92A8e8D40cE00acCF9248a6Fc812',
        ethBridge: 'TODO',
        snxBridge: '0x045e507925d2e05D114534D0810a1abD94aca8d6',
        snxToken: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', // TODO: remove this depency if possible (serve data from subgraph instead)
      },
      l2: {
        messenger: '0x4200000000000000000000000000000000000007',
        ethBridge: '0x4200000000000000000000000000000000000006',
        snxBridge: '0x4D7186818daBFe88bD80421656BbD07Dffc979Cc',
        snxToken: '0xD85eAFa37734E4ad237C3A3443D64DC94ae998E7', // TODO: remove this depency if possible (serve data from subgraph instead)
      },
    };
  } else {
    // KOVAN
    return {
      l1: {
        messenger: '0xb89065D5eB05Cac554FDB11fC764C679b4202322',
        ethBridge: '0x6647D5BD9EB9425838Bb89f76a166228b95671a3',
        snxBridge: '0x0000000000000000000000000000000000000000', // TODO: replace
      },
      l2: {
        messenger: '0x4200000000000000000000000000000000000007',
        ethBridge: '0x4200000000000000000000000000000000000006',
        snxBridge: '0x0000000000000000000000000000000000000000', // TODO: replace
      },
    };
  }
};
