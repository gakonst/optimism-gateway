# OΞ Optimism Gateway

This app enables L1<>L2 ETH transfers and tracks transactions to & from Optimism
## Running locally

`yarn` to install
`yarn app:start` to run the website
## Adding tokens

For now, this app will only enable ETH deposits & withdrawals. However, if you'd like to add a token to the filter selector on the `/txs` page, follow these steps:

1. Deploy token bridge contracts to layer 1 and 2 (if they don't exist yet). [Instructions here](https://community.optimism.io/docs/integration.html#introduction).
2. Add the l1 & l2 bridge contracts as `dataSources` in both the l1 and l2 `subgraph.yaml` files. Please follow the existing pattern for SNX. No changes should need to be made to the mapping files. Each of these directories are git submodules, so their repos will need to be updated.
3. Build & deploy l1 and l2 subgraphs by running `yarn codegen`, `yarn build`, and `yarn deploy` in their respective directories (it will take a few minutes for each to resync)
4. Add the token to the `tokens` object in `packages/react-app/src/constants.ts`, conforming to the `TokenSelection` type.
5. Submit a PR