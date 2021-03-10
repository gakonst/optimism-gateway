import React from 'react';
import { Grid, Box, Center, Heading, Text, useColorModeValue } from '@chakra-ui/react';

const fakeButtonStyles = {
  borderWidth: '1px',
  borderColor: 'brand.primary',
  padding: '0.25rem 1rem',
  fontSize: '1.2rem',
  borderRadius: '5px',
  margin: '0 auto',
  color: 'brand.primary',
  className: 'rainbowText',
};

function Card({ type, onClick }) {
  const containerBg = useColorModeValue('transparent', '#1A202C');

  return (
    <Box
      bg={containerBg}
      onClick={onClick}
      as="button"
      d="flex"
      flexDir="column"
      justifyContent="space-between"
      outline="none"
      boxShadow="none"
      borderWidth="1px"
      borderColor="brand.primary"
      padding={4}
      borderRadius="20px"
      transition="box-shadow 500ms"
      _hover={{
        boxShadow: '0px 0px 8px 8px rgb(240, 26, 55, 0.2)',
      }}
    >
      <Text textAlign="center" mb={8} w="80%" mx="auto" fontSize="1.2rem" fontWeight="400 !important">
        {type === 'DEPOSIT' ? `Mainnet Ethereum` : 'Optimistic Ethereum'}
      </Text>
      <Box {...fakeButtonStyles}>{type === 'DEPOSIT' ? `Deposit →` : `← Withdraw`}</Box>
    </Box>
  );
}

function Connect({ connectToProvider }) {
  return (
    <>
      <Heading textAlign="center" size="lg" mb={0} mt={6}>
        Connect to Metamask
      </Heading>
      <Text size="xs" mx="auto" mt={6} mb={10} maxW="340px">
        More wallet support coming soon.
      </Text>
      <Center mx="auto">
        <Grid templateColumns="1fr 1fr" flexShrink={0} gap={8} width="100%">
          <Card onClick={() => connectToProvider(1)} type="DEPOSIT" />
          <Card onClick={() => connectToProvider(2)} type="WITHDRAW" />
        </Grid>
      </Center>
    </>
  );
}

export default Connect;
