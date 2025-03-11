'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function SystemNotificationPoller() {
  const router = useRouter();
  
  useEffect(() => {
    let lastChecked = new Date().toISOString();
    
    const checkForSystemNotifications = async () => {
      try {
        // First, get the system chat ID
        const systemResponse = await fetch('/api/chat/system');
        
        if (!systemResponse.ok) {
          console.error('Failed to get research agent chat ID');
          return;
        }
        
        const { id: systemChatId } = await systemResponse.json();
        
        // Then check for new notifications
        const response = await fetch(`/api/chat?lastChecked=${encodeURIComponent(lastChecked)}&systemChat=true`);
        
        if (response.ok) {
          const cronMessages = await response.json();
          
          if (cronMessages.length > 0) {
            // New system notifications found
            lastChecked = new Date().toISOString();
            
            // Get the first message content for the toast notification
            const firstMessage = cronMessages[0];
            
            // Ensure content is a string
            let messageContent = firstMessage.content;
            if (typeof messageContent === 'object' && messageContent !== null) {
              try {
                messageContent = JSON.stringify(messageContent, null, 2);
              } catch (error) {
                console.error('Error stringifying message content:', error);
                messageContent = JSON.stringify(messageContent);
              }
            } else if (typeof messageContent !== 'string') {
              messageContent = String(messageContent);
            }
            
            const messagePreview = messageContent.length > 50 
              ? messageContent.substring(0, 50) + '...' 
              : messageContent;
            
            // Show a toast notification with message preview and prominent View button
            const toastId = toast.info(
              <div>
                <div className="font-semibold mb-1">New Research Update</div>
                <div className="text-sm opacity-90 mb-2">{messagePreview}</div>
                <button 
                  onClick={() => {
                    // Dismiss the toast when clicked
                    toast.dismiss(toastId);
                    // Navigate to the system chat
                    router.push(`/chat/${systemChatId}`);
                  }}
                  className="w-full mt-1 py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
                >
                  View Research
                </button>
              </div>, 
              {
                duration: 8000, // Show for longer (8 seconds)
                position: 'top-right',
                // Also dismiss the toast when the action button is clicked
                action: {
                  label: 'View',
                  onClick: () => {
                    toast.dismiss(toastId);
                    router.push(`/chat/${systemChatId}`);
                  }
                }
              }
            );
            
            // Force refresh the chat list to move system chat to top
            router.refresh();
          }
        }
      } catch (error) {
        console.error('Error checking for research agent updates:', error);
      }
    };
    
    // Initial check
    checkForSystemNotifications();
    
    // Check every 30 seconds
    const interval = setInterval(checkForSystemNotifications, 30000);
    return () => clearInterval(interval);
  }, [router]);
  
  return null; // This component doesn't render anything
}