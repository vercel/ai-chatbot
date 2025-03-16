'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, File, Headphones, Globe, FileText, Youtube } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function KnowledgeCategories() {
  const router = useRouter();
  
  const categories = [
    {
      id: 'text-documents',
      title: 'Text Documents',
      description: 'Browse all text-based documents including plain text, PDFs, and web articles',
      icon: <FileText className="h-10 w-10 text-hunter_green-500" />,
      path: '/knowledge/category/text'
    },
    {
      id: 'audio-files',
      title: 'Audio Files',
      description: 'Access audio recordings, videos, and transcripts',
      icon: <Headphones className="h-10 w-10 text-hunter_green-500" />,
      path: '/knowledge/category/audio'
    },
    {
      id: 'web-content',
      title: 'Web Content',
      description: 'Links to websites and external resources',
      icon: <Globe className="h-10 w-10 text-hunter_green-500" />,
      path: '/knowledge/category/web'
    },
    {
      id: 'all-documents',
      title: 'All Documents',
      description: 'View all knowledge resources in one place',
      icon: <BookOpen className="h-10 w-10 text-hunter_green-500" />,
      path: '/knowledge'
    }
  ];
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Knowledge Base</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(category => (
          <Card key={category.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-3">
              {category.icon}
              <div>
                <CardTitle>{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </div>
            </CardHeader>
            <CardFooter>
              <Button 
                className="w-full bg-hunter_green-500 hover:bg-hunter_green-600"
                onClick={() => router.push(category.path)}
              >
                Browse {category.title}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* This would be populated with actual recent documents */}
          {[1, 2, 3].map(i => (
            <Card key={i} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-md">Sample Document {i}</CardTitle>
                <CardDescription>Added yesterday</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" className="w-full">View</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Button 
          variant="outline" 
          className="border-hunter_green-500 text-hunter_green-500 hover:bg-hunter_green-50"
          onClick={() => router.push('/knowledge/upload')}
        >
          Upload New Document
        </Button>
      </div>
    </div>
  );
}
