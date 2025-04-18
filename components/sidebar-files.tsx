'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // Import Supabase client
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

interface SidebarFilesProps {
  user: User | undefined;
}

// Define the structure of a fetched document
interface DocumentItem {
  id: string;
  title: string;
  modifiedAt: string;
  chat_id: string | null; // Add chat_id (nullable UUID)
}

// --- Add grouped documents type ---
type GroupedDocuments = {
  today: DocumentItem[];
  yesterday: DocumentItem[];
  lastWeek: DocumentItem[];
  lastMonth: DocumentItem[];
  older: DocumentItem[];
};
// --- End Add ---

// --- Add grouping function (adapted from sidebar-history) ---
const groupDocumentsByDate = (documents: DocumentItem[]): GroupedDocuments => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return documents.reduce(
    (groups, doc) => {
      // Ensure modifiedAt is valid before creating Date
      const docDate = doc.modifiedAt ? new Date(doc.modifiedAt) : new Date(0); // Handle potential null/invalid dates

      if (Number.isNaN(docDate.getTime())) {
        // Handle invalid date - place in 'older' or log error?
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
// --- End Add ---

export function SidebarFiles({ user }: SidebarFilesProps) {
  const { setOpenMobile } = useSidebar(); // Get setOpenMobile
  const { id: activeChatId } = useParams(); // Get active ID from route

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null); // State for ID to delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // State for dialog visibility

  useEffect(() => {
    if (!user) {
      setDocuments([]); // Clear documents if user logs out
      return;
    }

    const fetchDocuments = async () => {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('Document')
        .select('id, title, modifiedAt, chat_id') // Fetch chat_id
        .eq('userId', user.id)
        .order('modifiedAt', { ascending: false }); // Sort by modifiedAt

      if (error) {
        console.error('Error fetching documents:', error);
        // TODO: Handle error display (e.g., show a toast notification)
      } else {
        setDocuments(data || []);
      }
      setIsLoading(false);
    };

    fetchDocuments();
  }, [user]); // Re-fetch when user changes

  // Update the function passed to the item: it now just triggers the dialog
  const handleDeleteDocument = (documentId: string) => {
    setDeleteId(documentId);
    setShowDeleteDialog(true);
  };

  // NEW function to handle the actual deletion confirmation
  const confirmDeleteDocument = async () => {
    if (!deleteId) return;
    const supabase = createClient(); // Client is fine for simple delete

    try {
      // Await the deletion directly
      const { error } = await supabase
        .from('Document')
        .delete()
        .eq('id', deleteId);

      if (error) {
        // Throw error to be caught below
        throw error;
      }

      // If successful, update state and show success toast
      setDocuments((currentDocs) =>
        currentDocs.filter((doc) => doc.id !== deleteId),
      );
      toast.success('Document deleted successfully.');
    } catch (err: any) {
      // Handle errors (from await or thrown)
      console.error('Deletion error:', err);
      toast.error(
        `Failed to delete document: ${err.message || 'Unknown error'}`,
      );
    } finally {
      // Always close dialog and reset ID
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  // Refined isActive logic using useParams and title matching
  const getIsActive = (docTitle: string, associatedChatId: string | null) => {
    // If we directly know the associated chat ID and it matches the current route, it's active.
    if (associatedChatId && associatedChatId === activeChatId) {
      return true;
    }
    // Fallback: check if the *document title* matches the *active chat's title*
    // This requires fetching the active chat's details if not already available.
    // For simplicity, we'll stick to the placeholder for now, as title matching can be unreliable.
    // A better approach would be to ensure documents store their associated chat_id.
    // console.log("Checking active state based on title - requires active chat title lookup");
    return false; // Keep placeholder logic until chat_id is available or title lookup is implemented
  };

  if (!user) {
    return null; // Don't render anything if no user
  }

  // --- Refactor return statement for styling ---
  const groupedDocuments = groupDocumentsByDate(documents);
  const hasDocuments = documents.length > 0;

  return (
    <>
      <SidebarGroup className="flex-1 overflow-y-auto">
        {' '}
        {/* Add className */}
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoading && (
              // Simplified loading state - could replicate skeleton rows if preferred
              <div className="p-4 text-sm text-muted-foreground">
                Loading documents...
              </div>
            )}
            {!isLoading && !hasDocuments && (
              <div className="p-4 text-sm text-muted-foreground">
                No documents found.
              </div>
            )}
            {!isLoading && hasDocuments && (
              <div className="flex flex-col gap-2 pb-2">
                {' '}
                {/* Consistent gap */}
                {groupedDocuments.today.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                      Today
                    </div>
                    {groupedDocuments.today.map((doc) => (
                      <SidebarFilesItem
                        key={doc.id}
                        document={doc}
                        // Pass placeholder chat ID for isActive check - needs real data later
                        isActive={getIsActive(doc.title, doc.chat_id)}
                        onDelete={handleDeleteDocument}
                      />
                    ))}
                  </div>
                )}
                {groupedDocuments.yesterday.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                      Yesterday
                    </div>
                    {groupedDocuments.yesterday.map((doc) => (
                      <SidebarFilesItem
                        key={doc.id}
                        document={doc}
                        isActive={getIsActive(doc.title, doc.chat_id)}
                        onDelete={handleDeleteDocument}
                      />
                    ))}
                  </div>
                )}
                {groupedDocuments.lastWeek.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                      Last 7 Days
                    </div>
                    {groupedDocuments.lastWeek.map((doc) => (
                      <SidebarFilesItem
                        key={doc.id}
                        document={doc}
                        isActive={getIsActive(doc.title, doc.chat_id)}
                        onDelete={handleDeleteDocument}
                      />
                    ))}
                  </div>
                )}
                {groupedDocuments.lastMonth.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                      Last 30 Days
                    </div>
                    {groupedDocuments.lastMonth.map((doc) => (
                      <SidebarFilesItem
                        key={doc.id}
                        document={doc}
                        isActive={getIsActive(doc.title, doc.chat_id)}
                        onDelete={handleDeleteDocument}
                      />
                    ))}
                  </div>
                )}
                {groupedDocuments.older.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                      Older
                    </div>
                    {groupedDocuments.older.map((doc) => (
                      <SidebarFilesItem
                        key={doc.id}
                        document={doc}
                        isActive={getIsActive(doc.title, doc.chat_id)}
                        onDelete={handleDeleteDocument}
                      />
                    ))}
                  </div>
                )}
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
              onClick={confirmDeleteDocument} // confirmDelete should now ONLY delete the document
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
