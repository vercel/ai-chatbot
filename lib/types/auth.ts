export type UserType = 'guest' | 'regular';

export interface User {
  id: string;
  email?: string | null;
  type: UserType;
}

export interface Session {
  user: User;
  expires: string;
} 