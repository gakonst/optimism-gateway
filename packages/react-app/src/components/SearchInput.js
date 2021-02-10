import React from 'react';
import { Input, Button, HStack } from '@chakra-ui/react';

function SearchInput({ handleAddressSearch }) {
  const [inputVal, setInputVal] = React.useState('');

  const handleSearch = () => {
    handleAddressSearch(inputVal);
    setInputVal('');
  };
  return (
    <HStack maxW="600px" mx="auto">
      <Input
        size="sm"
        placeholder="Enter address"
        bgColor="white"
        color="#333"
        _placeholder={{ color: '#aaa' }}
        onChange={e => setInputVal(e.target.value)}
        value={inputVal}
      />
      <Button size="sm" onClick={handleSearch}>
        Search
      </Button>
    </HStack>
  );
}

export default SearchInput;
