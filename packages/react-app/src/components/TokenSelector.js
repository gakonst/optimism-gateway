import React from 'react';
import { Select, Box, FormLabel } from '@chakra-ui/react';

function TokenSelector({ handleTokenSelection, tokenSymbol }) {
  return (
    <Box maxW="320px">
      <FormLabel opacity="0.7">Filter by token</FormLabel>
      <Select placeholder="Token" onChange={handleTokenSelection} value={tokenSymbol || ''}>
        <option value="SNX">Synthetix | SNX</option>
      </Select>
    </Box>
  );
}

export default TokenSelector;
