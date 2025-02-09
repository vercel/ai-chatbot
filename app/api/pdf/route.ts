import fs from 'fs';
import path from 'path';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import * as vercelBlob from '@vercel/blob';
import { db } from '../../../lib/drizzle';
import { pdfUploads, chat } from '../../../db/schema';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get the chatId from the request, if it exists
    const { chatId } = await req.json();

    // Construct the path to the PDF file
    const pdfPath = path.join(process.cwd(), 'data', 'ai.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Upload the PDF to Vercel Blob using a cast to any
    const blobResponse = await (vercelBlob as any).upload(pdfBuffer, {
      contentType: 'application/pdf'
    });
    const pdfUrl = blobResponse.url;
    const size = pdfBuffer.length;

    // Store PDF metadata in the database
    await db.insert(pdfUploads).values({
      url: pdfUrl,
      mimeType: 'application/pdf',
      size,
      createdAt: new Date()
    });

    // Construct the message payload using the PDF URL
    const userMessage = {
      role: 'user',
      content: 'What is an embedding model according to this document?',
      attachments: [{
        url: pdfUrl,
        name: 'document.pdf',
        contentType: 'application/pdf',
        size
      }]
    };

    const response = await generateText({
      model: google('gemini-2.0-flash-001') as any,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'What is an embedding model according to this document?'
          },
          {
            type: 'file',
            data: pdfUrl,
            mimeType: 'application/pdf'
          }
        ]
      }] as any
    });

    // Create or update chat with both messages
    const messages = [
      userMessage,
      {
        role: 'assistant',
        content: response.text
      }
    ];

    if (chatId) {
      // Update existing chat
      await db.update(chat)
        .set({
          messages: messages,
          lastMessageAt: new Date()
        })
        .where({ id: chatId });
    } else {
      // Create new chat
      await db.insert(chat).values({
        userId: session.user.id,
        messages: messages,
        lastMessageAt: new Date()
      });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
} 