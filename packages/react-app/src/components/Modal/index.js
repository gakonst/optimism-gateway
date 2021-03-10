import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useColorModeValue,
} from '@chakra-ui/react';
import ChooseNetworkModal from './ChooseNetworkModal';

export const modalTypes = {
  WELCOME: 'WELCOME',
  CHOOSE_NETWORK: 'CHOOSE_NETWORK',
};

function BaseModal({ isOpen, onClose, currentModal, connectToProvider }) {
  const contentBg = useColorModeValue('#f0f9ff', '#1c2a3e');

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent mt="20vh" px="3vw" py={8} maxW="500px" borderRadius="20px" bg={contentBg}>
          <ModalCloseButton />
          <ModalBody padding={0} textAlign="center">
            {currentModal === modalTypes.CHOOSE_NETWORK ? (
              <ChooseNetworkModal connectToProvider={connectToProvider} />
            ) : null}
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </Modal>
    </>
  );
}

export default BaseModal;
