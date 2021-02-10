import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  ModalFooter,
} from '@chakra-ui/react';

function BaseModal({ isOpen, onOpen, onClose, children, headingText }) {
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader textAlign="center">{headingText}</ModalHeader>
          <ModalCloseButton />
          <ModalBody textAlign="center">{children}</ModalBody>
          <ModalFooter />
        </ModalContent>
      </Modal>
    </>
  );
}

export default BaseModal;
