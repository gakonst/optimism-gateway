import React from 'react';
import { Box, useColorModeValue, Button } from '@chakra-ui/react';

const OptimismButton = ({ onClick, children, size, variant, ...rest }) => {
  const bg = useColorModeValue('white', 'gray.800');

  const hugeStyles =
    size === 'huge'
      ? {
          fontSize: '1.2rem',
          h: '60px',
          w: '100%',
          borderRadius: '20px',
          _hover: {
            background: bg,
            boxShadow: `0px 0px 16px 4px rgb(240, 26, 55, 0.2)`,
          },
          _active: {
            background: bg,
            boxShadow: `0px 0px 16px 6px rgb(240, 26, 55, 0.3)`,
          },
        }
      : {};

  const hoverAndActiveStyles =
    variant === 'link'
      ? {}
      : {
          _hover: {
            boxShadow: `0px 0px 2px 2px rgb(240, 26, 55, 0.2)`,
          },
          _active: {
            boxShadow: `0px 0px 2px 4px rgb(240, 26, 55, 0.3)`,
          },
        };

  return (
    <Button
      className="rainbowText"
      size={size}
      bg={variant === 'link' ? 'transparent !important' : bg}
      borderWidth={variant !== 'link' ? '1px' : 0}
      borderColor="brand.primary"
      borderRadius="5px"
      onClick={onClick}
      {...hoverAndActiveStyles}
      {...hugeStyles}
      {...rest}
    >
      <Box as="span" className="rainbowText">
        {children}
      </Box>
    </Button>
  );
};

export default OptimismButton;
