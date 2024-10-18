import { createContext } from 'react';

export const UserContext = createContext({
  user: null,
  setUser: (user: any) => {
    console.log('Setting user', user);
    user = user;
  },
});