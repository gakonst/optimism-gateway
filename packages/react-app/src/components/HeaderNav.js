import React from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  Button,
  Heading,
  Link,
  Box,
  useColorMode,
  HStack,
  useMediaQuery,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import NavItems from './NavItems';
import { HamburgerSpin } from 'react-animated-burgers';

const Title = () => (
  <Link as={RouterLink} to="/" textDecoration="none !important" boxShadow="none !important">
    <Heading
      className="rainbowText"
      userSelect="none"
      as="h1"
      size="lg"
      mt={0}
      fontWeight={'500'}
      fontStyle="italic"
      color="brand.primary"
    >
      Optimism Gateway
    </Heading>
  </Link>
);

function HeaderNav({ isOpen, onOpen, onClose }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const [screenSm] = useMediaQuery(['(min-width: 600px)']);

  const handleHamburgerPress = () => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  };

  return (
    <>
      <Drawer placement={'right'} onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay>
          <DrawerContent pt={2}>
            <DrawerHeader>
              <Title />
            </DrawerHeader>
            <DrawerBody d="flex" flexDir="column" onClick={onClose}>
              <NavItems screenSm={screenSm} />
            </DrawerBody>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
      <Box d="flex" alignItems="center" justifyContent="space-between" mb={8}>
        <Title />
        <HStack spacing={6} as="nav">
          {screenSm && <NavItems screenSm={screenSm} />}
          <Box d="flex" alignItems="center">
            <Button borderRadius="100%" ml={4} p={0} onClick={toggleColorMode}>
              {colorMode === 'light' ? '🌜' : '🌞'}
            </Button>
          </Box>
          {!screenSm && (
            <Box ml={12}>
              <HamburgerSpin
                buttonWidth={30}
                className="burgerBtn"
                isActive={isOpen}
                toggleButton={handleHamburgerPress}
                barColor={colorMode === 'light' ? '#333' : '#ddd'}
              />
            </Box>
          )}
        </HStack>
      </Box>
    </>
  );
}

export default HeaderNav;
