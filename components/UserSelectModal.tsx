import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  List,
  ListItem,
  Text,
} from '@chakra-ui/react';

type User = { id: string; name: string };

export default function UserSelectModal({
  isOpen,
  onClose,
  users,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSelect: (user: User) => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} closeOnEsc={false} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Who are you?</ModalHeader>
        <ModalBody>
          <List spacing={3}>
            {users.map((u) => (
              <ListItem key={u.id}>
                <Button width="100%" onClick={() => onSelect(u)}>{u.name}</Button>
              </ListItem>
            ))}
          </List>
        </ModalBody>
        <ModalFooter>
          <Text fontSize="sm" color="gray.500">Select your user to continue</Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
