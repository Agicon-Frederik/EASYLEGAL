import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Table,
  HStack,
  VStack,
  IconButton,
  Input,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  Text,
  Stack,
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export function Admin() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ email: '', name: '' });
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`);
      const data: ApiResponse<User[]> = await response.json();

      if (data.success && data.data) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({ email: '', name: '' });
    setError('');
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ email: user.email, name: user.name });
    setError('');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        fetchUsers();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.email || !formData.name) {
      setError('Both email and name are required');
      return;
    }

    try {
      const url = editingUser
        ? `${API_URL}/api/admin/users/${editingUser.id}`
        : `${API_URL}/api/admin/users`;

      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <HStack gap={4}>
            <IconButton
              aria-label="Back to home"
              onClick={handleBack}
              variant="ghost"
            >
              <FiArrowLeft />
            </IconButton>
            <Heading size="2xl">User Management</Heading>
          </HStack>
          <HStack gap={4}>
            <Button
              colorPalette="blue"
              onClick={handleCreate}
            >
              <FiPlus /> Add User
            </Button>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </HStack>
        </HStack>

        {/* Users Table */}
        <Box
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          bg="white"
        >
          {loading ? (
            <Box p={8} textAlign="center">Loading users...</Box>
          ) : users.length === 0 ? (
            <Box p={8} textAlign="center">No users found</Box>
          ) : (
            <Table.Root size="lg" variant="line">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>ID</Table.ColumnHeader>
                  <Table.ColumnHeader>Email</Table.ColumnHeader>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Created At</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {users.map((user) => (
                  <Table.Row key={user.id}>
                    <Table.Cell>{user.id}</Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                    <Table.Cell>{user.name}</Table.Cell>
                    <Table.Cell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack justify="flex-end" gap={2}>
                        <IconButton
                          aria-label="Edit user"
                          onClick={() => handleEdit(user)}
                          size="sm"
                          variant="ghost"
                          colorPalette="blue"
                        >
                          <FiEdit />
                        </IconButton>
                        <IconButton
                          aria-label="Delete user"
                          onClick={() => handleDelete(user.id)}
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                        >
                          <FiTrash2 />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

        {/* Create/Edit Dialog */}
        <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack gap={4}>
                {error && (
                  <Box
                    p={3}
                    bg="red.50"
                    borderRadius="md"
                    color="red.700"
                    fontSize="sm"
                    width="100%"
                  >
                    {error}
                  </Box>
                )}
                <Stack gap={1.5}>
                  <Text fontSize="sm" fontWeight="medium">Email <Text as="span" color="red.500">*</Text></Text>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="user@example.com"
                  />
                </Stack>
                <Stack gap={1.5}>
                  <Text fontSize="sm" fontWeight="medium">Name <Text as="span" color="red.500">*</Text></Text>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </Stack>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <HStack gap={3}>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="blue"
                  onClick={handleSubmit}
                >
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </VStack>
    </Container>
  );
}
