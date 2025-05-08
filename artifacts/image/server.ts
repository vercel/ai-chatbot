import { myProvider, getImageModelForProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { experimental_generateImage } from 'ai';
import { cookies } from 'next/headers';
import { getModelProvider } from '@/lib/ai/models';

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';
    
    try {
      // Get current model selection from cookies
      const cookieStore = await cookies();
      const modelId = cookieStore.get('chat-model')?.value || 'openai-gpt4o';
      
      // Determine provider and get corresponding image model
      const provider = getModelProvider(modelId);
      const imageModelId = getImageModelForProvider(provider);
      
      console.log(`Attempting to generate image using provider: ${provider}, model: ${imageModelId}`);
      
      try {
        // Try with the primary provider first
        const { image } = await experimental_generateImage({
          model: myProvider.imageModel(imageModelId),
          prompt: title,
          n: 1,
          // Add provider-specific options if needed
          ...(provider === 'openai' ? {
            size: '1024x1024',
            quality: 'standard',
          } : {}),
        });

        draftContent = image.base64;

        dataStream.writeData({
          type: 'image-delta',
          content: image.base64,
        });
        
        console.log(`Successfully generated image with ${provider}`);
        return draftContent;
      } catch (primaryError) {
        // If primary provider fails, try the alternative provider
        console.error(`Error with ${provider} image generation:`, primaryError);
        
        // Switch to alternative provider
        const altProvider = provider === 'openai' ? 'xai' : 'openai';
        const altImageModelId = getImageModelForProvider(altProvider);
        
        console.log(`Falling back to alternative provider: ${altProvider}, model: ${altImageModelId}`);
        
        dataStream.writeData({
          type: 'text-delta',
          content: `Primary provider (${provider}) failed. Trying with ${altProvider}...`,
        });
        
        try {
          // Try with alternative provider
          const { image } = await experimental_generateImage({
            model: myProvider.imageModel(altImageModelId),
            prompt: title,
            n: 1,
            // Add provider-specific options if needed
            ...(altProvider === 'openai' ? {
              size: '1024x1024',
              quality: 'standard',
            } : {}),
          });
          
          draftContent = image.base64;
          
          dataStream.writeData({
            type: 'image-delta',
            content: image.base64,
          });
          
          console.log(`Successfully generated image with fallback provider ${altProvider}`);
          return draftContent;
        } catch (altError) {
          // Both providers failed
          console.error(`Error with fallback provider ${altProvider}:`, altError);
          throw new Error(`Both providers failed to generate images. Please check your API keys and quotas.`);
        }
      }
    } catch (error) {
      console.error('Error generating image:', error);
      
      // Return error message in the dataStream
      dataStream.writeData({
        type: 'image-delta',
        content: 'Error generating image: ' + (error instanceof Error ? error.message : 'Unknown error occurred. Please try again with a different prompt.'),
      });
      
      // Return empty content to prevent further errors
      return '';
    }
  },
  onUpdateDocument: async ({ description, dataStream }) => {
    let draftContent = '';
    
    try {
      // Get current model selection from cookies
      const cookieStore = await cookies();
      const modelId = cookieStore.get('chat-model')?.value || 'openai-gpt4o';
      
      // Determine provider and get corresponding image model
      const provider = getModelProvider(modelId);
      const imageModelId = getImageModelForProvider(provider);
      
      console.log(`Attempting to update image using provider: ${provider}, model: ${imageModelId}`);
      
      try {
        // Try with the primary provider first
        const { image } = await experimental_generateImage({
          model: myProvider.imageModel(imageModelId),
          prompt: description,
          n: 1,
          // Add provider-specific options if needed
          ...(provider === 'openai' ? {
            size: '1024x1024',
            quality: 'standard',
          } : {}),
        });

        draftContent = image.base64;

        dataStream.writeData({
          type: 'image-delta',
          content: image.base64,
        });
        
        console.log(`Successfully updated image with ${provider}`);
        return draftContent;
      } catch (primaryError) {
        // If primary provider fails, try the alternative provider
        console.error(`Error with ${provider} image update:`, primaryError);
        
        // Switch to alternative provider
        const altProvider = provider === 'openai' ? 'xai' : 'openai';
        const altImageModelId = getImageModelForProvider(altProvider);
        
        console.log(`Falling back to alternative provider: ${altProvider}, model: ${altImageModelId}`);
        
        dataStream.writeData({
          type: 'text-delta',
          content: `Primary provider (${provider}) failed. Trying with ${altProvider}...`,
        });
        
        try {
          // Try with alternative provider
          const { image } = await experimental_generateImage({
            model: myProvider.imageModel(altImageModelId),
            prompt: description,
            n: 1,
            // Add provider-specific options if needed
            ...(altProvider === 'openai' ? {
              size: '1024x1024',
              quality: 'standard',
            } : {}),
          });
          
          draftContent = image.base64;
          
          dataStream.writeData({
            type: 'image-delta',
            content: image.base64,
          });
          
          console.log(`Successfully updated image with fallback provider ${altProvider}`);
          return draftContent;
        } catch (altError) {
          // Both providers failed
          console.error(`Error with fallback provider ${altProvider}:`, altError);
          throw new Error(`Both providers failed to update image. Please check your API keys and quotas.`);
        }
      }
    } catch (error) {
      console.error('Error updating image:', error);
      
      // Return error message in the dataStream
      dataStream.writeData({
        type: 'image-delta',
        content: 'Error updating image: ' + (error instanceof Error ? error.message : 'Unknown error occurred. Please try again with a different prompt.'),
      });
      
      // Return empty content to prevent further errors
      return '';
    }
  },
});
