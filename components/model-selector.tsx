 'use client';
 
 import * as React from 'react';
 import useSWR from 'swr';
 import { usePathname, useRouter } from 'next/navigation';
 import { type ChatModel, getStaticModels } from '@/lib/ai/models';
 import { Button } from '@/components/ui/button';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuRadioGroup,
   DropdownMenuRadioItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { ChevronDownIcon } from './icons';
  
 interface ModelSelectorProps extends React.ComponentProps<'div'> {
   initialModel: string;
 }
 
 async function fetcher(url: string) {
   const res = await fetch(url);
   if (!res.ok) {
     throw new Error('Failed to fetch models');
   }
   const { models } = await res.json();
   return models as ChatModel[];
 }
 
 export function ModelSelector({ initialModel, ...props }: ModelSelectorProps) {
   const [selectedModel, setSelectedModel] = React.useState<string>(initialModel);
   const router = useRouter();
   const pathname = usePathname();
 
   const { data: dynamicModels = getStaticModels(), error, isLoading } = useSWR<ChatModel[]>('/api/models', fetcher, {
     fallbackData: getStaticModels(),
     revalidateOnFocus: false,
     revalidateIfStale: false,
   });
 
   const models = dynamicModels;
   const activeModel = models.find(model => model.id === selectedModel);
 
   const handleModelChange = async (modelId: string) => {
     setSelectedModel(modelId);
     try {
       await fetch('/api/chat/save-model', {
         method: 'POST',
         body: JSON.stringify({ model: modelId }),
         headers: { 'Content-Type': 'application/json' },
       });
     } catch (err) {
       console.error('Failed to save model:', err);
     }
     if (pathname === '/') {
       router.refresh();
     }
   };
 
   if (isLoading && !dynamicModels) {
     return (
       <div {...props} className="text-muted-foreground text-sm">
         Loading models...
       </div>
     );
   }
 
   return (
     <div {...props}>
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button variant="ghost" className="w-full justify-start" disabled={isLoading}>
             <div className="flex items-center justify-between w-full">
               <div className="flex flex-col items-start">
                 <span className="font-medium">{activeModel?.name || 'Select Model'}</span>
                 <span className="text-xs text-muted-foreground">
                   {activeModel?.description || (error ? 'Using static models' : '')}
                 </span>
               </div>
               <ChevronDownIcon size={16} />
             </div>
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent className="w-80">
           <DropdownMenuLabel>Select a model</DropdownMenuLabel>
           <DropdownMenuSeparator />
           <DropdownMenuRadioGroup
             value={selectedModel}
             onValueChange={handleModelChange}
           >
             {models.map((model: ChatModel) => (
               <DropdownMenuRadioItem key={model.id} value={model.id}>
                 <div className="flex flex-col">
                   <span className="font-medium">{model.name}</span>
                   <span className="text-xs text-muted-foreground">
                     {model.description}
                   </span>
                 </div>
               </DropdownMenuRadioItem>
             ))}
           </DropdownMenuRadioGroup>
         </DropdownMenuContent>
       </DropdownMenu>
     </div>
   );
 }