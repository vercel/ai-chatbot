'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Admin dashboard page
export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);

        // Fetch admin data from our API endpoints using PostgreSQL
        const [usersResponse, chatsResponse] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/chats'),
        ]);

        if (!usersResponse.ok || !chatsResponse.ok) {
          throw new Error('Failed to fetch admin data');
        }

        const usersData = await usersResponse.json();
        const chatsData = await chatsResponse.json();

        setUsers(usersData);
        setChats(chatsData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}. Make sure you have admin privileges.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Total users: {users.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading user data...</p>
            ) : (
              <div className="h-64 overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="py-2">{user.name || 'N/A'}</td>
                        <td className="py-2">{user.email}</td>
                        <td className="py-2">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chats</CardTitle>
            <CardDescription>Total chats: {chats.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading chat data...</p>
            ) : (
              <div className="h-64 overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Title</th>
                      <th className="text-left py-2">User</th>
                      <th className="text-left py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chats.map((chat) => (
                      <tr key={chat.id} className="border-b">
                        <td className="py-2">{chat.title}</td>
                        <td className="py-2">{chat.userId}</td>
                        <td className="py-2">
                          {new Date(chat.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 justify-end">
        <Button onClick={() => window.location.reload()}>Refresh Data</Button>
      </div>
    </div>
  );
}
