# OΞ Transaction Tracker

This app tracks transactions to & from Optimism

## Running locally

`yarn` to install
`yarn app:start` to run

## Contributing

Everyone is welcome to add more tokens to this app! 

The steps should go as follows:
1. Deploy token bridge contracts to layer 1 and 2 (assuming they don't exist yet). [Instructions here](https://community.optimism.io/docs/integration.html#introduction).
2. Add the l1 & l2 bridge contracts as `dataSources` in both the l1 and l2 `subgraph.yaml` files. Please follow the existing pattern for SNX. No changes should need to be made to the mapping files.
3. Build & deploy l1 and l2 subgraphs by running `yarn codegen`, `yarn build`, and `yarn deploy` in their respective directories (it will take a few minutes for each to resync)
4. Add the token to the `tokens` object in `packages/react-app/src/constants.ts`, conforming to the `TokenSelection` type.
5. Submit a PR