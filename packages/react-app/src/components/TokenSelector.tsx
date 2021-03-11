import React from 'react';
import { Select, Box, FormLabel } from '@chakra-ui/react';

type Props = {
  handleTokenSelection: (e: React.FormEvent<HTMLSelectElement>)=> void;
  tokenSymbol: string;
}

function TokenSelector({ handleTokenSelection, tokenSymbol } : Props) {
  return (
    <Box maxW="320px">
      <FormLabel opacity="0.7">Filter by token</FormLabel>
      <Select placeholder="Choose token" onChange={handleTokenSelection} value={tokenSymbol || ''}>
        <option value="SNX">Synthetix | SNX</option>
      </Select>
    </Box>
  );
}

export default TokenSelector;
