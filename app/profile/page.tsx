'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/app/(auth)/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

// Define type for Document
interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/profile/documents');

        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents || []);
        } else {
          console.error('Failed to fetch documents');
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleDeleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/profile/documents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the document from state
        setDocuments(documents.filter((doc) => doc.id !== id));
      } else {
        console.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">User Profile</h1>

      <Tabs defaultValue="memories" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="memories">Memories</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="memories">
          <Card>
            <CardHeader>
              <CardTitle>Your Saved Memories</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <p>Loading your memories...</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{doc.title}</h3>
                          <p className="text-sm text-gray-500">
                            Created:{' '}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                          <p className="mt-2 text-sm line-clamp-3">
                            {doc.content}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4">
                  <p>You don't have any saved memories yet.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Add documents in the RAG Test interface to create memories.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Profile settings will be added here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
