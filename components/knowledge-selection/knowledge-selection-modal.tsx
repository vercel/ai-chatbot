'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface KnowledgeItem {
  id: string;
  title: string;
  createdAt: string; // ISO date string
  sourceType?: string; // Optional field to show document type
}

interface KnowledgeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedIds: string[]) => void;
  initialSelection: string[];
}

export function KnowledgeSelectionModal({
  isOpen,
  onClose,
  onSelect,
  initialSelection,
}: KnowledgeSelectionModalProps) {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelection);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch knowledge items when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchKnowledgeItems();
    }
  }, [isOpen]);

  const fetchKnowledgeItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/knowledge/items');
      if (response.ok) {
        const data = await response.json();
        setKnowledgeItems(data);
        
        // If no selection yet and we have items, select all by default
        if (initialSelection.length === 0 && data.length > 0) {
          setSelectedIds(data.map((item: KnowledgeItem) => item.id));
        }
      } else {
        console.error('Failed to fetch knowledge items:', await response.text());
      }
    } catch (error) {
      console.error('Failed to fetch knowledge items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(knowledgeItems.map((item) => item.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleSave = () => {
    onSelect(selectedIds);
    onClose();
  };

  const areAllSelected = knowledgeItems.length > 0 && selectedIds.length === knowledgeItems.length;

  // Get source type icon helper function
  const getSourceTypeLabel = (type?: string) => {
    if (!type) return 'Document';
    
    switch (type) {
      case 'text': return 'Text';
      case 'audio': return 'Audio';
      case 'url': return 'URL';
      case 'pdf': return 'PDF';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Select Knowledge Sources</DialogTitle>
          <DialogDescription>
            Choose which knowledge items to include in your chat retrieval process
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Select which knowledge sources to use in chat retrieval
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={areAllSelected ? handleDeselectAll : handleSelectAll}
            >
              {areAllSelected ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-6 text-center">Loading knowledge items...</div>
        ) : knowledgeItems.length === 0 ? (
          <div className="py-6 text-center">No knowledge items found in your database.</div>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            <div className="grid grid-cols-2 gap-4">
              {knowledgeItems.map((item) => (
                <div key={item.id} className="border rounded-md p-3 flex items-start gap-2">
                  <Checkbox 
                    id={`item-${item.id}`}
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() => handleToggleSelection(item.id)}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <Label 
                      className="font-medium truncate" 
                      htmlFor={`item-${item.id}`}
                      title={item.title}
                    >
                      {item.title}
                    </Label>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {getSourceTypeLabel(item.sourceType)}
                      </span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Apply Selection</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
