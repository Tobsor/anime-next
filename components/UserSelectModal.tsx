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
      <ModalOverlay bg="rgba(5, 8, 13, 0.72)" />
      <ModalContent bg="surface.800" border="1px solid" borderColor="surface.600" borderRadius="2xl" p={2}>
        <ModalHeader color="white">Who are you?</ModalHeader>
        <ModalBody>
          <List spacing={3}>
            {users.map((u) => (
              <ListItem key={u.id}>
                <Button
                  width="100%"
                  variant="ghost"
                  bg="surface.700"
                  color="white"
                  _hover={{ bg: 'surface.600' }}
                  onClick={() => onSelect(u)}
                >
                  {u.name}
                </Button>
              </ListItem>
            ))}
          </List>
        </ModalBody>
        <ModalFooter>
          <Text fontSize="sm" color="gray.400">Select your user to continue</Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
