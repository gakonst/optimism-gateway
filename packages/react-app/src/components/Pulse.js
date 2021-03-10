import React from 'react';
import { Box } from '@chakra-ui/react';
import { colors } from '../constants';

function Pulse(props) {
  return (
    <Box {...props} position="relative" height="20px" width="20px">
      <Box
        border={`3px solid ${colors.brandSecondary}`}
        borderRadius="30px"
        width="100%"
        height="100%"
        position="absolute"
        left="0"
        top="0"
        animation="pulsate 1s ease-out infinite"
        opacity="0"
      />
      <Box
        width="12px"
        height="12px"
        backgroundColor={colors.brandSecondary}
        borderRadius="50%"
        position="absolute"
        top="4px"
        left="4px"
      />
    </Box>
  );
}

export default Pulse;
