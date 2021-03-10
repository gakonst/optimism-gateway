import React from 'react';
import { Link } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

function NavItems({ screenSm }) {
  const location = useLocation();
  return (
    <>
      {[
        { path: '/', text: 'Gateway' },
        { path: '/txs', text: 'History' },
      ].map(navItem => (
        <Link
          as={RouterLink}
          fontSize={'1.4rem'}
          color="default !important"
          to={navItem.path}
          opacity={location.pathname === navItem.path ? 1 : 0.7}
          _hover={{ opacity: 1 }}
          boxShadow="none !important"
          textDecoration="none !important"
          mb={screenSm ? 0 : 4}
        >
          {navItem.text}
        </Link>
      ))}
    </>
  );
}

export default NavItems;
