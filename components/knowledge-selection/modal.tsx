'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface KnowledgeItem {
  id: string;
  title: string;
  createdAt: string; // ISO date string
  sourceType: string;
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
      const response = await fetch('/api/knowledge-list');
      if (response.ok) {
        const data = await response.json();
        // Sort by created date descending (newest first)
        const sorted = data.sort((a: KnowledgeItem, b: KnowledgeItem) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setKnowledgeItems(sorted);
        
        // If no initial selection, select all by default
        if (initialSelection.length === 0 && sorted.length > 0) {
          setSelectedIds(sorted.map(item => item.id));
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
  
  // Get source type icon name
  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📄';
      case 'audio':
        return '🔊';
      case 'url':
        return '🌐';
      case 'pdf':
        return '📑';
      default:
        return '📄';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Knowledge Sources</DialogTitle>
        </DialogHeader>

        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Select which knowledge sources to use in chat
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
          <div className="py-6 text-center flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> 
            Loading knowledge items...
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="grid grid-cols-2 gap-4">
              {knowledgeItems.map((item) => (
                <div key={item.id} className="border rounded-md p-3 flex items-start gap-2">
                  <Checkbox 
                    id={`item-${item.id}`}
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() => handleToggleSelection(item.id)}
                  />
                  <div className="flex flex-col">
                    <Label className="font-medium" htmlFor={`item-${item.id}`}>
                      <span className="mr-1">{getSourceTypeIcon(item.sourceType)}</span>
                      {item.title}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {knowledgeItems.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No knowledge items found. Add some knowledge first.
                </div>
              )}
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