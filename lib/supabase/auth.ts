import { createServerClient } from './client';
import { cookies } from 'next/headers';
import { generateHashedPassword } from '../db/utils';
import { generateId } from 'ai';

export type UserType = 'guest' | 'regular';

export interface User {
  id: string;
  email: string;
  type: UserType;
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  const supabase = createServerClient();
  
  // First check if the user exists
  const { data: users, error: fetchError } = await supabase
    .from('User')
    .select('*')
    .eq('email', email)
    .limit(1);
  
  if (fetchError || users.length === 0) {
    return null;
  }
  
  const user = users[0];
  
  // Verify password
  const bcrypt = require('bcrypt-ts');
  const passwordsMatch = await bcrypt.compare(password, user.password);
  
  if (!passwordsMatch) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    type: 'regular'
  };
}

export async function createGuestUser(): Promise<User> {
  const supabase = createServerClient();
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateId());
  
  const { data, error } = await supabase
    .from('User')
    .insert({ email, password })
    .select('id, email')
    .single();
  
  if (error) {
    throw new Error('Failed to create guest user');
  }
  
  return {
    id: data.id,
    email: data.email,
    type: 'guest'
  };
}

export async function createUser(email: string, password: string): Promise<void> {
  const supabase = createServerClient();
  const hashedPassword = generateHashedPassword(password);
  
  const { error } = await supabase
    .from('User')
    .insert({ email, password: hashedPassword });
  
  if (error) {
    throw new Error('Failed to create user');
  }
}

export async function getUser(email: string): Promise<User | null> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    email: data.email,
    type: 'regular'
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    email: data.email,
    type: 'regular'
  };
}
