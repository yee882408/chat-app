'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  is_banned: boolean;
};

export const AdminChatControls = ({ chatId, createdBy }: { chatId: string; createdBy: string }) => {
  const { user, role } = useAuthStore();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // Only show admin controls for admins
  if (role !== 'admin') return null;

  const handleDeleteChat = async () => {
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // First delete all messages in the chat
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);

      if (messagesError) {
        throw messagesError;
      }

      // Then delete the chat itself
      const { error: chatError } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (chatError) {
        throw chatError;
      }

      // Navigate back to chat list
      router.replace('/supabase-chat');
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="text-sm font-semibold text-red-600 mb-2">Admin Controls</h3>
      <button
        onClick={handleDeleteChat}
        disabled={isDeleting}
        className={`px-3 py-1 rounded text-sm ${
          isDeleting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
      >
        {isDeleting ? 'Deleting...' : 'Delete Chat'}
      </button>
    </div>
  );
};

export const UserManagement = () => {
  const { role, banUser, unbanUser, setUserRole } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserList, setShowUserList] = useState(false);

  // Only show admin controls for admins
  if (role !== 'admin') return null;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserList = () => {
    if (!showUserList) {
      fetchUsers();
    }
    setShowUserList(!showUserList);
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      if (isBanned) {
        await unbanUser(userId);
      } else {
        await banUser(userId);
      }
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user ban status:', error);
      alert('Failed to update user ban status. Please try again.');
    }
  };

  const handleSetRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await setUserRole(userId, newRole);
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">User Management</h2>
        <button
          onClick={handleToggleUserList}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {showUserList ? 'Hide Users' : 'Show Users'}
        </button>
      </div>

      {showUserList && (
        <div className="mt-4">
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleSetRole(user.id, e.target.value as 'user' | 'admin')}
                          className="border rounded px-2 py-1"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_banned
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleBanUser(user.id, user.is_banned)}
                          className={`px-3 py-1 rounded text-sm ${
                            user.is_banned
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          {user.is_banned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
