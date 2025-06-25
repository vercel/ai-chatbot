import React from 'react';
import { getOAuthUserNameInitials } from '@ai-chat/auth/use-auth-config';

export const Avatar = () => {
  return (
    <div
      className="flex
      items-center 
      justify-center
      shrink-0 
      rounded-full 
      bg-gradient-to-r
      from-[#2675b5]
      to-[#d4e7f7]
      w-[2rem]
      h-[2rem]
      font-bold
      text-sm
      text-[#14181f]"
      aria-hidden="true"
    >
      {getOAuthUserNameInitials()}
    </div>
  );
};
