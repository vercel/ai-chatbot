'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Settings,
  Brain,
  Tag,
  Calendar,
  MessageSquare,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Memory } from '@/lib/db/schema';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface MemoryPageProps {
  memories: Memory[];
  memoryCollectionEnabled: boolean;
  userId: string;
}

interface MemoryFormData {
  content: string;
  category: string;
  tags: string[];
}

const categories = [
  'Personal',
  'Professional',
  'Preferences',
  'Goals',
  'Projects',
  'Learning',
  'Ideas',
  'Context',
  'Other',
];

export function MemoryPage({
  memories: initialMemories,
  memoryCollectionEnabled: initialEnabled,
  userId,
}: MemoryPageProps) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [memoryCollectionEnabled, setMemoryCollectionEnabled] =
    useState(initialEnabled);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [formData, setFormData] = useState<MemoryFormData>({
    content: '',
    category: 'Personal',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');

  // Extract all unique tags from memories
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    memories.forEach((memory) => {
      memory.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [memories]);

  // Filter memories
  const filteredMemories = useMemo(() => {
    return memories.filter((memory) => {
      const matchesSearch =
        searchTerm === '' ||
        memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        memory.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesCategory =
        selectedCategory === 'all' || memory.category === selectedCategory;

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => memory.tags.includes(tag));

      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [memories, searchTerm, selectedCategory, selectedTags]);

  const handleToggleMemoryCollection = async () => {
    try {
      const response = await fetch('/api/memory/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryCollectionEnabled: !memoryCollectionEnabled,
        }),
      });

      if (response.ok) {
        setMemoryCollectionEnabled(!memoryCollectionEnabled);
        toast.success(
          `Memory collection ${!memoryCollectionEnabled ? 'enabled' : 'disabled'}`,
        );
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleCreateMemory = async () => {
    if (!formData.content.trim()) {
      toast.error('Memory content is required');
      return;
    }

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newMemory = await response.json();
        setMemories((prev) => [newMemory, ...prev]);
        setFormData({ content: '', category: 'Personal', tags: [] });
        setIsCreateDialogOpen(false);
        toast.success('Memory created successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create memory');
      }
    } catch (error) {
      toast.error('Failed to create memory');
    }
  };

  const handleEditMemory = async () => {
    if (!editingMemory || !formData.content.trim()) {
      toast.error('Memory content is required');
      return;
    }

    try {
      const response = await fetch(`/api/memory/${editingMemory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedMemory = await response.json();
        setMemories((prev) =>
          prev.map((m) => (m.id === editingMemory.id ? updatedMemory : m)),
        );
        setIsEditDialogOpen(false);
        setEditingMemory(null);
        setFormData({ content: '', category: 'Personal', tags: [] });
        toast.success('Memory updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update memory');
      }
    } catch (error) {
      toast.error('Failed to update memory');
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const response = await fetch(`/api/memory/${memoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId));
        toast.success('Memory deleted successfully');
      } else {
        toast.error('Failed to delete memory');
      }
    } catch (error) {
      toast.error('Failed to delete memory');
    }
  };

  const openEditDialog = (memory: Memory) => {
    setEditingMemory(memory);
    setFormData({
      content: memory.content,
      category: memory.category,
      tags: [...memory.tags],
    });
    setIsEditDialogOpen(true);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleNavigateToChat = async (
    originalMessageId: string | null | undefined,
  ) => {
    if (!originalMessageId) return;

    try {
      const response = await fetch(`/api/memory/navigate/${originalMessageId}`);
      if (response.ok) {
        const { chatId } = await response.json();
        if (chatId) {
          window.open(`/chat/${chatId}`, '_blank');
        } else {
          toast.error('Could not find the original conversation');
        }
      } else {
        toast.error('Failed to navigate to conversation');
      }
    } catch (error) {
      toast.error('Failed to navigate to conversation');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Memory</h1>
            <p className="text-sm text-muted-foreground">
              {memories.length} memories •{' '}
              {memoryCollectionEnabled
                ? 'Collection enabled'
                : 'Collection disabled'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Memory
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSettingsDialogOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Filter className="h-4 w-4 text-muted-foreground mt-1" />
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Memory List */}
      <div className="flex-1 overflow-auto">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No memories found</h3>
            <p className="text-muted-foreground mb-4">
              {memories.length === 0
                ? 'Start creating memories to help the AI remember important information about you.'
                : 'Try adjusting your search or filters.'}
            </p>
            {memories.length === 0 && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Memory
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMemories.map((memory) => (
              <Card
                key={memory.id}
                className="group hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{memory.category}</Badge>
                      <div className="flex gap-1">
                        {memory.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(memory)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Memory</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this memory? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMemory(memory.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed mb-3">
                    {memory.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created{' '}
                      {formatDistanceToNow(new Date(memory.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                    {memory.updatedAt !== memory.createdAt && (
                      <div className="flex items-center gap-1">
                        <Edit2 className="h-3 w-3" />
                        Updated{' '}
                        {formatDistanceToNow(new Date(memory.updatedAt), {
                          addSuffix: true,
                        })}
                      </div>
                    )}
                    {memory.originalMessage && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        From conversation
                      </div>
                    )}
                  </div>
                  {memory.originalMessage && (
                    <details className="mt-3">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        Show original message
                      </summary>
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <p className="mb-2">{memory.originalMessage}</p>
                        {memory.originalMessageId && (
                          <button
                            type="button"
                            onClick={() =>
                              handleNavigateToChat(memory.originalMessageId)
                            }
                            className="text-blue-600 hover:text-blue-800 text-xs underline flex items-center gap-1"
                          >
                            <MessageSquare className="h-3 w-3" />
                            Go to conversation
                          </button>
                        )}
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Memory Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="What would you like to remember?"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateMemory}>Create Memory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Memory Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditMemory}>Update Memory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Memory Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="memory-collection">Memory Collection</Label>
                <p className="text-sm text-muted-foreground">
                  Allow the AI to automatically create memories from your
                  conversations
                </p>
              </div>
              <Switch
                id="memory-collection"
                checked={memoryCollectionEnabled}
                onCheckedChange={handleToggleMemoryCollection}
              />
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Total memories:</strong> {memories.length} / 100
              </p>
              <p>
                <strong>Categories:</strong>{' '}
                {new Set(memories.map((m) => m.category)).size}
              </p>
              <p>
                <strong>Tags:</strong> {allTags.length}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSettingsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
