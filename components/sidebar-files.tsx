'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs'; // ADD: Clerk hook
import { useEffect, useState } from 'react';
import { fetcher } from '@/lib/utils'; // ADD: Fetcher utility
import { Skeleton } from './ui/skeleton'; // For loading state
import { SidebarFilesItem } from './sidebar-files-item'; // Import the new item component
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar, // Import useSidebar
} from '@/components/ui/sidebar'; // Import Sidebar components

// Define the structure expected from the API endpoint
interface DocumentItem {
  id: string;
  title: string;
  modifiedAt: string; // API should provide this
  chatId: string | null; // Renamed from chat_id for consistency
  createdAt: string; // <<< ADD createdAt
  type: 'document'; // Added by API
  // Add other fields if needed/returned by API (e.g., createdAt, userId?)
}

// API Response structure
interface FilesApiResponse {
  items: DocumentItem[];
  hasMore: boolean;
}

// --- Grouped documents type (using DocumentItem) ---
type GroupedDocuments = {
  today: DocumentItem[];
  yesterday: DocumentItem[];
  lastWeek: DocumentItem[];
  lastMonth: DocumentItem[];
  older: DocumentItem[];
};

// --- Grouping function (minor update to use chatId) ---
const groupDocumentsByDate = (documents: DocumentItem[]): GroupedDocuments => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return documents.reduce(
    (groups, doc) => {
      const docDate = doc.modifiedAt ? new Date(doc.modifiedAt) : new Date(0);

      if (Number.isNaN(docDate.getTime())) {
        console.warn(`Invalid modifiedAt date for document ${doc.id}`);
        groups.older.push(doc);
      } else if (isToday(docDate)) {
        groups.today.push(doc);
      } else if (isYesterday(docDate)) {
        groups.yesterday.push(doc);
      } else if (docDate > oneWeekAgo) {
        groups.lastWeek.push(doc);
      } else if (docDate > oneMonthAgo) {
        groups.lastMonth.push(doc);
      } else {
        groups.older.push(doc);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedDocuments,
  );
};

export function SidebarFiles() {
  const { setOpenMobile } = useSidebar();
  const { id: activeChatId } = useParams();
  const { isSignedIn } = useUser(); // Get Clerk auth state

  // Use more descriptive state names
  const [fetchedData, setFetchedData] = useState<FilesApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    // Fetch only if signed in
    if (!isSignedIn) {
      setFetchedData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use fetcher for the API route
        const data: FilesApiResponse = await fetcher('/api/history?type=files');
        console.log('[SidebarFiles] Fetched data:', data);
        setFetchedData(data);
      } catch (err: any) {
        console.error('Error fetching documents:', err);
        setError(err);
        toast.error(`Failed to load documents: ${err.message}`);
        setFetchedData(null); // Clear on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [isSignedIn]); // Re-fetch when auth state changes

  // TODO: Update delete logic to use an API route instead of Supabase client
  const handleDeleteDocument = (documentId: string) => {
    setDeleteId(documentId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteDocument = async () => {
    if (!deleteId) return;

    console.log('TODO: Implement document deletion via API route');
    toast.info('Document deletion not implemented yet.');
    // Placeholder: Close dialog without deleting
    setShowDeleteDialog(false);
    setDeleteId(null);

    /* --- OLD SUPABASE DELETE ---
    const supabase = createClient(); 
    try {
      const { error } = await supabase
        .from('Document')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      // Update state locally after successful API call
      setFetchedData(currentData => {
        if (!currentData) return null;
        return {
          ...currentData,
          items: currentData.items.filter((doc) => doc.id !== deleteId),
        };
      });
      toast.success('Document deleted successfully.');
    } catch (err: any) {
      console.error('Deletion error:', err);
      toast.error(
        `Failed to delete document: ${err.message || 'Unknown error'}`,
      );
    } finally {
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
    --- */
  };

  // Use `chatId` from the fetched data
  const getIsActive = (document: DocumentItem) => {
    if (document.chatId && document.chatId === activeChatId) {
      return true;
    }
    return false;
  };

  // Use `isSignedIn` check from Clerk
  if (!isSignedIn) {
    // Optionally show a login prompt like SidebarHistory
    return null;
  }

  const documents = fetchedData?.items ?? [];
  const groupedDocuments = groupDocumentsByDate(documents);
  const hasDocuments = !isLoading && documents.length > 0;

  return (
    <>
      <SidebarGroup className="flex-1 overflow-y-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoading && (
              <div className="p-4 text-sm text-muted-foreground">
                Loading documents...
              </div>
            )}
            {!isLoading && error && (
              <div className="p-4 text-sm text-red-600">
                Error loading documents: {error.message}
              </div>
            )}
            {!isLoading && !error && !hasDocuments && (
              <div className="p-4 text-sm text-muted-foreground">
                No documents found.
              </div>
            )}
            {!isLoading && !error && hasDocuments && (
              <div className="flex flex-col gap-2 pb-2">
                {Object.entries(groupedDocuments).map(([groupName, items]) => {
                  if (items.length === 0) return null;
                  const groupNameMap: Record<string, string> = {
                    today: 'Today',
                    yesterday: 'Yesterday',
                    lastWeek: 'Last 7 Days',
                    lastMonth: 'Last 30 Days',
                    older: 'Older',
                  };
                  const displayGroupName =
                    groupNameMap[groupName] ||
                    groupName.charAt(0).toUpperCase() + groupName.slice(1);

                  return (
                    <div key={groupName}>
                      <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                        {displayGroupName}
                      </div>
                      {items.map((doc) => (
                        <SidebarFilesItem
                          key={`document-${doc.id}-${doc.createdAt || 'no-created-at'}`}
                          document={doc}
                          isActive={getIsActive(doc)}
                          onDelete={handleDeleteDocument}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Keep the AlertDialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              document titled `
              {documents.find((doc) => doc.id === deleteId)?.title ||
                'this document'}
              `.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
