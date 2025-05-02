import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// Collection references
const chatsCollection = 'chats';
const messagesCollection = 'messages';
const artifactsCollection = 'artifacts';
const usersCollection = 'users';

// Types for our data models
export interface Chat {
  id?: string;
  title: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
  isShared?: boolean;
  modelId?: string;
}

export interface Message {
  id?: string;
  chatId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: any;
  reasoning?: string;
  attachments?: Array<Attachment>;
}

export interface Attachment {
  url: string;
  name: string;
  contentType: string;
}

export interface Artifact {
  id?: string;
  chatId: string;
  userId: string;
  type: 'code' | 'image' | 'text' | 'sheet';
  title: string;
  content: string;
  createdAt: any;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
  createdAt: any;
}

// Utility functions for chats
export async function createChat(
  userId: string,
  data: Partial<Chat>,
): Promise<string> {
  const chatData: Chat = {
    title: data.title || 'New Chat',
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isShared: data.isShared || false,
    modelId: data.modelId,
  };

  const docRef = await addDoc(collection(db, chatsCollection), chatData);
  return docRef.id;
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const chatRef = doc(db, chatsCollection, chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    return null;
  }

  return { id: chatSnap.id, ...chatSnap.data() } as Chat;
}

export async function getUserChats(userId: string): Promise<Chat[]> {
  const q = query(
    collection(db, chatsCollection),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Chat,
  );
}

export async function updateChat(
  chatId: string,
  data: Partial<Chat>,
): Promise<void> {
  const chatRef = doc(db, chatsCollection, chatId);
  await updateDoc(chatRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteChat(chatId: string): Promise<void> {
  const chatRef = doc(db, chatsCollection, chatId);
  await deleteDoc(chatRef);

  // Delete all messages in the chat
  const messagesQuery = query(
    collection(db, messagesCollection),
    where('chatId', '==', chatId),
  );

  const messagesSnapshot = await getDocs(messagesQuery);
  const deletePromises = messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

// Utility functions for messages
export async function createMessage(
  data: Omit<Message, 'createdAt'>,
): Promise<string> {
  const messageData = {
    ...data,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, messagesCollection), messageData);
  return docRef.id;
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const q = query(
    collection(db, messagesCollection),
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc'),
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Message,
  );
}

// Utility functions for artifacts
export async function createArtifact(
  data: Omit<Artifact, 'createdAt'>,
): Promise<string> {
  const artifactData = {
    ...data,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, artifactsCollection),
    artifactData,
  );
  return docRef.id;
}

export async function getArtifact(
  artifactId: string,
): Promise<Artifact | null> {
  const artifactRef = doc(db, artifactsCollection, artifactId);
  const artifactSnap = await getDoc(artifactRef);

  if (!artifactSnap.exists()) {
    return null;
  }

  return { id: artifactSnap.id, ...artifactSnap.data() } as Artifact;
}

export async function getChatArtifacts(chatId: string): Promise<Artifact[]> {
  const q = query(
    collection(db, artifactsCollection),
    where('chatId', '==', chatId),
    orderBy('createdAt', 'desc'),
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Artifact,
  );
}

export async function getUserArtifacts(userId: string): Promise<Artifact[]> {
  const q = query(
    collection(db, artifactsCollection),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Artifact,
  );
}

export async function updateArtifact(
  artifactId: string,
  data: Partial<Artifact>,
): Promise<void> {
  const artifactRef = doc(db, artifactsCollection, artifactId);
  await updateDoc(artifactRef, data);
}

export async function deleteArtifact(artifactId: string): Promise<void> {
  const artifactRef = doc(db, artifactsCollection, artifactId);
  await deleteDoc(artifactRef);
}
