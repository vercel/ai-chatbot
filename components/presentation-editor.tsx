'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Deck, 
  Slide, 
  Heading, 
  Text, 
  Image,
  CodePane,
  UnorderedList,
  OrderedList,
  ListItem,
  FlexBox,
  Box,
  DefaultTemplate,
  Notes,
  Appear
} from 'spectacle';
import { ComponentType, Dispatch, SetStateAction } from 'react';
import { Suggestion } from '@/lib/db/schema';
import { PresentationMetadata } from '@/artifacts/presentation/client';
import { Button } from './ui/button';
import { 
  ArrowUpIcon, 
  CrossIcon, 
  FullscreenIcon,
  PlayIcon 
} from './icons';
import { cn } from '@/lib/utils';
import { useSidebar } from './ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';

// Custom arrow icons since they're not available in the icons module
const ChevronLeftIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    style={{ color: 'currentcolor' }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.2071 2.29289C10.5976 2.68342 10.5976 3.31658 10.2071 3.70711L6.91421 7L10.2071 10.2929C10.5976 10.6834 10.5976 11.3166 10.2071 11.7071C9.81658 12.0976 9.18342 12.0976 8.79289 11.7071L4.79289 7.70711C4.40237 7.31658 4.40237 6.68342 4.79289 6.29289L8.79289 2.29289C9.18342 1.90237 9.81658 1.90237 10.2071 2.29289Z"
      fill="currentColor"
    />
  </svg>
);

const ChevronRightIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    style={{ color: 'currentcolor' }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.79289 2.29289C6.18342 1.90237 6.81658 1.90237 7.20711 2.29289L11.2071 6.29289C11.5976 6.68342 11.5976 7.31658 11.2071 7.70711L7.20711 11.7071C6.81658 12.0976 6.18342 12.0976 5.79289 11.7071C5.40237 11.3166 5.40237 10.6834 5.79289 10.2929L9.08579 7L5.79289 3.70711C5.40237 3.31658 5.40237 2.68342 5.79289 2.29289Z"
      fill="currentColor"
    />
  </svg>
);

const PauseIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    height={size}
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width={size}
    style={{ color: 'currentcolor' }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.5 2C4.22386 2 4 2.22386 4 2.5V13.5C4 13.7761 4.22386 14 4.5 14H6.5C6.77614 14 7 13.7761 7 13.5V2.5C7 2.22386 6.77614 2 6.5 2H4.5ZM9.5 2C9.22386 2 9 2.22386 9 2.5V13.5C9 13.7761 9.22386 14 9.5 14H11.5C11.7761 14 12 13.7761 12 13.5V2.5C12 2.22386 11.7761 2 11.5 2H9.5Z"
      fill="currentColor"
    />
  </svg>
);

// Predefined themes
const PREDEFINED_THEMES = [
  {
    name: 'Modern Blue',
    primary: '#2563eb',
    secondary: '#7c3aed',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#1f2937',
    accent: '#f59e0b',
  },
  {
    name: 'Ocean Breeze',
    primary: '#0891b2',
    secondary: '#06b6d4',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
    textColor: '#0f172a',
    accent: '#f97316',
  },
  {
    name: 'Sunset Glow',
    primary: '#dc2626',
    secondary: '#ea580c',
    background: 'linear-gradient(135deg, #f97316 0%, #dc2626 50%, #be185d 100%)',
    textColor: '#111827',
    accent: '#facc15',
  },
  {
    name: 'Forest Green',
    primary: '#059669',
    secondary: '#0d9488',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    textColor: '#111827',
    accent: '#f59e0b',
  },
  {
    name: 'Royal Purple',
    primary: '#7c3aed',
    secondary: '#a855f7',
    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)',
    textColor: '#111827',
    accent: '#f59e0b',
  },
  {
    name: 'Corporate Dark',
    primary: '#374151',
    secondary: '#4b5563',
    background: 'linear-gradient(135deg, #374151 0%, #1f2937 50%, #111827 100%)',
    textColor: '#f9fafb',
    accent: '#3b82f6',
  },
];

const spectacleTheme = {
  colors: {
    primary: '#0066CC',
    secondary: '#FF6B35',
    tertiary: '#FFFFFF',
  },
  fonts: {
    header: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    text: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  fontSizes: {
    h1: '64px',
    h2: '48px',
    h3: '32px',
    text: '28px',
  },
};

// Function to safely parse and render JSX content
const parseSlideContent = (content: string, theme: PresentationMetadata['theme']) => {
  try {
    // Simple JSX-like parsing for demo purposes
    // In a real implementation, you might want to use a proper JSX parser
    const slides = content.split('---').filter(slide => slide.trim());
    
    return slides.map((slideContent, index) => {
      const lines = slideContent.trim().split('\n').filter(line => line.trim());
      const elements: React.ReactNode[] = [];
      
      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('# ')) {
          elements.push(
            <h1 
              key={`heading-${index}-${lineIndex}`} 
              className="text-5xl md:text-6xl font-bold mb-8 leading-tight"
              style={{ color: theme.textColor }}
            >
              {trimmedLine.substring(2)}
            </h1>
          );
        } else if (trimmedLine.startsWith('## ')) {
          elements.push(
            <h2 
              key={`heading2-${index}-${lineIndex}`} 
              className="text-3xl md:text-4xl font-semibold mb-6 leading-tight"
              style={{ color: theme.primary }}
            >
              {trimmedLine.substring(3)}
            </h2>
          );
        } else if (trimmedLine.startsWith('### ')) {
          elements.push(
            <h3 
              key={`heading3-${index}-${lineIndex}`} 
              className="text-2xl md:text-3xl font-medium mb-4"
              style={{ color: theme.secondary }}
            >
              {trimmedLine.substring(4)}
            </h3>
          );
        } else if (trimmedLine.startsWith('![')) {
          // Image syntax: ![alt](url)
          const match = trimmedLine.match(/!\[([^\]]*)\]\(([^)]+)\)/);
          if (match) {
            const [, alt, src] = match;
            elements.push(
              <div key={`image-${index}-${lineIndex}`} className="my-8 flex justify-center">
                <img 
                  src={src} 
                  alt={alt}
                  className="max-w-full max-h-80 rounded-lg shadow-lg"
                />
              </div>
            );
          }
        } else if (trimmedLine.startsWith('**$') && trimmedLine.includes(' - ')) {
          // Property listing format: **$450,000 - 123 Main St**
          const propertyMatch = trimmedLine.match(/\*\*\$([0-9,]+)\s*-\s*(.+)\*\*/);
          if (propertyMatch) {
            const [, price, address] = propertyMatch;
            elements.push(
              <div 
                key={`property-${index}-${lineIndex}`} 
                className="my-6 p-6 rounded-xl border-2 bg-white/50"
                style={{ borderColor: theme.primary }}
              >
                <div className="text-3xl font-bold mb-2" style={{ color: theme.primary }}>
                  ${price}
                </div>
                <div className="text-xl font-medium mb-4" style={{ color: theme.textColor }}>
                  {address}
                </div>
              </div>
            );
          }
        } else if (trimmedLine.startsWith('- ') && (trimmedLine.includes('beds') || trimmedLine.includes('baths') || trimmedLine.includes('sqft'))) {
          // Property details format: - 3 beds, 2 baths, 1,900 sqft
          elements.push(
            <div key={`property-details-${index}-${lineIndex}`} className="my-2">
              <div className="flex items-center gap-3 text-lg">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: theme.accent }}
                />
                <span 
                  className="font-medium"
                  style={{ color: theme.textColor }}
                >
                  {trimmedLine.substring(2)}
                </span>
              </div>
            </div>
          );
        } else if (trimmedLine.startsWith('- ') && (trimmedLine.includes('Active') || trimmedLine.includes('Pending') || trimmedLine.includes('Sold') || trimmedLine.includes('Family') || trimmedLine.includes('Condo') || trimmedLine.includes('Townhouse'))) {
          // Property status/type format: - Single Family Home - Active
          const statusColor = trimmedLine.includes('Active') ? '#10b981' : 
                             trimmedLine.includes('Pending') ? '#f59e0b' : 
                             trimmedLine.includes('Sold') ? '#ef4444' : theme.secondary;
          
          elements.push(
            <div key={`property-status-${index}-${lineIndex}`} className="my-2">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: statusColor }}
                />
                <span 
                  className="text-lg font-medium"
                  style={{ color: statusColor }}
                >
                  {trimmedLine.substring(2)}
                </span>
              </div>
            </div>
          );
        } else if (trimmedLine.startsWith('- ')) {
          // Regular bullet point
          elements.push(
            <div key={`list-${index}-${lineIndex}`} className="my-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-2 h-2 rounded-full mt-3 flex-shrink-0"
                  style={{ backgroundColor: theme.accent }}
                />
                <p 
                  className="text-xl md:text-2xl leading-relaxed"
                  style={{ color: theme.textColor }}
                >
                  {trimmedLine.substring(2)}
                </p>
              </div>
            </div>
          );
        } else if (trimmedLine.startsWith('```')) {
          // Code block (simplified)
          const codeMatch = content.match(/```(\w+)?\n([\s\S]*?)\n```/);
          if (codeMatch) {
            elements.push(
              <div key={`code-${index}-${lineIndex}`} className="my-6">
                <pre 
                  className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm md:text-base"
                  style={{ backgroundColor: '#1a1a1a', border: `2px solid ${theme.primary}` }}
                >
                  <code>{codeMatch[2]}</code>
                </pre>
              </div>
            );
          }
        } else if (trimmedLine && !trimmedLine.startsWith('Notes:')) {
          elements.push(
            <p 
              key={`text-${index}-${lineIndex}`} 
              className="text-xl md:text-2xl leading-relaxed mb-4"
              style={{ color: theme.textColor }}
            >
              {trimmedLine}
            </p>
          );
        }
      });
      
      return elements;
    });
  } catch (error) {
    console.error('Error parsing slide content:', error);
    return [[
      <p key="error" className="text-xl text-red-500">Error parsing presentation content. Please check the format.</p>
    ]];
  }
};

interface ArtifactContent<M = any> {
  title: string;
  content: string;
  mode: 'edit' | 'diff';
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: 'streaming' | 'idle';
  suggestions: Array<Suggestion>;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  isInline: boolean;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
  metadata: M;
  setMetadata: Dispatch<SetStateAction<M>>;
}

interface PresentationEditorProps extends ArtifactContent<PresentationMetadata> {}

export function PresentationEditor({
  content,
  metadata,
  setMetadata,
  isCurrentVersion,
  onSaveContent,
}: PresentationEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const { toggleSidebar, open: isSidebarOpen } = useSidebar();

  const currentTheme = metadata?.theme || PREDEFINED_THEMES[0];
  const slides = useMemo(() => parseSlideContent(content, currentTheme), [content, currentTheme]);
  const totalSlides = slides.length;

  // Update metadata when slides change
  useEffect(() => {
    if (metadata && metadata.totalSlides !== totalSlides) {
      setMetadata(prev => ({
        ...prev,
        totalSlides,
      }));
    }
  }, [totalSlides, metadata, setMetadata]);

  // Handle presentation mode
  useEffect(() => {
    if (metadata?.isPresenting) {
      if (isSidebarOpen) {
        toggleSidebar();
      }
    }
  }, [metadata?.isPresenting, isSidebarOpen, toggleSidebar]);

  const handleSlideChange = useCallback((direction: 'next' | 'prev') => {
    if (!metadata) return;
    
    const currentSlide = metadata.currentSlide;
    let newSlide = currentSlide;
    
    if (direction === 'next' && currentSlide < totalSlides - 1) {
      newSlide = currentSlide + 1;
    } else if (direction === 'prev' && currentSlide > 0) {
      newSlide = currentSlide - 1;
    }
    
    setMetadata(prev => ({
      ...prev,
      currentSlide: newSlide,
    }));
  }, [metadata, totalSlides, setMetadata]);

  const handleThemeChange = useCallback((newTheme: typeof PREDEFINED_THEMES[0]) => {
    setMetadata(prev => ({
      ...prev,
      theme: newTheme,
    }));
    setShowThemeSelector(false);
  }, [setMetadata]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!metadata?.isPresenting) return;
    
    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault();
        handleSlideChange('next');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        handleSlideChange('prev');
        break;
      case 'Escape':
        event.preventDefault();
        setMetadata(prev => ({
          ...prev,
          isPresenting: false,
        }));
        break;
    }
  }, [metadata?.isPresenting, handleSlideChange, setMetadata]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleSave = useCallback(() => {
    onSaveContent(editContent, false);
    setIsEditing(false);
  }, [editContent, onSaveContent]);

  const currentSlide = metadata?.currentSlide || 0;

  if (metadata?.isPresenting) {
    // Fullscreen presentation mode with beautiful styling
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
        style={{ background: currentTheme.background }}
      >
        {/* Exit button */}
        <div className="absolute top-6 right-6 z-60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMetadata(prev => ({ ...prev, isPresenting: false }))}
            className="text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <CrossIcon size={20} />
          </Button>
        </div>

        {/* Beautiful slide display */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full max-w-7xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: `3px solid ${currentTheme.primary}`,
            }}
          >
            <div className="w-full h-full p-12 flex flex-col justify-center items-center text-center overflow-auto">
              {slides[currentSlide] || [
                <p key="empty" className="text-2xl text-gray-500">No content for this slide</p>
              ]}
            </div>
          </motion.div>
        </div>

        {/* Enhanced navigation controls */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/30 backdrop-blur-sm rounded-full px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSlideChange('prev')}
            disabled={currentSlide === 0}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ChevronLeftIcon size={20} />
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSlides }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentSlide ? "bg-white scale-125" : "bg-white/50"
                )}
              />
            ))}
          </div>
          
          <span className="text-white text-sm font-medium px-2">
            {currentSlide + 1} / {totalSlides}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSlideChange('next')}
            disabled={currentSlide === totalSlides - 1}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ChevronRightIcon size={20} />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Regular editing mode with enhanced UI
  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-semibold text-lg">Presentation Editor</h3>
            <span className="text-sm text-gray-500">
              {totalSlides} slide{totalSlides !== 1 ? 's' : ''} • {currentTheme.name} theme
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className="gap-2"
          >
            🎨 Theme
          </Button>
          
          {isCurrentVersion && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
          )}
          
          <Button
            variant="default"
            size="sm"
            onClick={() => setMetadata(prev => ({ ...prev, isPresenting: true }))}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <PlayIcon size={16} />
            Present
          </Button>
        </div>
      </div>

      {/* Theme Selector */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b bg-white p-4"
          >
            <h4 className="font-medium mb-3">Choose a Theme</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PREDEFINED_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => handleThemeChange(theme)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-left",
                    theme.name === currentTheme.name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className="w-full h-8 rounded mb-2"
                    style={{ background: theme.background }}
                  />
                  <div className="text-sm font-medium">{theme.name}</div>
                  <div className="flex gap-1 mt-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: theme.secondary }}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-blue-50">
              <div className="text-sm text-blue-700 mb-2">
                📝 Use Markdown syntax. Separate slides with "---"
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setEditContent(content);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 p-4 resize-none outline-none font-mono text-sm bg-gray-50"
              placeholder="# My Presentation Title

Welcome to my presentation content...

---

# Real Estate Listings

Use the 🏠 toolbar button to add property listings automatically, or format manually:

![Property Image](https://images.unsplash.com/photo-1506744038136-46273834b3fb)
**$450,000 - 123 Main St, Buffalo NY**
- 3 beds, 2 baths, 1,900 sqft
- Single Family Home - Active

---

# Market Analysis

- Average Price: $515,000
- Active Listings: 25 properties
- Most Popular: Single Family Homes

---

# Conclusion

Key takeaways and next steps..."
            />
          </div>
        ) : (
          <div className="h-full overflow-auto">
            {/* Enhanced slide navigation */}
            <div className="flex items-center justify-between p-4 border-b" style={{ background: `linear-gradient(90deg, ${currentTheme.primary}10, ${currentTheme.secondary}10)` }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSlideChange('prev')}
                disabled={currentSlide === 0}
                className="gap-2"
              >
                <ChevronLeftIcon size={16} />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Slide {currentSlide + 1} of {totalSlides}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalSlides }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setMetadata(prev => ({ ...prev, currentSlide: i }))}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i === currentSlide ? "scale-125" : "hover:scale-110"
                      )}
                      style={{
                        backgroundColor: i === currentSlide ? currentTheme.primary : `${currentTheme.primary}40`
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSlideChange('next')}
                disabled={currentSlide === totalSlides - 1}
                className="gap-2"
              >
                Next
                <ChevronRightIcon size={16} />
              </Button>
            </div>

            {/* Beautiful slide preview */}
            <div className="p-8 min-h-[500px] flex items-center justify-center" style={{ background: currentTheme.background }}>
              <motion.div 
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-5xl aspect-video bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl flex items-center justify-center overflow-auto"
                style={{
                  border: `3px solid ${currentTheme.primary}`,
                }}
              >
                <div className="w-full h-full p-8 flex flex-col justify-center items-center text-center">
                  {slides[currentSlide] || [
                    <p key="empty" className="text-xl text-gray-500">No content for this slide</p>
                  ]}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 