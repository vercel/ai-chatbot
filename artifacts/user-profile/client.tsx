/* eslint-disable @next/next/no-img-element */
'use client';

import { Artifact } from '@/components/create-artifact';
import { CopyIcon, RedoIcon, UserIcon } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UserProfileData {
  status: 'authenticated' | 'not-authenticated' | 'error';
  id?: string;
  email?: string;
  picture?: string;
  message?: string;
  [key: string]: any; // Allow for additional properties
}

// Helper function to format property keys for display
const formatPropertyKey = (key: string): string => {
  // Skip these properties as they're handled separately or internal
  if (['status', 'message', 'picture'].includes(key)) return '';
  
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter
};

// Helper function to format property values for display
const formatPropertyValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return 'Not available';
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return 'Complex object';
    }
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  return String(value);
};

// Helper to check if a string is a valid URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const userProfileArtifact = new Artifact({
  kind: 'user-profile' as any, // Type assertion to bypass type checking
  description: 'Displays user profile information',
  
  onStreamPart: ({ streamPart, setArtifact }) => {
    if ((streamPart.type as string) === 'user-profile-delta') {
      try {
        const content = streamPart.content as string;
        const userData: UserProfileData = JSON.parse(content);
        
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          content,
          isVisible: true,
          status: 'streaming',
        }));
      } catch (error) {
        console.error('Error parsing user profile data:', error);
      }
    }
  },
  
  content: ({ content, status }) => {
    let userData: UserProfileData = { status: 'error', message: 'Invalid data format' };
    
    try {
      userData = JSON.parse(content || '{}');
    } catch (error) {
      console.error('Error parsing user profile content:', error);
    }
    
    if (userData.status === 'not-authenticated') {
      return (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <UserIcon />
              User Profile
            </CardTitle>
            <CardDescription>You are not signed in</CardDescription>
          </CardHeader>
        </Card>
      );
    }
    
    if (userData.status === 'error') {
      return (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <UserIcon />
              User Profile
            </CardTitle>
            <CardDescription>Error loading profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{userData.message || 'An error occurred'}</p>
          </CardContent>
        </Card>
      );
    }
    
    // Get all user properties except for special ones
    const userProperties = Object.entries(userData)
      .filter(([key]) => !['status', 'message', 'picture'].includes(key))
      .sort(([keyA], [keyB]) => {
        // Ensure id and email are at the top
        if (keyA === 'id') return -1;
        if (keyB === 'id') return 1;
        if (keyA === 'email') return keyB === 'id' ? 1 : -1;
        if (keyB === 'email') return keyA === 'id' ? -1 : 1;
        return keyA.localeCompare(keyB);
      });
    
    // Find picture URL - check common picture field names
    const pictureUrl = userData.picture || userData.image || userData.avatar || userData.profilePicture || userData.profileImage;
    const hasValidPicture = pictureUrl && typeof pictureUrl === 'string' && isValidUrl(pictureUrl);
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <UserIcon />
            User Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="flex space-y-10 flex-col gap-4">
          <div className="flex items-center gap-4">
            {hasValidPicture ? (
              <div className="shrink-0 size-16 rounded-full overflow-hidden aspect-square">
                <img 
                  src={pictureUrl}
                  alt={userData.name || userData.email || "User"}
                  className="object-cover size-full"
                />
              </div>
            ) : (
              <div className="shrink-0 size-16 rounded-full bg-muted flex items-center justify-center overflow-hidden aspect-square">
                <span className="text-lg font-semibold">
                  {userData.email?.substring(0, 2).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium">Account Details</h3>
              <p className="text-sm text-muted-foreground">Signed in as {userData.email}</p>
            </div>
          </div>
          
          <div className="space-y-3 border rounded-md p-4 bg-muted/10">
            {userProperties.map(([key, value]) => {
              const formattedKey = formatPropertyKey(key);
              if (!formattedKey) return null;
              
              // Special handling for picture URLs
              if (key.toLowerCase().includes('picture') && typeof value === 'string' && isValidUrl(value)) {
                return (
                  <div key={key} className="flex justify-between items-center py-1.5">
                    <span className="text-sm font-medium min-w-[120px] mr-4">{formattedKey}</span>
                    <div className="flex items-center">
                      <span className="text-muted-foreground truncate max-w-[400px] font-mono text-xs">
                        {value.substring(0, 60)}...
                      </span>
                      <a 
                        href={value} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-blue-500 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={key} className="flex justify-between items-center py-1.5">
                  <span className="text-sm font-medium min-w-[120px] mr-4">{formattedKey}</span>
                  <span className={`text-sm text-muted-foreground truncate max-w-[500px] ${key === 'id' || key.toLowerCase().includes('hash') || key.toLowerCase().includes('token') || key.toLowerCase().includes('address') ? 'font-mono text-xs' : ''}`}>
                    {formatPropertyValue(key, value)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  },
  
  actions: [
    {
      icon: <RedoIcon size={18} />,
      description: 'Refresh profile',
      onClick: (context) => {
        // We can't directly append a message here, so we'll just log for now
        console.log('Refresh profile requested');
      },
    },
  ],
  
  toolbar: [
    {
      icon: <CopyIcon />,
      description: 'Copy user ID',
      onClick: (context) => {
        try {
          // We can't directly access the artifact here, so we'll just log for now
          console.log('Copy user ID requested');
        } catch (error) {
          console.error('Error copying user ID:', error);
        }
      },
    },
  ],
}); 